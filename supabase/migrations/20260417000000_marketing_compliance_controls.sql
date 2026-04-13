-- ═══════════════════════════════════════════════════════════════════════
-- Migration: marketing_compliance_controls
-- Adds consent/suppression registers and delivery controls for marketing.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- 1. User-level marketing controls
-- ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS sms_notifications_enabled        BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_notifications_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS marketing_quiet_hours_start      TIME        NOT NULL DEFAULT '20:00:00',
    ADD COLUMN IF NOT EXISTS marketing_quiet_hours_end        TIME        NOT NULL DEFAULT '08:00:00',
    ADD COLUMN IF NOT EXISTS marketing_frequency_per_day      INTEGER     NOT NULL DEFAULT 1 CHECK (marketing_frequency_per_day >= 0),
    ADD COLUMN IF NOT EXISTS marketing_frequency_per_week     INTEGER     NOT NULL DEFAULT 3 CHECK (marketing_frequency_per_week >= 0),
    ADD COLUMN IF NOT EXISTS marketing_frequency_per_month    INTEGER     NOT NULL DEFAULT 8 CHECK (marketing_frequency_per_month >= 0),
    ADD COLUMN IF NOT EXISTS marketing_last_opt_out_at        TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_marketing_last_opt_out_at
    ON public.users(marketing_last_opt_out_at DESC);

-- ───────────────────────────────────────────────────────────────────────
-- 2. Consent register
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_consent_registry (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    channel         TEXT        NOT NULL CHECK (channel IN ('sms', 'email')),
    consent_status   TEXT        NOT NULL CHECK (consent_status IN ('opt_in', 'opt_out')),
    source          TEXT        NOT NULL DEFAULT 'self_service'
                                 CHECK (source IN ('self_service', 'admin', 'import', 'system', 'campaign')),
    campaign_id     UUID                    REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
    contact_value   TEXT,
    consent_reason  TEXT,
    recorded_by     UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_consent_registry_user_id
    ON public.marketing_consent_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_consent_registry_channel
    ON public.marketing_consent_registry(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_consent_registry_created_at
    ON public.marketing_consent_registry(created_at DESC);

DROP TRIGGER IF EXISTS trg_marketing_consent_registry_updated_at ON public.marketing_consent_registry;
CREATE TRIGGER trg_marketing_consent_registry_updated_at
    BEFORE UPDATE ON public.marketing_consent_registry
    FOR EACH ROW EXECUTE FUNCTION public.fn_admin_touch_updated_at();

ALTER TABLE public.marketing_consent_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_consent_registry: admin select" ON public.marketing_consent_registry;
CREATE POLICY "marketing_consent_registry: admin select"
    ON public.marketing_consent_registry FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "marketing_consent_registry: self select" ON public.marketing_consent_registry;
CREATE POLICY "marketing_consent_registry: self select"
    ON public.marketing_consent_registry FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "marketing_consent_registry: self insert" ON public.marketing_consent_registry;
CREATE POLICY "marketing_consent_registry: self insert"
    ON public.marketing_consent_registry FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────
-- 3. Suppression list
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_suppression_list (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    channel         TEXT        NOT NULL CHECK (channel IN ('sms', 'email')),
    contact_value   TEXT,
    contact_hash    TEXT,
    reason          TEXT        NOT NULL,
    source          TEXT        NOT NULL DEFAULT 'admin'
                                 CHECK (source IN ('self_service', 'admin', 'import', 'system', 'campaign')),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    suppressed_until TIMESTAMPTZ,
    created_by      UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_suppression_list_user_id
    ON public.marketing_suppression_list(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_suppression_list_channel
    ON public.marketing_suppression_list(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_suppression_list_is_active
    ON public.marketing_suppression_list(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_suppression_list_suppressed_until
    ON public.marketing_suppression_list(suppressed_until DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_suppression_list_active_key
    ON public.marketing_suppression_list(channel, COALESCE(contact_hash, contact_value))
    WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS trg_marketing_suppression_list_updated_at ON public.marketing_suppression_list;
CREATE TRIGGER trg_marketing_suppression_list_updated_at
    BEFORE UPDATE ON public.marketing_suppression_list
    FOR EACH ROW EXECUTE FUNCTION public.fn_admin_touch_updated_at();

ALTER TABLE public.marketing_suppression_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_suppression_list: admin select" ON public.marketing_suppression_list;
CREATE POLICY "marketing_suppression_list: admin select"
    ON public.marketing_suppression_list FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

-- ───────────────────────────────────────────────────────────────────────
-- 4. Marketing delivery log (supports frequency / opt-out checks)
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_delivery_events (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    campaign_id       UUID                    REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
    channel           TEXT        NOT NULL CHECK (channel IN ('sms', 'email', 'push', 'banner')),
    delivery_status   TEXT        NOT NULL DEFAULT 'queued'
                                   CHECK (delivery_status IN ('queued', 'sent', 'suppressed', 'opted_out', 'blocked', 'failed')),
    contact_value     TEXT,
    blocked_reason    TEXT,
    metadata          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_delivery_events_user_channel_created
    ON public.marketing_delivery_events(user_id, channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_delivery_events_campaign_id
    ON public.marketing_delivery_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_delivery_events_status
    ON public.marketing_delivery_events(delivery_status);

ALTER TABLE public.marketing_delivery_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_delivery_events: admin select" ON public.marketing_delivery_events;
CREATE POLICY "marketing_delivery_events: admin select"
    ON public.marketing_delivery_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

-- ───────────────────────────────────────────────────────────────────────
-- 5. Campaign compliance defaults
-- ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.ad_campaigns
    ADD COLUMN IF NOT EXISTS consent_required          BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS quiet_hours_start         TIME        NOT NULL DEFAULT '20:00:00',
    ADD COLUMN IF NOT EXISTS quiet_hours_end           TIME        NOT NULL DEFAULT '08:00:00',
    ADD COLUMN IF NOT EXISTS frequency_cap_per_user    INTEGER     NOT NULL DEFAULT 1 CHECK (frequency_cap_per_user >= 0),
    ADD COLUMN IF NOT EXISTS frequency_window_days     INTEGER     NOT NULL DEFAULT 7 CHECK (frequency_window_days > 0),
    ADD COLUMN IF NOT EXISTS suppression_enabled       BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS compliance_status         TEXT        NOT NULL DEFAULT 'draft'
                                                     CHECK (compliance_status IN ('draft', 'ready', 'blocked', 'reviewed')),
    ADD COLUMN IF NOT EXISTS compliance_checked_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS compliance_checked_by     UUID        REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_compliance_status
    ON public.ad_campaigns(compliance_status);

