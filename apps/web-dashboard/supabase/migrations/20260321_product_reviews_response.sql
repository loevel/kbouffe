-- Add merchant response support for product reviews
ALTER TABLE public.product_reviews
    ADD COLUMN IF NOT EXISTS response TEXT;