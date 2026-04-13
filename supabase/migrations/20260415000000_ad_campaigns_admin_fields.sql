-- ═══════════════════════════════════════════════════════════════════════
-- Migration: ad_campaigns_admin_fields
-- Adds admin campaign management columns to ad_campaigns:
--   name, type, target_audience, content, cta_url, spend, reach, conversions
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.ad_campaigns
    ADD COLUMN IF NOT EXISTS name            TEXT,
    ADD COLUMN IF NOT EXISTS type            TEXT DEFAULT 'banner'
        CHECK (type IN ('sms', 'push', 'banner', 'email')),
    ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all'
        CHECK (target_audience IN ('all', 'customers', 'inactive', 'new')),
    ADD COLUMN IF NOT EXISTS content         TEXT,
    ADD COLUMN IF NOT EXISTS cta_url         TEXT,
    ADD COLUMN IF NOT EXISTS spend           INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reach           INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS conversions     INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_type            ON public.ad_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_target_audience ON public.ad_campaigns(target_audience);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_starts_at       ON public.ad_campaigns(starts_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_ends_at         ON public.ad_campaigns(ends_at);
