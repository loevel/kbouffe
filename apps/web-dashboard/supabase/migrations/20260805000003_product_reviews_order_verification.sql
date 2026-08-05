-- ============================================================
-- Migration: require a real order to leave a product review
-- ============================================================
-- product_reviews had no order_id column, so any authenticated user could
-- review any product without ever ordering it. This mirrors the purchase
-- verification already enforced on the restaurant-level `reviews` table.

ALTER TABLE public.product_reviews
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON public.product_reviews(order_id);

-- Backfill: best-effort link existing reviews to a delivered order that
-- actually contains the reviewed product, so historical data isn't orphaned.
UPDATE public.product_reviews pr
SET order_id = sub.order_id
FROM (
    SELECT DISTINCT ON (oi.product_id, o.customer_id)
        oi.product_id,
        o.customer_id,
        o.id AS order_id
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.status IN ('delivered', 'completed')
    ORDER BY oi.product_id, o.customer_id, o.created_at DESC
) sub
WHERE pr.product_id = sub.product_id
  AND pr.customer_id = sub.customer_id
  AND pr.order_id IS NULL;
