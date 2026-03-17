-- Migration converted from packages/db/migrations/0007_marketing_tenant.sql
-- Coupon system for tenant databases. Review `code` COLLATE behavior if needed.

CREATE TABLE IF NOT EXISTS public.coupons (
    id              TEXT PRIMARY KEY,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT,
    type            TEXT NOT NULL DEFAULT 'percent',
    value           INTEGER NOT NULL,
    min_order       INTEGER DEFAULT 0,
    max_discount    INTEGER,
    max_uses        INTEGER,
    max_uses_per_customer INTEGER DEFAULT 1,
    current_uses    INTEGER DEFAULT 0,
    is_active       INTEGER DEFAULT 1,
    starts_at       BIGINT,
    expires_at      BIGINT,
    applies_to      TEXT DEFAULT 'all',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active, expires_at);

CREATE TABLE IF NOT EXISTS public.coupon_uses (
    id          TEXT PRIMARY KEY,
    coupon_id   TEXT NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    order_id    TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    discount_applied INTEGER NOT NULL,
    used_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON public.coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_customer ON public.coupon_uses(customer_id);
