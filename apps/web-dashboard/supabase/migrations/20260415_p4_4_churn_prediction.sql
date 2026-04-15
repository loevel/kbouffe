-- ============================================================
-- P4.4 — Churn Prediction & Retention Automation
-- ============================================================

CREATE OR REPLACE FUNCTION public.predict_customer_churn()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer RECORD;
  v_risk_score NUMERIC;
  v_reason TEXT;
  v_days_inactive INT;
  v_order_count INT;
  v_avg_frequency NUMERIC;
  v_recent_spent INTEGER;
  v_avg_spent INTEGER;
  v_last_order_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Process each customer with order history
  FOR v_customer IN
    SELECT DISTINCT u.id as customer_id, o.restaurant_id
    FROM users u
    JOIN orders o ON u.id = o.customer_id
    WHERE u.role = 'customer'
      AND o.created_at >= now() - INTERVAL '180 days'
    GROUP BY u.id, o.restaurant_id
    HAVING COUNT(o.id) >= 2  -- Only customers with 2+ orders
  LOOP
    v_risk_score := 0.0;
    v_reason := '';

    -- Get customer's order statistics
    SELECT
      COUNT(o.id),
      MAX(o.created_at),
      AVG(o.total)::INTEGER,
      SUM(CASE WHEN o.created_at >= now() - INTERVAL '30 days' THEN o.total ELSE 0 END)::INTEGER
    INTO
      v_order_count,
      v_last_order_date,
      v_avg_spent,
      v_recent_spent
    FROM orders o
    WHERE o.customer_id = v_customer.customer_id
      AND o.restaurant_id = v_customer.restaurant_id;

    -- Calculate days since last order
    v_days_inactive := EXTRACT(DAY FROM (now() - v_last_order_date))::INT;

    -- Factor 1: Recency (days since last order) — strongest predictor
    IF v_days_inactive > 90 THEN
      v_risk_score := v_risk_score + 0.5;
      v_reason := v_reason || 'No orders in 90+ days, ';
    ELSIF v_days_inactive > 60 THEN
      v_risk_score := v_risk_score + 0.35;
      v_reason := v_reason || 'No orders in 60+ days, ';
    ELSIF v_days_inactive > 30 THEN
      v_risk_score := v_risk_score + 0.2;
      v_reason := v_reason || 'No orders in 30+ days, ';
    END IF;

    -- Factor 2: Frequency decline
    SELECT COUNT(o.id)::NUMERIC INTO v_order_count
    FROM orders o
    WHERE o.customer_id = v_customer.customer_id
      AND o.restaurant_id = v_customer.restaurant_id
      AND o.created_at >= now() - INTERVAL '30 days';

    SELECT COUNT(o.id)::NUMERIC INTO v_avg_frequency
    FROM orders o
    WHERE o.customer_id = v_customer.customer_id
      AND o.restaurant_id = v_customer.restaurant_id
      AND o.created_at >= now() - INTERVAL '90 days';

    IF v_avg_frequency > 0 AND v_order_count < (v_avg_frequency / 3.0) THEN
      v_risk_score := v_risk_score + 0.25;
      v_reason := v_reason || 'Order frequency declining, ';
    END IF;

    -- Factor 3: Spending decline
    IF v_recent_spent < (v_avg_spent * 0.5) AND v_recent_spent IS NOT NULL THEN
      v_risk_score := v_risk_score + 0.2;
      v_reason := v_reason || 'Spending below average, ';
    END IF;

    -- Factor 4: Negative feedback pattern
    IF EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.customer_id = v_customer.customer_id
        AND r.restaurant_id = v_customer.restaurant_id
        AND r.rating < 3
        AND r.created_at >= now() - INTERVAL '30 days'
    ) THEN
      v_risk_score := v_risk_score + 0.15;
      v_reason := v_reason || 'Recent negative feedback, ';
    END IF;

    -- Normalize score to 0-1
    v_risk_score := LEAST(GREATEST(v_risk_score, 0.0), 1.0);
    v_reason := TRIM(TRAILING ', ' FROM v_reason);

    -- Insert or update churn prediction
    INSERT INTO churn_predictions (
      customer_id,
      restaurant_id,
      risk_score,
      last_order_date,
      days_inactive,
      reason,
      retention_offer_sent,
      created_at,
      updated_at
    ) VALUES (
      v_customer.customer_id,
      v_customer.restaurant_id,
      v_risk_score,
      v_last_order_date,
      v_days_inactive,
      v_reason,
      false,
      now(),
      now()
    )
    ON CONFLICT (customer_id, restaurant_id) DO UPDATE SET
      risk_score = v_risk_score,
      last_order_date = v_last_order_date,
      days_inactive = v_days_inactive,
      reason = v_reason,
      updated_at = now();

    -- Auto-send retention offer if high risk (>0.7) and not sent recently
    IF v_risk_score > 0.7 AND NOT EXISTS (
      SELECT 1 FROM promotions p
      WHERE p.restaurant_id = v_customer.restaurant_id
        AND p.target_segment = 'retention'
        AND jsonb_build_object('customer_id', v_customer.customer_id) = p.target_segment::jsonb
        AND p.created_at >= now() - INTERVAL '30 days'
    ) THEN
      -- Create retention promotion (20% discount)
      INSERT INTO promotions (
        restaurant_id,
        code,
        type,
        value,
        target_segment,
        is_active,
        starts_at,
        ends_at,
        created_at
      ) VALUES (
        v_customer.restaurant_id,
        format('RETAIN_%s_%s',
          SUBSTRING(MD5(v_customer.customer_id::text || v_customer.restaurant_id::text), 1, 8),
          TO_CHAR(now(), 'DDMM')
        ),
        'percentage',
        20,
        'retention',
        true,
        now(),
        now() + INTERVAL '14 days',
        now()
      );

      -- Notify restaurant about at-risk customer
      INSERT INTO restaurant_notifications (
        restaurant_id,
        type,
        title,
        body,
        payload
      ) VALUES (
        v_customer.restaurant_id,
        'at_risk_customer',
        'Client à risque détecté',
        format('Score de risque: %.0f%% - Dernière commande: %s', v_risk_score * 100, TO_CHAR(v_last_order_date, 'DD/MM/YYYY')),
        jsonb_build_object(
          'customer_id', v_customer.customer_id,
          'risk_score', v_risk_score,
          'reason', v_reason
        )
      );

      -- Mark that offer has been sent
      UPDATE churn_predictions
      SET retention_offer_sent = true
      WHERE customer_id = v_customer.customer_id
        AND restaurant_id = v_customer.restaurant_id;
    END IF;
  END LOOP;
END;
$$;

-- Schedule daily at 2 AM UTC
SELECT cron.schedule('predict-churn', '0 2 * * *',
  $$ SELECT public.predict_customer_churn(); $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '0 2 * * *';
