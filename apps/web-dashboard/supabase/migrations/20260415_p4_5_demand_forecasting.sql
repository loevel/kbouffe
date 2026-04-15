-- ============================================================
-- P4.5 — Demand Forecasting for Inventory Optimization
-- ============================================================

CREATE OR REPLACE FUNCTION public.forecast_product_demand()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product RECORD;
  v_restaurant RECORD;
  v_forecast_date DATE;
  v_predicted_qty INTEGER;
  v_confidence_score NUMERIC;
  v_avg_7day NUMERIC;
  v_avg_30day NUMERIC;
  v_std_dev NUMERIC;
  v_total_7day INTEGER;
  v_total_30day INTEGER;
  v_day_of_week INT;
  v_is_weekend BOOLEAN;
BEGIN
  -- Forecast for next 7 days for each restaurant
  FOR v_restaurant IN
    SELECT DISTINCT restaurant_id FROM restaurants WHERE is_published = true
  LOOP
    FOR v_forecast_date IN
      SELECT CURRENT_DATE + (interval '1 day' * i)::interval
      FROM generate_series(1, 7) AS gs(i)
    LOOP
      v_day_of_week := EXTRACT(ISODOW FROM v_forecast_date)::INT;
      v_is_weekend := v_day_of_week >= 6;

      -- Find all products in restaurant
      FOR v_product IN
        SELECT id, name, category_id, price
        FROM products
        WHERE restaurant_id = v_restaurant.restaurant_id
          AND is_active = true
      LOOP
        -- Calculate 7-day average
        SELECT
          COALESCE(SUM(oi.quantity), 0)::NUMERIC,
          COUNT(DISTINCT o.id)
        INTO v_total_7day, v_avg_7day
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = v_product.id
          AND o.restaurant_id = v_restaurant.restaurant_id
          AND o.created_at >= now() - INTERVAL '7 days'
          AND o.status IN ('delivered', 'completed');

        -- Calculate 30-day average
        SELECT
          COALESCE(SUM(oi.quantity), 0)::NUMERIC,
          COUNT(DISTINCT o.id)
        INTO v_total_30day, v_avg_30day
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = v_product.id
          AND o.restaurant_id = v_restaurant.restaurant_id
          AND o.created_at >= now() - INTERVAL '30 days'
          AND o.status IN ('delivered', 'completed');

        -- If no historical data, skip
        IF v_avg_30day = 0 THEN
          CONTINUE;
        END IF;

        -- Calculate base prediction (7-day average)
        v_predicted_qty := GREATEST(1, FLOOR(v_total_7day / 7.0)::INTEGER);
        v_confidence_score := 0.70;

        -- Adjust for day-of-week patterns
        SELECT
          COALESCE(SUM(oi.quantity), 0)::NUMERIC / NULLIF(COUNT(DISTINCT o.id), 0) OVER ()
        INTO v_std_dev
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = v_product.id
          AND o.restaurant_id = v_restaurant.restaurant_id
          AND EXTRACT(ISODOW FROM o.created_at)::INT = v_day_of_week
          AND o.created_at >= now() - INTERVAL '60 days'
          AND o.status IN ('delivered', 'completed')
        GROUP BY EXTRACT(ISODOW FROM o.created_at)::INT;

        IF v_std_dev IS NOT NULL AND v_std_dev > 0 THEN
          v_predicted_qty := GREATEST(1, FLOOR(v_std_dev)::INTEGER);
          v_confidence_score := 0.80;
        END IF;

        -- Weekend boost (assume 15-20% higher on weekends)
        IF v_is_weekend THEN
          v_predicted_qty := GREATEST(v_predicted_qty, FLOOR(v_predicted_qty * 1.15)::INTEGER);
          v_confidence_score := LEAST(v_confidence_score - 0.05, 0.95);
        END IF;

        -- Apply trend adjustment (compare 7-day vs 30-day)
        IF v_avg_7day > v_avg_30day * 1.1 THEN
          -- Upward trend
          v_predicted_qty := FLOOR(v_predicted_qty * 1.1)::INTEGER;
          v_confidence_score := GREATEST(v_confidence_score, 0.85);
        ELSIF v_avg_7day < v_avg_30day * 0.9 THEN
          -- Downward trend
          v_predicted_qty := FLOOR(v_predicted_qty * 0.95)::INTEGER;
          v_confidence_score := LEAST(v_confidence_score, 0.70);
        END IF;

        -- Cap confidence to valid range
        v_confidence_score := LEAST(GREATEST(v_confidence_score, 0.5), 0.95);

        -- Insert forecast
        INSERT INTO demand_forecasts (
          restaurant_id,
          product_id,
          forecast_date,
          predicted_quantity,
          confidence_score,
          created_at
        ) VALUES (
          v_restaurant.restaurant_id,
          v_product.id,
          v_forecast_date,
          v_predicted_qty,
          v_confidence_score,
          now()
        )
        ON CONFLICT (restaurant_id, product_id, forecast_date) DO UPDATE SET
          predicted_quantity = v_predicted_qty,
          confidence_score = v_confidence_score,
          created_at = now();
      END LOOP;
    END LOOP;
  END LOOP;

  -- Alert restaurants about low-confidence forecasts or potential stockouts
  FOR v_restaurant IN
    SELECT DISTINCT restaurant_id FROM demand_forecasts
    WHERE forecast_date = CURRENT_DATE + INTERVAL '1 day'
      AND created_at >= now() - INTERVAL '1 hour'
  LOOP
    -- Check for products with high predicted demand but low stock
    IF EXISTS (
      SELECT 1 FROM demand_forecasts df
      JOIN stock s ON df.product_id = s.product_id
      WHERE df.restaurant_id = v_restaurant.restaurant_id
        AND df.forecast_date = CURRENT_DATE + INTERVAL '1 day'
        AND df.predicted_quantity > s.quantity
        AND s.quantity < s.low_stock_threshold
    ) THEN
      INSERT INTO restaurant_notifications (
        restaurant_id,
        type,
        title,
        body,
        payload
      ) VALUES (
        v_restaurant.restaurant_id,
        'demand_vs_stock_alert',
        'Alerte: Demande prévue vs Stock',
        'La demande prévue dépasse le stock disponible pour certains produits',
        jsonb_build_object(
          'forecast_date', CURRENT_DATE + INTERVAL '1 day',
          'check_dashboard', true
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- Schedule daily at 11 PM UTC (migrate from 20260415_p4_2)
SELECT cron.schedule('forecast-demand', '0 23 * * *',
  $$ SELECT public.forecast_product_demand(); $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '0 23 * * *';
