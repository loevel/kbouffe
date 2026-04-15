-- ============================================================
-- P1 Schema Enhancements
-- ============================================================

-- Add completion tracking to orders
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add low_stock_threshold to stock management
ALTER TABLE IF EXISTS public.stock
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Add refund tracking to refund_events
ALTER TABLE IF EXISTS public.refund_events
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS amount_fcfa INTEGER;

-- Create index for inventory queries
CREATE INDEX IF NOT EXISTS idx_stock_product_quantity ON public.stock(product_id, quantity);
CREATE INDEX IF NOT EXISTS idx_orders_status_updated ON public.orders(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_refund_events_order_id ON public.refund_events(order_id);