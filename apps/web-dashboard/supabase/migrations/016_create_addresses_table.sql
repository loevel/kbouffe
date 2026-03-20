-- ============================================================
-- TABLE : addresses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label           TEXT NOT NULL DEFAULT 'Domicile',
    address         TEXT NOT NULL,
    city            TEXT NOT NULL,
    postal_code     TEXT,
    lat             NUMERIC(10, 8),
    lng             NUMERIC(11, 8),
    instructions    TEXT,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS addresses_is_default_idx ON public.addresses(is_default);

-- Enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see and manage their own addresses
CREATE POLICY "addresses: lecture propre adresses"
    ON public.addresses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "addresses: insertion propre adresses"
    ON public.addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses: modification propre adresses"
    ON public.addresses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "addresses: suppression propre adresses"
    ON public.addresses FOR DELETE
    USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
