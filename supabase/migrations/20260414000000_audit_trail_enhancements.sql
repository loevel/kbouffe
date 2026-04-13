-- ═══════════════════════════════════════════════════════════════════════
-- Migration: audit_trail_enhancements
-- 1. Add user_agent column to admin_audit_log
-- 2. Add is_banned / ban_reason to users table (for admin ban/unban)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. user_agent on admin_audit_log
ALTER TABLE public.admin_audit_log
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Ban fields on users table
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_banned    BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ban_reason   TEXT;

CREATE INDEX IF NOT EXISTS idx_users_is_banned ON public.users(is_banned) WHERE is_banned = TRUE;
