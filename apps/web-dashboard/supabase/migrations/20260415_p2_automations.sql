-- ============================================================
-- P2 Automations: Communications, Analytics, Payments
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- P2.1 — Auto-Queue Email Notifications on Order Status
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.queue_email_on_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
  v_template TEXT;
  v_subject TEXT;
  v_body TEXT;
BEGIN
  -- Guard: Only queue for significant status changes
  IF NEW.status NOT IN ('confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Get customer email
  SELECT email INTO v_email FROM users WHERE id = NEW.customer_id;
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine email template and subject based on status
  CASE NEW.status
    WHEN 'confirmed' THEN
      v_template := 'order_confirmed';
      v_subject := format('Commande #%s confirmée', NEW.order_number);
      v_body := format('Votre commande a été confirmée. Numéro: %s', NEW.order_number);
    WHEN 'preparing' THEN
      v_template := 'order_preparing';
      v_subject := format('Commande #%s en préparation', NEW.order_number);
      v_body := 'Votre commande est en cours de préparation.';
    WHEN 'ready' THEN
      v_template := 'order_ready';
      v_subject := format('Commande #%s prête', NEW.order_number);
      v_body := 'Votre commande est prête !';
    WHEN 'on_the_way' THEN
      v_template := 'order_on_the_way';
      v_subject := format('Commande #%s en chemin', NEW.order_number);
      v_body := 'Votre commande est en route.';
    WHEN 'delivered' THEN
      v_template := 'order_delivered';
      v_subject := format('Commande #%s livrée', NEW.order_number);
      v_body := 'Votre commande a été livrée. Merci !';
    WHEN 'cancelled' THEN
      v_template := 'order_cancelled';
      v_subject := format('Commande #%s annulée', NEW.order_number);
      v_body := 'Votre commande a été annulée.';
  END CASE;

  -- Queue email in email_sends table
  INSERT INTO email_sends (
    recipient_email,
    order_id,
    email_type,
    subject,
    body,
    status,
    created_at
  ) VALUES (
    v_email,
    NEW.id,
    v_template,
    v_subject,
    v_body,
    'pending',
    now()
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_queue_email_on_order_status
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.queue_email_on_order_status_change();

-- ────────────────────────────────────────────────────────────
-- P2.2 — Auto-Queue SMS on Delivery Updates
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.queue_sms_on_delivery_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone TEXT;
  v_message TEXT;
BEGIN
  -- Only SMS for delivery status updates
  IF NEW.status NOT IN ('on_the_way', 'delivered', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Get customer phone from users table
  SELECT phone INTO v_phone FROM users WHERE id = NEW.customer_id;
  IF v_phone IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build SMS message based on status
  CASE NEW.status
    WHEN 'on_the_way' THEN
      v_message := format('Votre commande #%s est en chemin. Code: %s',
                         NEW.order_number, NEW.delivery_code);
    WHEN 'delivered' THEN
      v_message := format('Commande #%s livrée. Merci de votre commande !', NEW.order_number);
    WHEN 'cancelled' THEN
      v_message := format('Commande #%s annulée. Remboursement en cours.', NEW.order_number);
    ELSE
      RETURN NEW;
  END CASE;

  -- Queue SMS in admin_notifications table (as SMS queue)
  INSERT INTO admin_notifications (
    type,
    title,
    message,
    target_url
  ) VALUES (
    'sms_queue_' || NEW.status,
    format('SMS to %s', v_phone),
    v_message,
    format('sms://%s', v_phone)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_queue_sms_on_delivery
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.queue_sms_on_delivery_update();

-- ────────────────────────────────────────────────────────────
-- P2.3 — Auto-Generate Daily Restaurant Reports
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_daily_restaurant_reports()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_restaurant RECORD;
  v_today DATE;
  v_orders_count INT;
  v_revenue INT;
  v_avg_rating NUMERIC;
BEGIN
  v_today := CURRENT_DATE;

  -- Loop through all published restaurants
  FOR v_restaurant IN
    SELECT id, name FROM restaurants WHERE is_published = true
  LOOP
    -- Get today's orders count
    SELECT COUNT(*), COALESCE(SUM(total), 0)
    INTO v_orders_count, v_revenue
    FROM orders
    WHERE restaurant_id = v_restaurant.id
      AND DATE(created_at) = v_today
      AND payment_status = 'paid'
      AND status != 'cancelled';

    -- Get average rating from recent reviews
    SELECT AVG(rating)
    INTO v_avg_rating
    FROM reviews
    WHERE restaurant_id = v_restaurant.id
      AND created_at >= now() - INTERVAL '30 days';

    -- Create daily summary notification
    INSERT INTO restaurant_notifications (
      restaurant_id,
      type,
      title,
      body,
      payload
    ) VALUES (
      v_restaurant.id,
      'daily_summary',
      'Résumé du jour',
      format('%d commandes, %s FCFA de CA (Rating: %.1f/5)',
             v_orders_count, v_revenue, COALESCE(v_avg_rating, 0)),
      jsonb_build_object(
        'date', v_today,
        'orders_count', v_orders_count,
        'revenue', v_revenue,
        'avg_rating', v_avg_rating
      )
    );
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P2.4 — Auto-Calculate Weekly Payouts
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.calculate_weekly_payouts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_restaurant RECORD;
  v_calculation_date DATE;
  v_week_start DATE;
  v_orders_count INT;
  v_gross_revenue INT;
  v_platform_fee INT;
  v_net_amount INT;
BEGIN
  v_calculation_date := CURRENT_DATE;
  v_week_start := v_calculation_date - INTERVAL '7 days';

  -- Process all restaurants
  FOR v_restaurant IN
    SELECT DISTINCT restaurant_id FROM orders WHERE status = 'completed'
  LOOP
    -- Get completed orders from last 7 days
    SELECT
      COUNT(*),
      COALESCE(SUM(total), 0)
    INTO v_orders_count, v_gross_revenue
    FROM orders
    WHERE restaurant_id = v_restaurant.restaurant_id
      AND status = 'completed'
      AND completed_at >= v_week_start::timestamp
      AND completed_at < v_calculation_date::timestamp;

    IF v_orders_count > 0 THEN
      -- Calculate platform fee (10% of revenue)
      v_platform_fee := (v_gross_revenue::numeric * 0.10)::INTEGER;
      v_net_amount := v_gross_revenue - v_platform_fee;

      -- Insert payout calculation
      INSERT INTO payout_calculations (
        restaurant_id,
        calculation_date,
        orders_count,
        gross_revenue,
        platform_fee,
        net_amount,
        status
      ) VALUES (
        v_restaurant.restaurant_id,
        v_calculation_date,
        v_orders_count,
        v_gross_revenue,
        v_platform_fee,
        v_net_amount,
        'pending'
      )
      ON CONFLICT (restaurant_id, calculation_date) DO UPDATE SET
        orders_count = v_orders_count,
        gross_revenue = v_gross_revenue,
        platform_fee = v_platform_fee,
        net_amount = v_net_amount;

      -- Create payout event
      IF NOT EXISTS (
        SELECT 1 FROM payout_events
        WHERE restaurant_id = v_restaurant.restaurant_id
          AND created_at::date = v_calculation_date
      ) THEN
        INSERT INTO payout_events (
          restaurant_id,
          amount_fcfa,
          status,
          created_at
        ) VALUES (
          v_restaurant.restaurant_id,
          v_net_amount,
          'pending',
          now()
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P2.5 — Auto-Segment Customers by RFM
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_customer_segments()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer RECORD;
  v_segment TEXT;
  v_days_since INT;
  v_order_count INT;
  v_total_spent INT;
  v_avg_order INT;
BEGIN
  -- Process all customers with orders
  FOR v_customer IN
    SELECT DISTINCT customer_id, restaurant_id FROM orders WHERE customer_id IS NOT NULL
  LOOP
    -- Calculate RFM metrics
    SELECT
      COUNT(*),
      COALESCE(SUM(total), 0),
      FLOOR(EXTRACT(DAY FROM now() - MAX(created_at)))::INT,
      FLOOR(COALESCE(SUM(total), 0) / NULLIF(COUNT(*), 0))::INT
    INTO v_order_count, v_total_spent, v_days_since, v_avg_order
    FROM orders
    WHERE customer_id = v_customer.customer_id
      AND restaurant_id = v_customer.restaurant_id
      AND status IN ('completed', 'delivered');

    -- Determine segment
    IF v_days_since <= 7 AND v_order_count >= 5 THEN
      v_segment := 'vip';
    ELSIF v_days_since <= 30 AND v_order_count >= 3 THEN
      v_segment := 'loyal';
    ELSIF v_days_since > 90 AND v_order_count > 0 THEN
      v_segment := 'dormant';
    ELSIF v_order_count = 1 THEN
      v_segment := 'new';
    ELSIF v_days_since > 30 AND v_order_count < 3 THEN
      v_segment := 'at_risk';
    ELSE
      v_segment := 'loyal';
    END IF;

    -- Upsert customer segment
    INSERT INTO customer_segments (
      customer_id,
      restaurant_id,
      segment,
      order_count,
      total_spent,
      last_order_date,
      days_since_order,
      avg_order_value,
      updated_at
    ) VALUES (
      v_customer.customer_id,
      v_customer.restaurant_id,
      v_segment,
      v_order_count,
      v_total_spent,
      (SELECT MAX(created_at) FROM orders
       WHERE customer_id = v_customer.customer_id
         AND restaurant_id = v_customer.restaurant_id),
      v_days_since,
      v_avg_order,
      now()
    )
    ON CONFLICT (customer_id, restaurant_id) DO UPDATE SET
      segment = v_segment,
      order_count = v_order_count,
      total_spent = v_total_spent,
      days_since_order = v_days_since,
      avg_order_value = v_avg_order,
      updated_at = now();
  END LOOP;
END;
$$;