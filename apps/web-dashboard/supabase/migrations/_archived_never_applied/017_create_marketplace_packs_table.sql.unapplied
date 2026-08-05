-- ============================================================
-- TABLE : marketplace_packs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_packs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT,
    price           INTEGER NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'XAF',
    features        JSONB,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS marketplace_packs_is_active_idx ON public.marketplace_packs(is_active);

-- Enable RLS
ALTER TABLE public.marketplace_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view active packs
CREATE POLICY "marketplace_packs: lecture publique si actif"
    ON public.marketplace_packs FOR SELECT
    USING (is_active = true);

-- Auto-update timestamp
CREATE OR REPLACE TRIGGER update_marketplace_packs_updated_at
    BEFORE UPDATE ON public.marketplace_packs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
