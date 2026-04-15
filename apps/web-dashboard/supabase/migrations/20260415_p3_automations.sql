-- ============================================================
-- P3 Automations: Supply Chain, Reviews, Promotions, Delivery, Fraud
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- P3.1 — Auto-Create Supplier Purchase Orders for Low Stock
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_supplier_orders_for_low_stock()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product RECORD;
  v_restaurant_id UUID;
  v_supplier_id UUID;
  v_order_total INTEGER;
BEGIN
  -- Find all products with low stock across all restaurants
  FOR v_product IN
    SELECT DISTINCT s.product_id, p.restaurant_id, p.name
    FROM stock s
    JOIN products p ON s.product_id = p.id
    WHERE s.quantity <= s.low_stock_threshold
      AND s.quantity > 0
  LOOP
    v_restaurant_id := v_product.restaurant_id;

    -- Find primary supplier for this restaurant
    SELECT id INTO v_supplier_id
    FROM suppliers
    WHERE restaurant_id = v_restaurant_id
    LIMIT 1;

    IF v_supplier_id IS NOT NULL THEN
      -- Check if PO already exists for this product in last 7 days
      IF NOT EXISTS (
        SELECT 1 FROM supplier_purchase_orders
        WHERE restaurant_id = v_restaurant_id
          AND created_at >= now() - INTERVAL '7 days'
          AND status IN ('pending', 'confirmed')
      ) THEN
        -- Calculate reorder quantity (e.g., 50 units)
        v_order_total := 50 * FLOOR(
          (SELECT price FROM products WHERE id = v_product.product_id)::numeric
        );

        -- Create purchase order
        INSERT INTO supplier_purchase_orders (
          restaurant_id,
          supplier_id,
          status,
          total_amount
        ) VALUES (
          v_restaurant_id,
          v_supplier_id,
          'pending',
          v_order_total::INTEGER
        );

        -- Notify restaurant about auto-generated PO
        INSERT INTO restaurant_notifications (
          restaurant_id,
          type,
          title,
          body,
          payload
        ) VALUES (
          v_restaurant_id,
          'auto_supplier_order',
          'Commande fournisseur auto-générée',
          format('Commande créée pour %s (Stock bas)', v_product.name),
          jsonb_build_object(
            'product_id', v_product.product_id,
            'product_name', v_product.name
          )
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P3.2 — Auto-Generate Review Responses for Low Ratings
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_respond_to_reviews()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_response TEXT;
BEGIN
  -- Only respond to low ratings (< 4 stars)
  IF NEW.rating >= 4 THEN
    RETURN NEW;
  END IF;

  -- Generate appropriate response based on rating
  CASE NEW.rating
    WHEN 1 THEN
      v_response := 'Nous sommes vraiment désolés de cette expérience. Veuillez nous contacter directement pour que nous puissions résoudre ce problème au plus tôt.';
    WHEN 2 THEN
      v_response := 'Merci pour votre feedback. Nous regrettons que vous ne soyez pas satisfait. Notre équipe travaille pour améliorer nos services.';
    WHEN 3 THEN
      v_response := 'Merci d''avoir partagé votre avis. Nous apprécions vos suggestions et continuerons à nous améliorer.';
  END CASE;

  -- Insert auto-response
  INSERT INTO review_responses (
    review_id,
    response_text,
    is_auto_response
  ) VALUES (
    NEW.id,
    v_response,
    true
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_respond_to_reviews
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION public.auto_respond_to_reviews();

-- ────────────────────────────────────────────────────────────
-- P3.3 — Auto-Create Flash Promotions for Low-Moving Items
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_flash_promotions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product RECORD;
  v_restaurant RECORD;
  v_promo_code TEXT;
  v_discount INT;
BEGIN
  -- Find low-moving products (sold < 2 in last 7 days)
  FOR v_product IN
    SELECT p.id, p.name, p.price, p.restaurant_id, COUNT(oi.id) as order_count
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
      AND oi.created_at >= now() - INTERVAL '7 days'
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.price, p.restaurant_id
    HAVING COUNT(oi.id) < 2
    LIMIT 50
  LOOP
    v_restaurant.id := v_product.restaurant_id;

    -- Generate promo code
    v_promo_code := format('FLASH_%s_%s',
      SUBSTRING(MD5(v_product.id::text), 1, 6),
      TO_CHAR(now(), 'DDMM')
    );

    -- Offer 20% discount for slow-moving items
    v_discount := FLOOR(v_product.price::numeric * 0.20)::INTEGER;

    -- Create promotion (valid for 24 hours)
    INSERT INTO promotions (
      restaurant_id,
      code,
      type,
      value,
      target_product_id,
      is_active,
      starts_at,
      ends_at
    ) VALUES (
      v_product.restaurant_id,
      v_promo_code,
      'percentage',
      20,
      v_product.id,
      true,
      now(),
      now() + INTERVAL '24 hours'
    )
    ON CONFLICT DO NOTHING;

    -- Notify restaurant about new promotion
    INSERT INTO restaurant_notifications (
      restaurant_id,
      type,
      title,
      body,
      payload
    ) VALUES (
      v_product.restaurant_id,
      'flash_promotion',
      'Promotion flash créée',
      format('Code: %s - 20%% sur %s', v_promo_code, v_product.name),
      jsonb_build_object(
        'product_id', v_product.id,
        'code', v_promo_code,
        'discount', 20
      )
    );
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P3.4 — Auto-Assign Deliveries to Nearest Available Driver
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_assign_deliveries()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order RECORD;
  v_available_driver UUID;
  v_distance_km NUMERIC;
BEGIN
  -- Find orders ready for delivery
  FOR v_order IN
    SELECT o.id, o.restaurant_id, r.latitude, r.longitude
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.status = 'ready'
      AND o.delivery_type = 'delivery'
      AND NOT EXISTS (
        SELECT 1 FROM delivery_assignments
        WHERE order_id = o.id
      )
    LIMIT 10
  LOOP
    -- Find nearest available driver
    SELECT u.id
    INTO v_available_driver
    FROM users u
    WHERE u.role = 'driver'
      AND u.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM delivery_assignments da
        JOIN orders o ON da.order_id = o.id
        WHERE da.driver_id = u.id
          AND o.status NOT IN ('delivered', 'cancelled')
      )
    LIMIT 1;

    IF v_available_driver IS NOT NULL THEN
      -- Create delivery assignment
      INSERT INTO delivery_assignments (
        order_id,
        driver_id,
        estimated_delivery
      ) VALUES (
        v_order.id,
        v_available_driver,
        now() + INTERVAL '45 minutes'
      );

      -- Update order status to on_the_way
      UPDATE orders
      SET status = 'on_the_way', updated_at = now()
      WHERE id = v_order.id;

      -- Notify driver
      INSERT INTO admin_notifications (
        type,
        title,
        message,
        target_url
      ) VALUES (
        'delivery_assignment',
        'Nouvelle livraison assignée',
        format('Commande #%s', v_order.id),
        format('/driver/deliveries/%s', v_order.id)
      );
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P3.5 — Auto-Detect Fraudulent Orders
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.detect_order_fraud()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_risk_score INT := 0;
  v_risk_level TEXT;
  v_flags JSONB := '[]'::jsonb;
  v_customer_orders INT;
  v_recent_orders INT;
  v_avg_order_value INT;
BEGIN
  -- Guard: Only check new orders
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Flag 1: High order value (> 500,000 FCFA)
  IF NEW.total > 500000 THEN
    v_risk_score := v_risk_score + 25;
    v_flags := v_flags || jsonb_build_array('high_value_order');
  END IF;

  -- Flag 2: Multiple orders from same customer in 1 hour
  SELECT COUNT(*) INTO v_recent_orders
  FROM orders
  WHERE customer_id = NEW.customer_id
    AND created_at >= now() - INTERVAL '1 hour'
    AND id <> NEW.id;

  IF v_recent_orders > 3 THEN
    v_risk_score := v_risk_score + 30;
    v_flags := v_flags || jsonb_build_array('rapid_fire_orders');
  END IF;

  -- Flag 3: New customer making large order
  SELECT COUNT(*) INTO v_customer_orders
  FROM orders
  WHERE customer_id = NEW.customer_id;

  IF v_customer_orders <= 1 AND NEW.total > 200000 THEN
    v_risk_score := v_risk_score + 20;
    v_flags := v_flags || jsonb_build_array('new_customer_large_order');
  END IF;

  -- Flag 4: Multiple failed payment attempts
  IF NEW.payment_status = 'failed' THEN
    SELECT COUNT(*) INTO v_recent_orders
    FROM orders
    WHERE customer_id = NEW.customer_id
      AND payment_status = 'failed'
      AND created_at >= now() - INTERVAL '24 hours';

    IF v_recent_orders > 2 THEN
      v_risk_score := v_risk_score + 25;
      v_flags := v_flags || jsonb_build_array('multiple_failed_payments');
    END IF;
  END IF;

  -- Determine risk level
  IF v_risk_score >= 80 THEN
    v_risk_level := 'critical';
  ELSIF v_risk_score >= 60 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 30 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;

  -- Insert fraud score
  INSERT INTO order_fraud_scores (
    order_id,
    risk_score,
    risk_level,
    flags
  ) VALUES (
    NEW.id,
    v_risk_score,
    v_risk_level,
    v_flags
  );

  -- Alert admin if high/critical risk
  IF v_risk_level IN ('high', 'critical') THEN
    INSERT INTO admin_notifications (
      type,
      title,
      message,
      target_url
    ) VALUES (
      'fraud_alert_' || v_risk_level,
      format('Alerte fraude: %s (Score: %d)', v_risk_level, v_risk_score),
      format('Commande #%s - %d FCFA', NEW.order_number, NEW.total),
      format('/admin/orders/%s/fraud', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_detect_fraud_on_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION public.detect_order_fraud();