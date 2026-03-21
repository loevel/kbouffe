-- Migration converted from packages/db/migrations/0005_dine_in_tenant.sql
-- NOTE: converted unix epoch timestamps to TIMESTAMPTZ; review IDs and types.

CREATE TABLE IF NOT EXISTS public.table_zones (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT DEFAULT 'indoor',
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   INTEGER DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tables (
    id          TEXT PRIMARY KEY,
    number      TEXT NOT NULL UNIQUE,
    zone_id     TEXT REFERENCES public.table_zones(id) ON DELETE SET NULL,
    capacity    INTEGER NOT NULL DEFAULT 4,
    status      TEXT DEFAULT 'available',
    qr_code     TEXT,
    is_active   INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tables_zone ON public.tables(zone_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);

CREATE TABLE IF NOT EXISTS public.reservations (
    id                  TEXT PRIMARY KEY,
    customer_id         TEXT NOT NULL,
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT,
    customer_email      TEXT,
    table_id            TEXT REFERENCES public.tables(id) ON DELETE SET NULL,
    zone_preference     TEXT,
    date                TEXT NOT NULL,
    time                TEXT NOT NULL,
    duration            INTEGER DEFAULT 90,
    party_size          INTEGER NOT NULL,
    status              TEXT DEFAULT 'pending',
    special_requests    TEXT,
    deposit_amount      INTEGER,
    deposit_paid        INTEGER DEFAULT 0,
    pre_order_id        TEXT,
    confirmed_at        TIMESTAMPTZ,
    seated_at           TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON public.reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON public.reservations(table_id);

-- Alterations to orders and menu_items: add dine-in columns (idempotent checks recommended before running)
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS table_id TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS covers INTEGER;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS external_drinks_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS corkage_fee INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.menu_items ADD COLUMN IF NOT EXISTS is_dine_in_only INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.menu_items ADD COLUMN IF NOT EXISTS is_no_delivery INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.menu_items ADD COLUMN IF NOT EXISTS dine_in_price INTEGER;
