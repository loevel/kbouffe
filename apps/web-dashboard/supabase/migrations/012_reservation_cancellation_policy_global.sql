-- Migration converted from packages/db/migrations/0008_reservation_cancellation_policy_global.sql

ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS reservation_cancel_policy TEXT DEFAULT 'flexible';
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS reservation_cancel_notice_minutes INTEGER DEFAULT 120;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS reservation_cancellation_fee_amount INTEGER DEFAULT 0;
