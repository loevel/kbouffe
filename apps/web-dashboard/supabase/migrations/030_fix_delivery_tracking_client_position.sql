-- ============================================================
-- Migration: 030_fix_delivery_tracking_client_position
-- Description: Parse client coordinates from delivery_address
--   when it is stored as "lat, lng" text (mobile app format).
--   Populates client_lat/client_lng in delivery_tracking so
--   the client pin appears on the delivery map.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_order_out_for_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_client_lat  NUMERIC(10,8) := NULL;
    v_client_lng  NUMERIC(11,8) := NULL;
BEGIN
    -- When order status changes to 'out_for_delivery', create tracking session
    IF NEW.status = 'out_for_delivery' AND OLD.status != 'out_for_delivery' THEN

        -- Parse coordinates if delivery_address is in "lat, lng" format
        IF NEW.delivery_address ~ '^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$' THEN
            v_client_lat := split_part(trim(NEW.delivery_address), ',', 1)::NUMERIC;
            v_client_lng := trim(split_part(trim(NEW.delivery_address), ',', 2))::NUMERIC;
        END IF;

        INSERT INTO public.delivery_tracking (
            order_id, restaurant_id,
            client_lat, client_lng, client_address,
            status, started_at
        )
        VALUES (
            NEW.id,
            NEW.restaurant_id,
            v_client_lat,
            v_client_lng,
            NEW.delivery_address,
            'active',
            now()
        )
        ON CONFLICT (order_id) DO UPDATE
        SET status       = 'active',
            client_lat   = COALESCE(EXCLUDED.client_lat, delivery_tracking.client_lat),
            client_lng   = COALESCE(EXCLUDED.client_lng, delivery_tracking.client_lng),
            client_address = COALESCE(EXCLUDED.client_address, delivery_tracking.client_address),
            started_at   = now(),
            updated_at   = now();
    END IF;

    -- When order is delivered, mark tracking session as completed
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE public.delivery_tracking
        SET status       = 'completed',
            completed_at = now()
        WHERE order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================
-- Back-fill existing active tracking sessions that have
-- a coordinate-format client_address but no lat/lng yet.
-- ============================================================
UPDATE public.delivery_tracking
SET
    client_lat = split_part(trim(client_address), ',', 1)::NUMERIC,
    client_lng = trim(split_part(trim(client_address), ',', 2))::NUMERIC
WHERE
    client_lat IS NULL
    AND client_lng IS NULL
    AND client_address ~ '^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$';
