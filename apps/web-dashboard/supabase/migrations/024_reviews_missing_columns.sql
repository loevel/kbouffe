-- ============================================================
-- Migration 024: Add missing columns to reviews + create product_reviews
-- ============================================================

-- ── 1. Add missing columns to public.reviews ──────────────────────────
ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS is_visible  BOOLEAN      NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS response    TEXT,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ;

-- Index on is_visible for filtering
CREATE INDEX IF NOT EXISTS reviews_is_visible_idx ON public.reviews(is_visible);

-- ── 2. Create product_reviews table (idempotent) ───────────────────────
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES public.products(id)     ON DELETE CASCADE,
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id)  ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES public.users(id)        ON DELETE CASCADE,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    CONSTRAINT product_reviews_product_customer_unique UNIQUE (product_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id    ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_restaurant_id ON public.product_reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id   ON public.product_reviews(customer_id);

-- ── 3. RLS for product_reviews ─────────────────────────────────────────
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_reviews: lecture publique"   ON public.product_reviews;
DROP POLICY IF EXISTS "product_reviews: insertion client"   ON public.product_reviews;
DROP POLICY IF EXISTS "product_reviews: mise a jour client" ON public.product_reviews;

CREATE POLICY "product_reviews: lecture publique"
    ON public.product_reviews FOR SELECT
    USING (is_visible = TRUE);

CREATE POLICY "product_reviews: insertion client"
    ON public.product_reviews FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = customer_id);

CREATE POLICY "product_reviews: mise a jour client"
    ON public.product_reviews FOR UPDATE
    USING ((SELECT auth.uid()) = customer_id)
    WITH CHECK ((SELECT auth.uid()) = customer_id);
