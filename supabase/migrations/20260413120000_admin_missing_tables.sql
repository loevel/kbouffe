-- ═══════════════════════════════════════════════════════════════════════
-- Migration: admin_missing_tables
-- Creates 3 tables referenced in production code but missing from DB:
--   1. admin_audit_log   — audit trail for admin actions
--   2. support_tickets   — customer/merchant support tickets (includes AI
--                          columns from 20260404083334 to avoid ALTER fail)
--   3. platform_settings — platform-wide key-value configuration
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- 1. admin_audit_log
-- Used by: apps/api/src/lib/admin-rbac.ts (logAdminAction)
--          apps/api/src/modules/admin/system.ts (GET /audit)
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL,
    target_type TEXT        NOT NULL,
    target_id   TEXT        NOT NULL,
    details     JSONB       DEFAULT '{}',
    ip_address  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id    ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at  ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action      ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_type ON public.admin_audit_log(target_type);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- service_role has full access (bypasses RLS by default in Supabase)

-- Admins can read audit log entries
CREATE POLICY "admin_audit_log: admins select"
    ON public.admin_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

-- Only service_role can insert/update/delete (all audit writes go through service_role)
CREATE POLICY "admin_audit_log: service_role insert"
    ON public.admin_audit_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );


-- ───────────────────────────────────────────────────────────────────────
-- 2. support_tickets
-- Used by: multiple routes in apps/api and apps/web-dashboard
-- AI columns are included here to prevent ALTER TABLE failure in
--   migration 20260404083334_admin_automation_ai_columns.sql
-- reporter_type & order_id are from supabase/types.ts
-- unread_admin / unread_reporter counters are from supabase/types.ts
-- status 'auto_closed' is used by fn_auto_close_stale_tickets()
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    reporter_type    TEXT        NOT NULL DEFAULT 'client',
    restaurant_id    UUID        REFERENCES public.restaurants(id) ON DELETE SET NULL,
    assigned_to      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    order_id         UUID        REFERENCES public.orders(id) ON DELETE SET NULL,

    subject          TEXT        NOT NULL,
    description      TEXT        NOT NULL,

    type             TEXT        DEFAULT 'general'
                                 CHECK (type IN ('general', 'payment', 'order', 'account', 'technical', 'other')),
    status           TEXT        DEFAULT 'open'
                                 CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'auto_closed')),
    priority         TEXT        DEFAULT 'medium'
                                 CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category         TEXT,

    unread_admin     INTEGER     DEFAULT 0,
    unread_reporter  INTEGER     DEFAULT 0,

    last_replied_at  TIMESTAMPTZ,
    resolved_at      TIMESTAMPTZ,
    resolution_notes TEXT,

    -- AI triage columns (avoids ALTER TABLE failure in 20260404083334)
    ai_priority      TEXT,
    ai_category      TEXT,
    ai_summary       TEXT,
    ai_triaged_at    TIMESTAMPTZ,

    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_reporter_id   ON public.support_tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_id ON public.support_tickets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to   ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id      ON public.support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status        ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority      ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at    ON public.support_tickets(created_at DESC);

-- Trigger: keep updated_at current
CREATE OR REPLACE FUNCTION public.fn_support_tickets_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.fn_support_tickets_set_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Reporters can view their own tickets
CREATE POLICY "support_tickets: reporter select own"
    ON public.support_tickets FOR SELECT
    USING (reporter_id = auth.uid());

-- Reporters can create tickets
CREATE POLICY "support_tickets: reporter insert"
    ON public.support_tickets FOR INSERT
    WITH CHECK (reporter_id = auth.uid());

-- Reporters can update their own tickets (e.g. add info, close)
CREATE POLICY "support_tickets: reporter update own"
    ON public.support_tickets FOR UPDATE
    USING (reporter_id = auth.uid());

-- Admins can see and manage all tickets
CREATE POLICY "support_tickets: admin all"
    ON public.support_tickets FOR ALL
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


-- ───────────────────────────────────────────────────────────────────────
-- 3. platform_settings
-- Used by: apps/api/src/modules/admin/system.ts (GET/PUT/PATCH /settings)
-- Note: task spec named this table "platform_config" but production code
--       and supabase/types.ts both reference "platform_settings".
-- Schema extended with label/description/type/category for richer admin UI
-- while keeping key as PK to match existing TypeScript types.
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key         TEXT        PRIMARY KEY,
    value       JSONB       NOT NULL,
    type        TEXT        DEFAULT 'string'
                            CHECK (type IN ('string', 'number', 'boolean', 'json')),
    category    TEXT        DEFAULT 'general'
                            CHECK (category IN ('general', 'billing', 'payments', 'features', 'limits', 'marketing')),
    label       TEXT,
    description TEXT,
    updated_by  UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ DEFAULT now(),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON public.platform_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category   ON public.platform_settings(category);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- All admins can read platform settings
CREATE POLICY "platform_settings: admin select"
    ON public.platform_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

-- Only super_admin can modify settings
CREATE POLICY "platform_settings: super_admin write"
    ON public.platform_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    );

-- Seed default platform configuration values
INSERT INTO public.platform_settings (key, value, type, category, label, description) VALUES
    ('commission_rate',          '0.15'::jsonb,  'number',  'billing',   'Taux de commission plateforme',       'Pourcentage prélevé sur chaque commande'),
    ('tva_rate',                 '0.1925'::jsonb,'number',  'billing',   'Taux TVA (19.25%)',                   'Taux de TVA applicable au Cameroun'),
    ('max_order_items',          '50'::jsonb,    'number',  'limits',    'Nombre max articles par commande',    'Limite du nombre d''articles par commande client'),
    ('min_order_amount',         '500'::jsonb,   'number',  'limits',    'Montant minimum de commande (FCFA)',  'Montant minimum requis pour passer une commande'),
    ('delivery_fee_base',        '500'::jsonb,   'number',  'billing',   'Frais livraison de base (FCFA)',      'Frais de livraison de base appliqués par défaut'),
    ('ai_enabled',               'true'::jsonb,  'boolean', 'features',  'IA activée sur la plateforme',        'Active les fonctionnalités d''intelligence artificielle'),
    ('marketplace_enabled',      'true'::jsonb,  'boolean', 'features',  'Marketplace activée',                 'Active la marketplace publique de restaurants'),
    ('max_restaurants_per_user', '5'::jsonb,     'number',  'limits',    'Restaurants max par utilisateur',     'Nombre maximum de restaurants qu''un utilisateur peut créer')
ON CONFLICT (key) DO NOTHING;
