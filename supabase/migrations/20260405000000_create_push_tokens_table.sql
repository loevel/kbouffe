-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: create push_tokens table
--
-- Stores Expo push notification tokens for authenticated mobile users.
-- One user can have multiple tokens (separate devices / re-installs).
-- The UNIQUE(user_id, token) constraint makes upserts idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token       TEXT        NOT NULL,
    platform    TEXT        NOT NULL DEFAULT 'unknown',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT push_tokens_user_token_unique UNIQUE (user_id, token)
);

-- ── Comments ─────────────────────────────────────────────────────────────────
COMMENT ON TABLE  public.push_tokens             IS 'Expo push tokens for mobile-client users';
COMMENT ON COLUMN public.push_tokens.token       IS 'ExponentPushToken[...] returned by getExpoPushTokenAsync()';
COMMENT ON COLUMN public.push_tokens.platform    IS 'ios | android | unknown';
COMMENT ON COLUMN public.push_tokens.updated_at  IS 'Refreshed on each re-registration; useful for pruning stale tokens';

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
    ON public.push_tokens (user_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read their own tokens
CREATE POLICY "push_tokens: lecture propre"
    ON public.push_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "push_tokens: insertion propre"
    ON public.push_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens (platform refresh, updated_at)
CREATE POLICY "push_tokens: mise à jour propre"
    ON public.push_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens (sign-out)
CREATE POLICY "push_tokens: suppression propre"
    ON public.push_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- ── updated_at auto-refresh trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_push_tokens_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trg_push_tokens_updated_at
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_push_tokens_set_updated_at();
