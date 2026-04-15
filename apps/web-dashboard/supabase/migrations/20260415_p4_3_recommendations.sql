-- ============================================================
-- P4.3 — Product Recommendation Engine
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_product_recommendations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer RECORD;
  v_product RECORD;
  v_score NUMERIC;
  v_reason TEXT;
  v_customer_orders INT;
  v_product_orders INT;
  v_avg_rating NUMERIC;
BEGIN
  -- Process each customer with orders
  FOR v_customer IN
    SELECT DISTINCT u.id as customer_id, o.restaurant_id
    FROM users u
    JOIN orders o ON u.id = o.customer_id
    WHERE u.role = 'customer'
      AND o.created_at >= now() - INTERVAL '90 days'
    GROUP BY u.id, o.restaurant_id
  LOOP
    -- Clear old recommendations (older than 7 days)
    DELETE FROM product_recommendations
    WHERE customer_id = v_customer.customer_id
      AND restaurant_id = v_customer.restaurant_id
      AND created_at < now() - INTERVAL '7 days';

    -- Find products to recommend based on customer behavior
    FOR v_product IN
      SELECT DISTINCT p.id, p.name, p.price, p.restaurant_id
      FROM products p
      WHERE p.restaurant_id = v_customer.restaurant_id
        AND p.is_active = true
        AND p.id NOT IN (
          -- Exclude products customer has already ordered
          SELECT DISTINCT product_id FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.customer_id = v_customer.customer_id
            AND o.restaurant_id = v_customer.restaurant_id
        )
      LIMIT 20
    LOOP
      v_score := 0.0;
      v_reason := '';

      -- Factor 1: Product popularity (how many customers ordered it)
      SELECT COUNT(DISTINCT o.customer_id)::NUMERIC INTO v_product_orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = v_product.id
        AND o.created_at >= now() - INTERVAL '30 days';

      IF v_product_orders > 0 THEN
        v_score := v_score + LEAST(v_product_orders / 10.0, 0.3);
        v_reason := v_reason || 'Popular product, ';
      END IF;

      -- Factor 2: Customer category affinity
      -- Find product category of items customer ordered
      SELECT COUNT(DISTINCT pc.category_id)::NUMERIC INTO v_customer_orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN product_categories pc ON p.id = pc.product_id
      WHERE o.customer_id = v_customer.customer_id
        AND o.restaurant_id = v_customer.restaurant_id;

      IF v_customer_orders > 0 THEN
        SELECT COUNT(DISTINCT pc.category_id)::NUMERIC INTO v_product_orders
        FROM product_categories pc
        WHERE pc.product_id = v_product.id;

        IF v_product_orders > 0 THEN
          v_score := v_score + 0.25;
          v_reason := v_reason || 'Matches favorite categories, ';
        END IF;
      END IF;

      -- Factor 3: Product rating and quality
      SELECT COALESCE(AVG(r.rating), 4.0)::NUMERIC INTO v_avg_rating
      FROM reviews r
      WHERE r.product_id = v_product.id
        AND r.created_at >= now() - INTERVAL '60 days';

      IF v_avg_rating >= 4.0 THEN
        v_score := v_score + (v_avg_rating - 3.0) * 0.15;
        v_reason := v_reason || 'High-rated product, ';
      END IF;

      -- Factor 4: Price affinity
      SELECT AVG(p.price)::NUMERIC INTO v_customer_orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.customer_id = v_customer.customer_id
        AND o.restaurant_id = v_customer.restaurant_id;

      IF v_customer_orders > 0 AND v_product.price > 0 THEN
        IF ABS(v_product.price - v_customer_orders) < (v_customer_orders * 0.5) THEN
          v_score := v_score + 0.2;
          v_reason := v_reason || 'Similar price range, ';
        END IF;
      END IF;

      -- Normalize score to 0-1
      v_score := LEAST(GREATEST(v_score, 0.0), 1.0);
      v_reason := TRIM(TRAILING ', ' FROM v_reason);

      -- Insert or update recommendation if score > 0.3
      IF v_score > 0.3 THEN
        INSERT INTO product_recommendations (
          customer_id,
          product_id,
          restaurant_id,
          score,
          reason,
          created_at
        ) VALUES (
          v_customer.customer_id,
          v_product.id,
          v_customer.restaurant_id,
          v_score,
          v_reason,
          now()
        )
        ON CONFLICT (customer_id, product_id, restaurant_id) DO UPDATE SET
          score = v_score,
          reason = v_reason,
          created_at = now();
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Schedule hourly
SELECT cron.schedule('generate-recommendations', '0 * * * *',
  $$ SELECT public.generate_product_recommendations(); $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '0 * * * *';
