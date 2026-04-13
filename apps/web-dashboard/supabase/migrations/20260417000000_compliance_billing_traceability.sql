-- ============================================================================
-- Compliance backlog Caméroun — TVA mensuelle + traçabilité paiements/remboursements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tva_declarations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    period_label    TEXT        NOT NULL,
    period_type     TEXT        NOT NULL DEFAULT 'monthly'
                                CHECK (period_type IN ('monthly', 'quarterly')),
    period_start    DATE        NOT NULL,
    period_end      DATE        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'filed', 'void')),
    invoice_count   INTEGER     NOT NULL DEFAULT 0,
    total_ht        INTEGER     NOT NULL DEFAULT 0,
    total_tva       INTEGER     NOT NULL DEFAULT 0,
    total_ttc       INTEGER     NOT NULL DEFAULT 0,
    filed_at        TIMESTAMPTZ,
    filed_by        UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    dgi_reference   TEXT,
    filing_snapshot JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tva_declarations_period_label_key
    ON public.tva_declarations(period_label);
CREATE UNIQUE INDEX IF NOT EXISTS tva_declarations_period_range_key
    ON public.tva_declarations(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS tva_declarations_status_idx
    ON public.tva_declarations(status);
CREATE INDEX IF NOT EXISTS tva_declarations_filed_at_idx
    ON public.tva_declarations(filed_at DESC);

CREATE OR REPLACE FUNCTION public.fn_tva_declarations_lock_filed_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'filed' THEN
            RAISE EXCEPTION 'La déclaration TVA déposée est immuable';
        END IF;
        RETURN OLD;
    END IF;

    IF OLD.status = 'filed' THEN
        RAISE EXCEPTION 'La déclaration TVA déposée est immuable';
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tva_declarations_lock_filed_rows ON public.tva_declarations;
CREATE TRIGGER trg_tva_declarations_lock_filed_rows
    BEFORE UPDATE OR DELETE ON public.tva_declarations
    FOR EACH ROW EXECUTE FUNCTION public.fn_tva_declarations_lock_filed_rows();

ALTER TABLE public.tva_declarations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tva_declarations: admin select" ON public.tva_declarations;
CREATE POLICY "tva_declarations: admin select"
    ON public.tva_declarations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS gross_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS commission_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS provider_name TEXT DEFAULT 'mtn_momo';
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS provider_reference TEXT;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS recipient_phone TEXT;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.payouts
    ADD COLUMN IF NOT EXISTS provider_evidence JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.payout_events (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id         UUID        NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
    restaurant_id     UUID        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    event_type        TEXT        NOT NULL CHECK (event_type IN ('created', 'submitted', 'processing', 'paid', 'failed', 'note', 'evidence')),
    status_from       TEXT,
    status_to         TEXT,
    provider_name     TEXT,
    provider_reference TEXT,
    evidence          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    recorded_by       UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    recorded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payout_events_payout_id_idx
    ON public.payout_events(payout_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS payout_events_restaurant_id_idx
    ON public.payout_events(restaurant_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS payout_events_provider_reference_idx
    ON public.payout_events(provider_reference);

CREATE OR REPLACE FUNCTION public.fn_block_immutable_event_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Les événements de paiement sont immuables';
END;
$$;

DROP TRIGGER IF EXISTS trg_payout_events_immutable ON public.payout_events;
CREATE TRIGGER trg_payout_events_immutable
    BEFORE UPDATE OR DELETE ON public.payout_events
    FOR EACH ROW EXECUTE FUNCTION public.fn_block_immutable_event_rows();

ALTER TABLE public.payout_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payout_events: admin select" ON public.payout_events;
CREATE POLICY "payout_events: admin select"
    ON public.payout_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "payout_events: restaurant select" ON public.payout_events;
CREATE POLICY "payout_events: restaurant select"
    ON public.payout_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurants
            WHERE restaurants.id = payout_events.restaurant_id
              AND restaurants.owner_id = auth.uid()
        )
    );

CREATE TABLE IF NOT EXISTS public.refund_events (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id         UUID        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id              UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_transaction_id UUID        REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    amount                INTEGER     NOT NULL CHECK (amount > 0),
    refund_type           TEXT        NOT NULL CHECK (refund_type IN ('full', 'partial')),
    reason                TEXT        NOT NULL,
    provider_name         TEXT        NOT NULL DEFAULT 'mtn_momo',
    provider_reference    TEXT        NOT NULL,
    original_reference_id TEXT,
    evidence              JSONB       NOT NULL DEFAULT '{}'::jsonb,
    recorded_by           UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    recorded_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS refund_events_provider_reference_key
    ON public.refund_events(provider_reference);
CREATE INDEX IF NOT EXISTS refund_events_order_id_idx
    ON public.refund_events(order_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS refund_events_restaurant_id_idx
    ON public.refund_events(restaurant_id, recorded_at DESC);

DROP TRIGGER IF EXISTS trg_refund_events_immutable ON public.refund_events;
CREATE TRIGGER trg_refund_events_immutable
    BEFORE UPDATE OR DELETE ON public.refund_events
    FOR EACH ROW EXECUTE FUNCTION public.fn_block_immutable_event_rows();

ALTER TABLE public.refund_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refund_events: admin select" ON public.refund_events;
CREATE POLICY "refund_events: admin select"
    ON public.refund_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "refund_events: restaurant select" ON public.refund_events;
CREATE POLICY "refund_events: restaurant select"
    ON public.refund_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurants
            WHERE restaurants.id = refund_events.restaurant_id
              AND restaurants.owner_id = auth.uid()
        )
    );

