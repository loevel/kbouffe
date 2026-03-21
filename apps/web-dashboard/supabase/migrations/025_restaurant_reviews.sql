-- ============================================================
-- Migration 025: Enable standalone restaurant reviews
-- Makes order_id nullable, drops UNIQUE constraint, adds partial
-- unique index to prevent duplicate non-order reviews per customer.
-- ============================================================

-- 1. Drop the existing UNIQUE constraint on order_id
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_order_id_key;

-- 2. Make order_id nullable
ALTER TABLE public.reviews ALTER COLUMN order_id DROP NOT NULL;

-- 3. Partial unique index: one standalone review per customer per restaurant
--    (only applies when order_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_restaurant_customer_standalone_unique
    ON public.reviews (restaurant_id, customer_id)
    WHERE order_id IS NULL;

-- 4. Keep uniqueness for order-based reviews (one review per order)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_id_unique
    ON public.reviews (order_id)
    WHERE order_id IS NOT NULL;

-- 5. Index on customer_id for efficient lookups
CREATE INDEX IF NOT EXISTS reviews_customer_id_idx ON public.reviews(customer_id);
