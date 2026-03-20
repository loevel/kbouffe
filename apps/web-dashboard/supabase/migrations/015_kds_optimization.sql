-- ============================================================
-- KBOUFFE — Migration 015: KDS Optimization
-- Calculated fields, optimized view, urgency triggers,
-- notification queue, and hardened RLS
-- Date: 2026-03-19
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Ensure wait_alert_threshold_minutes exists on restaurants
-- (may have been added manually, this is idempotent)
-- ============================================================
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS wait_alert_threshold_minutes INTEGER NOT NULL DEFAULT 15;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS daily_report_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS notification_info JSONB DEFAULT '{}';

-- ============================================================
-- 1. Helper function: elapsed minutes since order creation
--    Cannot use a generated column because NOW() is volatile.
--    A SQL function is the cleanest approach.
-- ============================================================

CREATE OR REPLACE FUNCTION public.order_elapsed_minutes(order_row public.orders)
RETURNS INTEGER
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT GREATEST(0, EXTRACT(EPOCH FROM (NOW() - order_row.created_at))::INTEGER / 60);
$$;

COMMENT ON FUNCTION public.order_elapsed_minutes IS
  'Computed field: minutes elapsed since order was created.
   Call via PostgREST as orders(elapsed_minutes:order_elapsed_minutes).';

-- ============================================================
-- 2. Helper function: is order urgent?
--    Joins to restaurants to read per-restaurant threshold.
-- ============================================================

CREATE OR REPLACE FUNCTION public.order_is_urgent(order_row public.orders)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT GREATEST(0, EXTRACT(EPOCH FROM (NOW() - order_row.created_at))::INTEGER / 60)
         >= COALESCE(r.wait_alert_threshold_minutes, 15)
  FROM public.restaurants r
  WHERE r.id = order_row.restaurant_id;
$$;

COMMENT ON FUNCTION public.order_is_urgent IS
  'Computed field: true when elapsed minutes >= restaurant threshold.
   Uses per-restaurant waitAlertThresholdMinutes setting.';

-- ============================================================
-- 3. Materialized view: KDS active orders
--    Pre-joins restaurant threshold, pre-computes elapsed + urgency.
--    Refreshed via trigger on order INSERT/UPDATE.
-- ============================================================

-- Drop if exists for idempotent migration
DROP MATERIALIZED VIEW IF EXISTS public.kds_active_orders;

CREATE MATERIALIZED VIEW public.kds_active_orders AS
SELECT
  o.id,
  o.restaurant_id,
  o.customer_name,
  o.customer_phone,
  o.items,
  o.status,
  o.delivery_type,
  o.table_number,
  o.table_id,
  o.covers,
  o.notes,
  o.preparation_time_minutes,
  o.scheduled_for,
  o.total,
  o.created_at,
  o.updated_at,
  -- Pre-computed fields
  GREATEST(0, EXTRACT(EPOCH FROM (NOW() - o.created_at))::INTEGER / 60) AS elapsed_minutes,
  GREATEST(0, EXTRACT(EPOCH FROM (NOW() - o.created_at))::INTEGER / 60)
    >= COALESCE(r.wait_alert_threshold_minutes, 15) AS is_urgent,
  r.wait_alert_threshold_minutes AS threshold_minutes
FROM public.orders o
JOIN public.restaurants r ON r.id = o.restaurant_id
WHERE o.status IN ('pending', 'accepted', 'preparing', 'ready')
ORDER BY o.created_at ASC;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS kds_active_orders_id_idx
  ON public.kds_active_orders(id);

CREATE INDEX IF NOT EXISTS kds_active_orders_restaurant_idx
  ON public.kds_active_orders(restaurant_id);

CREATE INDEX IF NOT EXISTS kds_active_orders_status_idx
  ON public.kds_active_orders(status);

CREATE INDEX IF NOT EXISTS kds_active_orders_restaurant_status_idx
  ON public.kds_active_orders(restaurant_id, status);

-- ============================================================
-- 4. Function to refresh the materialized view
-- ============================================================

CREATE OR REPLACE FUNCTION public.refresh_kds_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.kds_active_orders;
END;
$$;

-- ============================================================
-- 5. Trigger: auto-refresh KDS view on order changes
--    Only fires for status changes relevant to KDS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_refresh_kds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only refresh when an order enters or leaves KDS-visible statuses
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('pending', 'accepted', 'preparing', 'ready') THEN
      PERFORM public.refresh_kds_view();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.refresh_kds_view();
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('pending', 'accepted', 'preparing', 'ready') THEN
      PERFORM public.refresh_kds_view();
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER kds_refresh_on_order_change
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_refresh_kds();

-- ============================================================
-- 6. Alternative: Standard view (real-time compatible)
--    The materialized view above is good for read performance
--    but has a refresh cost. This standard view is always fresh
--    and works with Supabase Realtime (which cannot track MVs).
--    Use THIS for real-time subscriptions, the MV for bulk reads.
-- ============================================================

CREATE OR REPLACE VIEW public.vw_kds_orders AS
SELECT
  o.id,
  o.restaurant_id,
  o.customer_name,
  o.customer_phone,
  o.items,
  o.status,
  o.delivery_type,
  o.table_number,
  o.table_id,
  o.covers,
  o.notes,
  o.preparation_time_minutes,
  o.scheduled_for,
  o.total,
  o.created_at,
  o.updated_at,
  -- Computed live
  GREATEST(0, EXTRACT(EPOCH FROM (NOW() - o.created_at))::INTEGER / 60) AS elapsed_minutes,
  GREATEST(0, EXTRACT(EPOCH FROM (NOW() - o.created_at))::INTEGER / 60)
    >= COALESCE(r.wait_alert_threshold_minutes, 15) AS is_urgent,
  r.wait_alert_threshold_minutes AS threshold_minutes
FROM public.orders o
JOIN public.restaurants r ON r.id = o.restaurant_id
WHERE o.status IN ('pending', 'accepted', 'preparing', 'ready');

COMMENT ON VIEW public.vw_kds_orders IS
  'Live view for KDS screen. Computes elapsed_minutes and is_urgent
   from restaurant-specific thresholds. Always fresh, no refresh needed.';

-- ============================================================
-- 7. Notification queue table
--    Triggers insert here; Edge Function reads and sends.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kds_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'new_order', 'order_urgent', 'status_changed'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kds_notifications_unprocessed_idx
  ON public.kds_notifications(restaurant_id, processed)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS kds_notifications_created_idx
  ON public.kds_notifications(created_at DESC);

ALTER TABLE public.kds_notifications ENABLE ROW LEVEL SECURITY;

-- Only restaurant owners can read their notifications
CREATE POLICY "kds_notifications: owner read"
  ON public.kds_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = kds_notifications.restaurant_id
      AND restaurants.owner_id = (SELECT auth.uid())
    )
  );

-- Service role can insert/update (from triggers and Edge Functions)
CREATE POLICY "kds_notifications: service_role manage"
  ON public.kds_notifications FOR ALL
  TO service_role
  USING (true);

-- Enable Realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.kds_notifications;

-- ============================================================
-- 8. Trigger: enqueue notification on new order
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_kds_new_order_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.kds_notifications (restaurant_id, order_id, event_type, payload)
    VALUES (
      NEW.restaurant_id,
      NEW.id,
      'new_order',
      jsonb_build_object(
        'order_id', NEW.id,
        'customer_name', NEW.customer_name,
        'delivery_type', NEW.delivery_type,
        'total', NEW.total,
        'items_count', jsonb_array_length(NEW.items),
        'table_number', NEW.table_number,
        'scheduled_for', NEW.scheduled_for
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER kds_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_kds_new_order_notification();

-- ============================================================
-- 9. Trigger: enqueue notification on status change
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_kds_status_change_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.kds_notifications (restaurant_id, order_id, event_type, payload)
    VALUES (
      NEW.restaurant_id,
      NEW.id,
      'status_changed',
      jsonb_build_object(
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'customer_name', NEW.customer_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER kds_notify_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_kds_status_change_notification();

-- ============================================================
-- 10. Periodic urgency check function
--     Called by pg_cron or Edge Function cron to detect orders
--     that have just crossed the urgency threshold.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_and_notify_urgent_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  urgent_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT o.id AS order_id,
           o.restaurant_id,
           o.customer_name,
           o.delivery_type,
           GREATEST(0, EXTRACT(EPOCH FROM (NOW() - o.created_at))::INTEGER / 60) AS elapsed
    FROM public.orders o
    JOIN public.restaurants rest ON rest.id = o.restaurant_id
    WHERE o.status IN ('pending', 'accepted', 'preparing')
      AND GREATEST(0, EXTRACT(EPOCH FROM (NOW() - o.created_at))::INTEGER / 60)
          >= COALESCE(rest.wait_alert_threshold_minutes, 15)
      -- Only notify once: no existing unprocessed urgent notification
      AND NOT EXISTS (
        SELECT 1 FROM public.kds_notifications n
        WHERE n.order_id = o.id
          AND n.event_type = 'order_urgent'
          AND n.processed = false
      )
  LOOP
    INSERT INTO public.kds_notifications (restaurant_id, order_id, event_type, payload)
    VALUES (
      r.restaurant_id,
      r.order_id,
      'order_urgent',
      jsonb_build_object(
        'order_id', r.order_id,
        'customer_name', r.customer_name,
        'delivery_type', r.delivery_type,
        'elapsed_minutes', r.elapsed
      )
    );
    urgent_count := urgent_count + 1;
  END LOOP;

  RETURN urgent_count;
END;
$$;

COMMENT ON FUNCTION public.check_and_notify_urgent_orders IS
  'Scans active orders and creates urgency notifications for orders that
   crossed the restaurant-specific threshold. Safe to call repeatedly
   (deduplicates via NOT EXISTS). Call from pg_cron every 1-2 minutes.';

-- ============================================================
-- 11. Optimized RLS for orders (performance-hardened)
--     Replaces the subquery pattern with a function + index.
-- ============================================================

-- Fast lookup function: user's restaurant IDs
CREATE OR REPLACE FUNCTION public.get_user_restaurant_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.restaurants
  WHERE owner_id = (SELECT auth.uid())
  UNION
  SELECT restaurant_id FROM public.restaurant_members
  WHERE user_id = (SELECT auth.uid())
    AND status = 'active';
$$;

-- Composite index to support the KDS view query pattern
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_created
  ON public.orders(restaurant_id, status, created_at ASC)
  WHERE status IN ('pending', 'accepted', 'preparing', 'ready');

-- NOTE: The existing RLS policies on orders already use the optimized
-- (SELECT auth.uid()) pattern from migration 20260311. If you want to
-- further optimize with the function above, replace the policies:
--
-- DROP POLICY IF EXISTS "orders: lecture par restaurateur" ON public.orders;
-- CREATE POLICY "orders: lecture par restaurateur"
--   ON public.orders FOR SELECT
--   TO authenticated
--   USING (restaurant_id IN (SELECT public.get_user_restaurant_ids()));
--
-- DROP POLICY IF EXISTS "orders: update par restaurateur" ON public.orders;
-- CREATE POLICY "orders: update par restaurateur"
--   ON public.orders FOR UPDATE
--   TO authenticated
--   USING (restaurant_id IN (SELECT public.get_user_restaurant_ids()));
--
-- This is commented out because it changes security semantics
-- (adds restaurant_members access). Uncomment when ready.

-- ============================================================
-- 12. Cleanup: auto-purge old notifications (> 24h)
-- ============================================================

CREATE OR REPLACE FUNCTION public.purge_old_kds_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.kds_notifications
  WHERE created_at < NOW() - INTERVAL '24 hours'
    AND processed = true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMIT;
