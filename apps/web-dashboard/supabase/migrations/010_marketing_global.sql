-- Migration converted from packages/db/migrations/0006_marketing_global.sql
-- NOTE: converted created_at to TIMESTAMPTZ where present.

ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS is_sponsored INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS sponsored_until BIGINT;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS sponsored_rank INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_restaurants_sponsored ON public.restaurants(is_sponsored, sponsored_until);

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id              TEXT PRIMARY KEY,
    restaurant_id   TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    package         TEXT NOT NULL DEFAULT 'basic',
    status          TEXT NOT NULL DEFAULT 'pending',
    starts_at       BIGINT NOT NULL,
    ends_at         BIGINT NOT NULL,
    budget          INTEGER NOT NULL DEFAULT 0,
    include_push    INTEGER DEFAULT 0,
    push_sent       INTEGER DEFAULT 0,
    push_message    TEXT,
    impressions     INTEGER DEFAULT 0,
    clicks          INTEGER DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_restaurant ON public.ad_campaigns(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active ON public.ad_campaigns(status, starts_at, ends_at);
