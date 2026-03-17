-- Migration converted from packages/db/migrations/0009_order_cancellation_policy_global.sql

ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS order_cancel_policy TEXT DEFAULT 'flexible';
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS order_cancel_notice_minutes INTEGER DEFAULT 30;
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS order_cancellation_fee_amount INTEGER DEFAULT 0;
