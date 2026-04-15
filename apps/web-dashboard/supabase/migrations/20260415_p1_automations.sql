-- ============================================================
-- P1 Automations: KDS, Inventory, Alerts, Refunds, Completion
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- P1.1 — Auto-KDS Notifications on New Order
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_kds_notification_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer_name TEXT;
  v_item_count INT;
  v_payload JSONB;
BEGIN
  -- Guard: status just changed to 'confirmed' and payment_status is 'paid'
  IF NOT (NEW.status = 'confirmed' AND OLD.status <> 'confirmed' AND NEW.payment_status = 'paid') THEN
    RETURN NEW;
  END IF;

  -- Guard: order has items
  SELECT COUNT(*) INTO v_item_count FROM order_items WHERE order_id = NEW.id;
  IF v_item_count = 0 THEN
    RETURN NEW;
  END IF;

  -- Get customer name
  v_customer_name := COALESCE(NEW.customer_name, 'Client');

  -- Build payload with order details
  v_payload := jsonb_build_object(
    'order_id', NEW.id,
    'order_number', NEW.order_number,
    'customer_name', v_customer_name,
    'total', NEW.total,
    'item_count', v_item_count,
    'delivery_type', NEW.delivery_type,
    'created_at', NEW.created_at
  );

  -- Insert KDS notification for restaurant
  INSERT INTO restaurant_notifications (
    restaurant_id,
    type,
    title,
    body,
    payload
  ) VALUES (
    NEW.restaurant_id,
    'new_order_kds',
    'Nouvelle commande KDS',
    format('%s - %d article(s) - %s FCFA', v_customer_name, v_item_count, NEW.total),
    v_payload
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_kds_notification
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.create_kds_notification_on_order();

-- ────────────────────────────────────────────────────────────
-- P1.2 — Auto-Decrement Inventory on Paid Order
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.decrement_inventory_on_order_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Guard: payment_status just changed to 'paid'
  IF NOT (NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid') THEN
    RETURN NEW;
  END IF;

  -- Guard: order is not cancelled
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Loop through order items and decrement stock
  FOR v_item IN
    SELECT oi.product_id, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
  LOOP
    -- Decrement stock
    UPDATE stock
    SET quantity = quantity - v_item.quantity
    WHERE product_id = v_item.product_id;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_inventory_on_payment
AFTER UPDATE OF payment_status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.decrement_inventory_on_order_paid();

-- ────────────────────────────────────────────────────────────
-- P1.3 — Auto-Low Stock Alerts
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_and_alert_low_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product_name TEXT;
  v_restaurant_id UUID;
BEGIN
  -- Guard: quantity decreased below threshold
  IF NEW.quantity >= NEW.low_stock_threshold THEN
    RETURN NEW;
  END IF;

  -- Get product and restaurant info
  SELECT p.name, p.restaurant_id
  INTO v_product_name, v_restaurant_id
  FROM products p
  WHERE p.id = NEW.product_id;

  IF v_product_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if we already alerted in the last 2 hours
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_notifications
    WHERE restaurant_id = v_restaurant_id
      AND type = 'low_stock_alert'
      AND created_at >= now() - INTERVAL '2 hours'
      AND payload->>'product_id' = NEW.product_id::text
  ) THEN
    -- Insert low stock alert
    INSERT INTO restaurant_notifications (
      restaurant_id,
      type,
      title,
      body,
      payload
    ) VALUES (
      v_restaurant_id,
      'low_stock_alert',
      'Stock faible',
      format('%s: %d unité(s) restante(s) (seuil: %d)', v_product_name, NEW.quantity, NEW.low_stock_threshold),
      jsonb_build_object(
        'product_id', NEW.product_id,
        'product_name', v_product_name,
        'current_quantity', NEW.quantity,
        'threshold', NEW.low_stock_threshold
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_low_stock
AFTER UPDATE OF quantity ON stock
FOR EACH ROW
EXECUTE FUNCTION public.check_and_alert_low_stock();

-- ────────────────────────────────────────────────────────────
-- P1.4 — Auto-Create Refund on Order Cancellation
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_refund_on_order_cancellation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_refund_id UUID;
BEGIN
  -- Guard: status changed to 'cancelled' and payment was made
  IF NOT (NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND NEW.payment_status = 'paid') THEN
    RETURN NEW;
  END IF;

  -- Check if refund already exists for this order
  IF EXISTS (
    SELECT 1 FROM refund_events
    WHERE order_id = NEW.id AND status = 'completed'
  ) THEN
    RETURN NEW;
  END IF;

  -- Create refund event
  INSERT INTO refund_events (
    order_id,
    reason,
    amount_fcfa,
    status,
    created_at
  ) VALUES (
    NEW.id,
    'Commande annulée par le client',
    NEW.total,
    'pending',
    now()
  ) RETURNING id INTO v_refund_id;

  -- Update order to mark refund initiated
  UPDATE orders
  SET payment_status = 'refund_pending'
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_refund_on_cancellation
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.create_refund_on_order_cancellation();

-- ────────────────────────────────────────────────────────────
-- P1.5 — Auto-Complete Orders 24h After Delivery
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_complete_delivered_orders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Mark orders as completed if:
  -- 1. Status is 'delivered' or 'pickedup'
  -- 2. Last status change was > 24 hours ago
  -- 3. Not already completed
  UPDATE orders
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE status IN ('delivered', 'pickedup')
    AND updated_at <= now() - INTERVAL '24 hours'
    AND completed_at IS NULL;
END;
$$;

-- Schedule the job (runs daily at 2 AM UTC, which is 3 AM Cameroon UTC+1)
SELECT cron.schedule(
  'auto-complete-orders',
  '0 2 * * *',
  'SELECT public.auto_complete_delivered_orders();'
);