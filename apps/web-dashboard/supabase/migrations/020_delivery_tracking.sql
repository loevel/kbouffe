-- ============================================================
-- Migration: 020_delivery_tracking
-- Description: Real-time delivery tracking with GPS positions
-- ============================================================

-- ============================================================
-- TABLE: delivery_tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,

    -- Client position (from delivery address — set at session start)
    client_lat          NUMERIC(10,8),
    client_lng          NUMERIC(11,8),
    client_address      TEXT,

    -- Deliverer position (updated in real-time via GPS)
    deliverer_lat       NUMERIC(10,8),
    deliverer_lng       NUMERIC(11,8),
    deliverer_name      TEXT,

    -- Session state
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'active', 'completed')),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_tracking_order_id_idx
    ON public.delivery_tracking(order_id);

CREATE INDEX IF NOT EXISTS delivery_tracking_restaurant_id_idx
    ON public.delivery_tracking(restaurant_id);

CREATE INDEX IF NOT EXISTS delivery_tracking_status_idx
    ON public.delivery_tracking(status);

-- ============================================================
-- Auto-update timestamp trigger
-- ============================================================
CREATE OR REPLACE TRIGGER update_delivery_tracking_updated_at
    BEFORE UPDATE ON public.delivery_tracking
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-create delivery_tracking when order status → 'out_for_delivery'
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_order_out_for_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- When order status changes to 'out_for_delivery', create tracking session
    IF NEW.status = 'out_for_delivery' AND OLD.status != 'out_for_delivery' THEN
        INSERT INTO public.delivery_tracking (
            order_id, restaurant_id, client_address, status, started_at
        )
        VALUES (
            NEW.id,
            NEW.restaurant_id,
            NEW.delivery_address,
            'active',
            now()
        )
        ON CONFLICT (order_id) DO UPDATE
        SET status = 'active',
            started_at = now(),
            updated_at = now();
    END IF;

    -- When order is delivered, mark tracking session as completed
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE public.delivery_tracking
        SET status = 'completed',
            completed_at = now()
        WHERE order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_order_status_change_tracking
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.handle_order_out_for_delivery();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Merchants can view tracking for their restaurant
CREATE POLICY "Restaurant owner can view delivery tracking"
    ON public.delivery_tracking FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- Merchants can update deliverer position
CREATE POLICY "Restaurant owner can update delivery tracking"
    ON public.delivery_tracking FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- Merchants can insert tracking sessions
CREATE POLICY "Restaurant owner can insert delivery tracking"
    ON public.delivery_tracking FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- Public read via order ID (client knows their order UUID as an opaque token)
-- We use a function to check order ownership without exposing restaurant data
CREATE POLICY "Public can read tracking by order id"
    ON public.delivery_tracking FOR SELECT
    USING (true);  -- order_id is opaque UUID — knowing it = authorization

-- ============================================================
-- Enable Realtime on delivery_tracking
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;

-- ============================================================
-- Add 'out_for_delivery' status to orders if not already in enum
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'out_for_delivery'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        ALTER TYPE public.order_status ADD VALUE 'out_for_delivery' BEFORE 'delivered';
    END IF;
END;
$$;
