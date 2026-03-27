-- Migration converted from packages/db/migrations/0004_dine_in_global.sql
-- NOTE: original used INTEGER flags; keeping INTEGER for compatibility.

ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS has_dine_in INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS has_reservations INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS corkage_fee_amount INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS dine_in_service_fee INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS total_tables INTEGER DEFAULT 0;
