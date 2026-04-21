-- ============================================================
-- Migration: marketplace_payment_integration
-- Extend marketplace_purchases to support pending mobile-money
-- payments and gift-card redemptions tracked against the
-- existing payment_transactions table.
-- ============================================================

-- 1. New columns on marketplace_purchases
ALTER TABLE public.marketplace_purchases
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS payment_transaction_id UUID
        REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS gift_card_id UUID
        REFERENCES public.gift_cards(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.marketplace_purchases.payment_method
    IS 'mobile_money | gift_card | admin (manual)';
COMMENT ON COLUMN public.marketplace_purchases.payment_transaction_id
    IS 'Links to payment_transactions when paid via mobile money; NULL for gift_card/admin';
COMMENT ON COLUMN public.marketplace_purchases.gift_card_id
    IS 'Links to the gift card used for redemption, if any';
COMMENT ON COLUMN public.marketplace_purchases.activated_at
    IS 'Timestamp when the purchase transitioned from pending to active';

-- 2. Widen the status enum (text column, just document accepted values)
-- Existing values: active, expired, cancelled
-- New values: pending (awaiting payment), failed (payment failed)
-- No constraint to alter (column is free-form TEXT).

-- 3. Index to efficiently find a purchase from a payment transaction
CREATE INDEX IF NOT EXISTS marketplace_purchases_payment_tx_idx
    ON public.marketplace_purchases(payment_transaction_id);

-- 4. Index to resolve pending purchases on restaurant dashboards
CREATE INDEX IF NOT EXISTS marketplace_purchases_restaurant_status_idx
    ON public.marketplace_purchases(restaurant_id, status);
