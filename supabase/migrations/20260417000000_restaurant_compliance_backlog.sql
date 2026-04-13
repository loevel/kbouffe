-- ═══════════════════════════════════════════════════════════════════════
-- Restaurant compliance backlog (Cameroon)
-- Structured licenses + publication gating columns
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.restaurant_licenses (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id         UUID        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    license_type          TEXT        NOT NULL CHECK (license_type IN ('rccm', 'niu', 'sanitary', 'municipal', 'other')),
    license_number        TEXT        NOT NULL,
    issuing_authority     TEXT        NOT NULL,
    status                TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
    required_for_publication BOOLEAN   NOT NULL DEFAULT true,
    evidence_url          TEXT,
    notes                 TEXT,
    verified_by           UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    verified_at           TIMESTAMPTZ,
    expires_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now(),
    UNIQUE (restaurant_id, license_type)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_licenses_restaurant_id ON public.restaurant_licenses(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_licenses_status ON public.restaurant_licenses(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_licenses_expires_at ON public.restaurant_licenses(expires_at);

ALTER TABLE public.restaurant_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_licenses: admin all"
    ON public.restaurant_licenses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

CREATE POLICY "restaurant_licenses: merchant select own"
    ON public.restaurant_licenses FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = restaurant_licenses.restaurant_id
              AND r.owner_id = auth.uid()
        )
    );

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS compliance_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS compliance_last_checked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS compliance_block_reason TEXT;

ALTER TABLE public.restaurants
    ADD CONSTRAINT restaurants_compliance_status_check
    CHECK (compliance_status IN ('pending', 'in_review', 'compliant', 'blocked'));

CREATE INDEX IF NOT EXISTS idx_restaurants_compliance_status ON public.restaurants(compliance_status);

