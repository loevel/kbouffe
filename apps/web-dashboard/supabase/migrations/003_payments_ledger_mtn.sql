-- ============================================================
-- Migration : Paiements MTN + Ledger + Lignes de settlement
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    provider            TEXT NOT NULL CHECK (provider IN ('mtn_momo')),
    reference_id        UUID NOT NULL UNIQUE,
    external_id         TEXT,
    payer_msisdn        TEXT,
    amount              INTEGER NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'XAF',
    status              payment_status NOT NULL DEFAULT 'pending',
    provider_status     TEXT,
    provider_response   JSONB,
    failed_reason       TEXT,
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_restaurant_id_idx ON public.payment_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS payment_transactions_order_id_idx ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS payment_transactions_requested_at_idx ON public.payment_transactions(requested_at DESC);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id           UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id                UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_transaction_id  UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    entry_type              TEXT NOT NULL CHECK (entry_type IN (
                            'cash_in',
                            'platform_fee',
                            'psp_fee',
                            'restaurant_liability',
                            'payout',
                            'refund'
                        )),
    direction               TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
    amount                  INTEGER NOT NULL CHECK (amount >= 0),
    currency                TEXT NOT NULL DEFAULT 'XAF',
    description             TEXT,
    metadata                JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_entries_restaurant_id_idx ON public.ledger_entries(restaurant_id);
CREATE INDEX IF NOT EXISTS ledger_entries_order_id_idx ON public.ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS ledger_entries_payment_tx_idx ON public.ledger_entries(payment_transaction_id);
CREATE INDEX IF NOT EXISTS ledger_entries_created_at_idx ON public.ledger_entries(created_at DESC);

CREATE TABLE IF NOT EXISTS public.payout_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id               UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
    restaurant_id           UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id                UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_transaction_id  UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    gross_amount            INTEGER NOT NULL DEFAULT 0,
    platform_fee_amount     INTEGER NOT NULL DEFAULT 0,
    psp_fee_amount          INTEGER NOT NULL DEFAULT 0,
    net_amount              INTEGER NOT NULL DEFAULT 0,
    currency                TEXT NOT NULL DEFAULT 'XAF',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT payout_items_unique_order UNIQUE (payout_id, order_id)
);

CREATE INDEX IF NOT EXISTS payout_items_payout_id_idx ON public.payout_items(payout_id);
CREATE INDEX IF NOT EXISTS payout_items_restaurant_id_idx ON public.payout_items(restaurant_id);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;

-- Policies: owner restaurant can read/write their own records
CREATE POLICY "payment_transactions: owner CRUD"
    ON public.payment_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = payment_transactions.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

CREATE POLICY "ledger_entries: owner read"
    ON public.ledger_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = ledger_entries.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

CREATE POLICY "payout_items: owner read"
    ON public.payout_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = payout_items.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );
