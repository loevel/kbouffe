-- ============================================================
-- Premium Storefront Features
-- 1. Pixel tracking (Meta/Google)
-- 2. Theme engine (grid/luxury/story)
-- 3. Store announcements (micro-CMS)
-- 4. Premium storefront pack type
-- ============================================================

-- 1. Pixel tracking columns
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT NULL;

COMMENT ON COLUMN public.restaurants.meta_pixel_id IS 'Meta/Facebook Pixel ID for retargeting';
COMMENT ON COLUMN public.restaurants.google_analytics_id IS 'Google Analytics 4 Measurement ID (G-XXXXXX)';

-- 2. Theme layout
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS theme_layout TEXT NOT NULL DEFAULT 'grid';

ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_theme_layout_check
  CHECK (theme_layout IN ('grid', 'luxury', 'story'));

-- 3. Store announcements table
CREATE TABLE IF NOT EXISTS public.store_announcements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'info',
    color           TEXT DEFAULT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    starts_at       TIMESTAMPTZ DEFAULT NULL,
    ends_at         TIMESTAMPTZ DEFAULT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT store_announcements_type_check CHECK (type IN ('info', 'warning', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_announcements_restaurant
  ON public.store_announcements(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON public.store_announcements(restaurant_id, is_active)
  WHERE is_active = true;

-- RLS
ALTER TABLE public.store_announcements ENABLE ROW LEVEL SECURITY;

-- Public can read active announcements (with date filtering)
CREATE POLICY "announcements_public_read"
  ON public.store_announcements FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

-- Restaurant owner can manage their announcements
CREATE POLICY "announcements_owner_manage"
  ON public.store_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = store_announcements.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE OR REPLACE TRIGGER update_store_announcements_updated_at
  BEFORE UPDATE ON public.store_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add premium_storefront pack type
ALTER TYPE marketplace_pack_type ADD VALUE IF NOT EXISTS 'premium_storefront';
