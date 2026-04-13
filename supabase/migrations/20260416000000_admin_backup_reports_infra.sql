-- ═══════════════════════════════════════════════════════════════════════
-- Migration: admin_backup_reports_infra
-- Adds persistence for:
--   1. Admin backup/export job history
--   2. Restore request workflow
--   3. Scheduled report configuration + run history
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fn_admin_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────
-- 1. Backup/export jobs
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_backup_jobs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by     UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    tables           TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    format           TEXT        NOT NULL CHECK (format IN ('json', 'csv')),
    status           TEXT        NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    date_from        DATE,
    date_to          DATE,
    row_count        INTEGER     NOT NULL DEFAULT 0,
    file_name        TEXT,
    file_size_bytes  BIGINT,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_backup_jobs_created_at
    ON public.admin_backup_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_backup_jobs_status
    ON public.admin_backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_admin_backup_jobs_requested_by
    ON public.admin_backup_jobs(requested_by);

ALTER TABLE public.admin_backup_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_backup_jobs: admin select" ON public.admin_backup_jobs;
CREATE POLICY "admin_backup_jobs: admin select"
    ON public.admin_backup_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "admin_backup_jobs: super_admin write" ON public.admin_backup_jobs;
CREATE POLICY "admin_backup_jobs: super_admin write"
    ON public.admin_backup_jobs FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    );

-- ───────────────────────────────────────────────────────────────────────
-- 2. Restore requests
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_restore_requests (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_job_id    UUID                    REFERENCES public.admin_backup_jobs(id) ON DELETE SET NULL,
    requested_by     UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_by      UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    restore_scope    TEXT        NOT NULL CHECK (restore_scope IN ('full', 'orders', 'catalog', 'users', 'other')),
    source_reference TEXT,
    reason           TEXT        NOT NULL,
    status           TEXT        NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'completed', 'cancelled')),
    review_notes     TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_restore_requests_created_at
    ON public.admin_restore_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_restore_requests_status
    ON public.admin_restore_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_restore_requests_requested_by
    ON public.admin_restore_requests(requested_by);

DROP TRIGGER IF EXISTS trg_admin_restore_requests_updated_at ON public.admin_restore_requests;
CREATE TRIGGER trg_admin_restore_requests_updated_at
    BEFORE UPDATE ON public.admin_restore_requests
    FOR EACH ROW EXECUTE FUNCTION public.fn_admin_touch_updated_at();

ALTER TABLE public.admin_restore_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_restore_requests: admin select" ON public.admin_restore_requests;
CREATE POLICY "admin_restore_requests: admin select"
    ON public.admin_restore_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "admin_restore_requests: super_admin write" ON public.admin_restore_requests;
CREATE POLICY "admin_restore_requests: super_admin write"
    ON public.admin_restore_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    );

-- ───────────────────────────────────────────────────────────────────────
-- 3. Scheduled reports
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_report_schedules (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT        NOT NULL,
    report_type      TEXT        NOT NULL CHECK (report_type IN ('platform_overview', 'revenue_operations', 'billing_summary', 'backup_activity', 'audit_summary')),
    format           TEXT        NOT NULL CHECK (format IN ('json', 'csv')),
    frequency        TEXT        NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    timezone         TEXT        NOT NULL DEFAULT 'Africa/Douala',
    recipients       JSONB       NOT NULL DEFAULT '[]'::jsonb,
    filters          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    delivery_hour    SMALLINT    NOT NULL DEFAULT 8 CHECK (delivery_hour BETWEEN 0 AND 23),
    delivery_minute  SMALLINT    NOT NULL DEFAULT 0 CHECK (delivery_minute BETWEEN 0 AND 59),
    day_of_week      SMALLINT    CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month     SMALLINT    CHECK (day_of_month BETWEEN 1 AND 28),
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    last_run_at      TIMESTAMPTZ,
    next_run_at      TIMESTAMPTZ,
    created_by       UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by       UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_report_schedules_created_at
    ON public.admin_report_schedules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_report_schedules_active
    ON public.admin_report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_report_schedules_report_type
    ON public.admin_report_schedules(report_type);

DROP TRIGGER IF EXISTS trg_admin_report_schedules_updated_at ON public.admin_report_schedules;
CREATE TRIGGER trg_admin_report_schedules_updated_at
    BEFORE UPDATE ON public.admin_report_schedules
    FOR EACH ROW EXECUTE FUNCTION public.fn_admin_touch_updated_at();

ALTER TABLE public.admin_report_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_report_schedules: admin select" ON public.admin_report_schedules;
CREATE POLICY "admin_report_schedules: admin select"
    ON public.admin_report_schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "admin_report_schedules: super_admin write" ON public.admin_report_schedules;
CREATE POLICY "admin_report_schedules: super_admin write"
    ON public.admin_report_schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    );

CREATE TABLE IF NOT EXISTS public.admin_report_runs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id      UUID                    REFERENCES public.admin_report_schedules(id) ON DELETE SET NULL,
    requested_by     UUID                    REFERENCES public.users(id) ON DELETE SET NULL,
    report_type      TEXT        NOT NULL,
    format           TEXT        NOT NULL CHECK (format IN ('json', 'csv')),
    recipients       JSONB       NOT NULL DEFAULT '[]'::jsonb,
    filters          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    status           TEXT        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_report_runs_schedule_id
    ON public.admin_report_runs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_admin_report_runs_created_at
    ON public.admin_report_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_report_runs_status
    ON public.admin_report_runs(status);

ALTER TABLE public.admin_report_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_report_runs: admin select" ON public.admin_report_runs;
CREATE POLICY "admin_report_runs: admin select"
    ON public.admin_report_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "admin_report_runs: super_admin write" ON public.admin_report_runs;
CREATE POLICY "admin_report_runs: super_admin write"
    ON public.admin_report_runs FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
              AND users.admin_role = 'super_admin'
        )
    );
