-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 1: Trigger KYC approuvé → is_published = true + notification
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_kyc_approved_auto_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kyc_status = 'approved' AND (OLD.kyc_status IS DISTINCT FROM 'approved') THEN
    NEW.is_published := true;
    INSERT INTO public.admin_notifications (type, title, message, target_url)
    VALUES (
      'kyc_auto_published',
      '✅ KYC approuvé — restaurant publié automatiquement',
      'Le restaurant « ' || NEW.name || ' » a passé la vérification KYC et a été publié automatiquement.',
      '/admin/restaurants/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kyc_approved_auto_publish ON public.restaurants;
CREATE TRIGGER trg_kyc_approved_auto_publish
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_kyc_approved_auto_publish();

-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 3: pg_cron — fermeture auto des tickets > 7 jours
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_auto_close_stale_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.support_tickets
  SET
    status      = 'auto_closed',
    resolved_at = NOW()
  WHERE
    status = 'open'
    AND (
      (last_replied_at IS NULL     AND created_at      < NOW() - INTERVAL '7 days')
      OR (last_replied_at IS NOT NULL AND last_replied_at < NOW() - INTERVAL '7 days')
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO public.admin_notifications (type, title, message, target_url)
    VALUES (
      'tickets_auto_closed',
      '🎫 ' || v_count || ' ticket(s) fermé(s) automatiquement',
      v_count || ' ticket(s) sans réponse depuis 7+ jours ont été fermés automatiquement.',
      '/admin/support'
    );
  END IF;
END;
$$;

SELECT cron.schedule(
  'auto-close-stale-tickets',
  '0 2 * * *',
  'SELECT public.fn_auto_close_stale_tickets()'
) WHERE NOT EXISTS (SELECT FROM cron.job WHERE jobname = 'auto-close-stale-tickets');

-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 7: pg_cron — payouts hebdomadaires automatiques (chaque lundi)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_auto_create_weekly_payouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_week_end   DATE;
  v_amount     INTEGER;
  v_count      INTEGER := 0;
  r            RECORD;
BEGIN
  v_week_start := date_trunc('week', NOW() - INTERVAL '1 week')::date;
  v_week_end   := (date_trunc('week', NOW()) - INTERVAL '1 day')::date;

  FOR r IN
    SELECT id, COALESCE(commission_rate, 0.15) AS commission_rate
    FROM public.restaurants
    WHERE is_published = true
  LOOP
    SELECT COALESCE(
      SUM(FLOOR(o.total::float * (1.0 - r.commission_rate)))::integer,
      0
    )
    INTO v_amount
    FROM public.orders o
    WHERE
      o.restaurant_id = r.id
      AND o.payment_status::text = 'paid'
      AND o.status::text != 'cancelled'
      AND o.created_at::date BETWEEN v_week_start AND v_week_end;

    IF v_amount > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.payouts p
        WHERE p.restaurant_id = r.id
          AND p.period_start = v_week_start
          AND p.period_end   = v_week_end
      )
    THEN
      INSERT INTO public.payouts (restaurant_id, amount, status, period_start, period_end)
      VALUES (r.id, v_amount, 'pending', v_week_start, v_week_end);
      v_count := v_count + 1;
    END IF;
  END LOOP;

  IF v_count > 0 THEN
    INSERT INTO public.admin_notifications (type, title, message, target_url)
    VALUES (
      'payouts_auto_created',
      '💰 ' || v_count || ' payout(s) générés automatiquement',
      v_count || ' payout(s) créés pour la semaine du ' || v_week_start::text || ' au ' || v_week_end::text || '.',
      '/admin/billing/payouts'
    );
  END IF;
END;
$$;

SELECT cron.schedule(
  'weekly-payout-scheduling',
  '0 10 * * 1',
  'SELECT public.fn_auto_create_weekly_payouts()'
) WHERE NOT EXISTS (SELECT FROM cron.job WHERE jobname = 'weekly-payout-scheduling');

-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 8: VIEW → MATERIALIZED VIEW + refresh toutes les 15 min
-- ═══════════════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.platform_global_metrics;

CREATE MATERIALIZED VIEW public.platform_global_metrics AS
SELECT
  COUNT(DISTINCT r.id)                                                     AS total_restaurants,
  COUNT(DISTINCT CASE WHEN r.is_published THEN r.id END)                   AS active_restaurants,
  COALESCE(SUM(o.total), 0)::bigint                                        AS total_gmv,
  COUNT(o.id)                                                               AS total_orders,
  COUNT(DISTINCT o.customer_id)                                             AS total_unique_customers,
  (SELECT COUNT(*) FROM public.users WHERE role::text IN ('CLIENT','customer')) AS total_clients,
  (SELECT COUNT(*) FROM public.users WHERE role::text = 'merchant')         AS total_merchants,
  (SELECT COUNT(*) FROM public.users)                                        AS total_users,
  NOW()                                                                      AS refreshed_at
FROM public.restaurants r
LEFT JOIN public.orders o
  ON o.restaurant_id = r.id
  AND o.payment_status::text = 'paid';

CREATE UNIQUE INDEX idx_platform_global_metrics_singleton
  ON public.platform_global_metrics ((true));

SELECT cron.schedule(
  'refresh-platform-metrics',
  '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.platform_global_metrics'
) WHERE NOT EXISTS (SELECT FROM cron.job WHERE jobname = 'refresh-platform-metrics');
