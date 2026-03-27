-- ═══════════════════════════════════════════════════════════════════════════
-- 004: Dine-in features — tables, zones, reservations, order enhancements
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Table Zones ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS table_zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    type        TEXT DEFAULT 'indoor' CHECK (type IN ('indoor','outdoor','terrace','vip','air_conditioned')),
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_zones_restaurant ON table_zones(restaurant_id);

-- ─── Tables ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    number      TEXT NOT NULL,
    zone_id     UUID REFERENCES table_zones(id) ON DELETE SET NULL,
    capacity    INTEGER NOT NULL DEFAULT 4,
    status      TEXT DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','cleaning')),
    qr_code     TEXT,
    is_active   BOOLEAN DEFAULT true,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, number)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant ON restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_zone ON restaurant_tables(zone_id);

-- ─── Reservations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT,
    customer_email      TEXT,
    table_id            UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    zone_preference     TEXT,
    date                DATE NOT NULL,
    time                TIME NOT NULL,
    duration            INTEGER DEFAULT 90,
    party_size          INTEGER NOT NULL,
    status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','seated','completed','no_show','cancelled')),
    special_requests    TEXT,
    deposit_amount      INTEGER,
    deposit_paid        BOOLEAN DEFAULT false,
    pre_order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    confirmed_at        TIMESTAMPTZ,
    seated_at           TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);

-- ─── Orders: add dine-in columns ──────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS covers INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_drinks_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS corkage_fee INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0;

-- Ensure enum `delivery_type` contains 'dine_in' before updating constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'delivery_type' AND e.enumlabel = 'dine_in'
    ) THEN
        ALTER TYPE delivery_type ADD VALUE 'dine_in';
    END IF;
END$$;

-- Update delivery_type CHECK to include 'dine_in'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_delivery_type_check CHECK (delivery_type IN ('delivery','pickup','dine_in'));

-- ─── Products: add availability flags ─────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_dine_in_only BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_no_delivery BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dine_in_price INTEGER;

-- ─── Restaurants: add dine-in settings ────────────────────────────────────
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS has_dine_in BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS has_reservations BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS corkage_fee_amount INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS dine_in_service_fee INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS total_tables INTEGER DEFAULT 0;

-- ─── RLS policies ─────────────────────────────────────────────────────────
ALTER TABLE table_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Owners/service role can manage table zones
CREATE POLICY "Service role manages table_zones"
    ON table_zones FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages restaurant_tables"
    ON restaurant_tables FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages reservations"
    ON reservations FOR ALL TO service_role USING (true);
