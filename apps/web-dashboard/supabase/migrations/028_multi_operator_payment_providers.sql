-- ============================================================
-- Migration 028 — Multi-opérateurs Mobile Money
-- Étend le champ payment_transactions.provider pour permettre
-- d'ajouter d'autres opérateurs (ex: Orange Money) sans refactor.
-- ============================================================

DO $$
DECLARE
    provider_constraint_name text;
BEGIN
    -- Trouve la contrainte CHECK actuelle sur payment_transactions.provider
    SELECT c.conname
    INTO provider_constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'payment_transactions'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%provider%';

    IF provider_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.payment_transactions DROP CONSTRAINT %I', provider_constraint_name);
    END IF;
END $$;

ALTER TABLE public.payment_transactions
    ADD CONSTRAINT payment_transactions_provider_check
    CHECK (provider IN ('mtn_momo', 'orange_money'));

CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_status
    ON public.payment_transactions(provider, status);
