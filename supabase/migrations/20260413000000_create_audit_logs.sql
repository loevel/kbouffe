-- ============================================================
-- AUDIT LOGS — Immutable admin action journal
-- ============================================================
-- Purpose: Record every sensitive admin action for compliance
--          and security traceability. Rows are insert-only —
--          no admin (including super_admin) can UPDATE or DELETE.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   TEXT        NOT NULL,
  details     JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id   ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target     ON public.audit_logs(target_type, target_id);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only platform admins may read audit logs.
-- Writes are done exclusively by the service role (from API routes) — no user write policy needed.
CREATE POLICY "audit_logs_admin_read"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Prevent any authenticated user from inserting directly.
-- Inserts MUST go through the service role (backend API routes).
-- The service role bypasses RLS, so no INSERT policy is needed here.
