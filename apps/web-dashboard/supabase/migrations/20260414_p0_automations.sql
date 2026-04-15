-- ============================================================
-- P0 Automations: Loyalty, Marketplace Packs, Scheduled Orders, Reservations
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- P0.1 — Loyalty Points Auto-Earn on Payment
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.award_loyalty_points_on_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_program loyalty_programs%ROWTYPE;
  v_points  INTEGER;
  v_cl_id   UUID;
BEGIN
  -- Guard: payment_status just changed to 'paid'
  IF NOT (NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid') THEN
    RETURN NEW;
  END IF;

  -- Guard: restaurant has loyalty enabled
  IF NOT EXISTS (
    SELECT 1 FROM restaurants WHERE id = NEW.restaurant_id AND loyalty_enabled = true
  ) THEN
    RETURN NEW;
  END IF;

  -- Guard: order has a customer
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find active loyalty program for this restaurant
  SELECT * INTO v_program
  FROM loyalty_programs WHERE restaurant_id = NEW.restaurant_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate points: 1 point per FCFA (configurable via points_per_fcfa)
  v_points := GREATEST(1, FLOOR(NEW.total::numeric * v_program.points_per_fcfa));

  -- Upsert customer_loyalty (create if not exists, update points if exists)
  INSERT INTO customer_loyalty (customer_id, restaurant_id, points_balance, total_points_earned)
  VALUES (NEW.customer_id, NEW.restaurant_id, v_points, v_points)
  ON CONFLICT (customer_id, restaurant_id) DO UPDATE SET
    points_balance      = customer_loyalty.points_balance + v_points,
    total_points_earned = customer_loyalty.total_points_earned + v_points,
    updated_at          = now()
  RETURNING id INTO v_cl_id;

  -- If INSERT returns NULL, fetch the UPSERT'd ID
  IF v_cl_id IS NULL THEN
    SELECT id INTO v_cl_id
    FROM customer_loyalty
    WHERE customer_id = NEW.customer_id AND restaurant_id = NEW.restaurant_id;
  END IF;

  -- Record the transaction in loyalty_transactions (earn type)
  INSERT INTO loyalty_transactions (customer_loyalty_id, points, type, order_id, description)
  VALUES (v_cl_id, v_points, 'earn', NEW.id, 'Points crédités pour commande');

  -- Mark the order with earned points
  UPDATE orders SET loyalty_points_earned = v_points WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_loyalty_points
AFTER UPDATE OF payment_status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.award_loyalty_points_on_payment();

-- ────────────────────────────────────────────────────────────
-- P0.2 — Marketplace Pack Auto-Expiration Cron Job
-- ────────────────────────────────────────────────────────────
-- The function marketplace_expire_packs() exists. Ensure cron is active.

SELECT cron.schedule(
  'marketplace-expire-packs',
  '0 * * * *',   -- every hour
  $$ SELECT public.marketplace_expire_packs(); $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '0 * * * *';

-- ────────────────────────────────────────────────────────────
-- P0.3 — Scheduled Orders Auto-Transition
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.transition_scheduled_orders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE orders
  SET status = 'pending', updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_for IS NOT NULL
    AND scheduled_for <= now();
END;
$$;

SELECT cron.schedule(
  'transition-scheduled-orders',
  '*/15 * * * *',   -- every 15 minutes
  $$ SELECT public.transition_scheduled_orders(); $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '*/15 * * * *';

-- ────────────────────────────────────────────────────────────
-- P0.4 — Reservation Reminders Cron Job
-- ────────────────────────────────────────────────────────────
-- Calls engagement-cron Edge Function hourly with action=reservation_reminders

SELECT cron.schedule(
  'reservation-reminders',
  '0 * * * *',   -- every hour
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1)
           || '/functions/v1/engagement-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{"action":"reservation_reminders"}'::jsonb
  );
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '0 * * * *';
