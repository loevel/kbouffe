-- ============================================================
-- KBOUFFE — Push Tokens: Multi-device support & optimizations
-- Migration: 033
-- ============================================================

-- 1. Table push_tokens — support multi-device FCM tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'web', -- 'web', 'android', 'ios'
    device_info TEXT, -- user agent or device name
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT push_tokens_token_unique UNIQUE (token)
);

-- 2. Indexes for push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_last_used_at ON public.push_tokens(last_used_at);

-- 3. Composite index on restaurant_members for push queries
-- sendPushToRestaurant queries: WHERE restaurant_id = $1 AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_restaurant_members_restaurant_status
    ON public.restaurant_members(restaurant_id, status);

-- 4. RLS for push_tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "push_tokens: user manages own tokens"
    ON public.push_tokens FOR ALL
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Service role can read all tokens (for server-side push sending)
-- (service_role bypasses RLS by default in Supabase)

-- 5. Migrate existing fcm_token data from users table
INSERT INTO public.push_tokens (user_id, token, platform, device_info, created_at, last_used_at)
SELECT id, fcm_token, 'web', 'migrated from users.fcm_token', now(), now()
FROM public.users
WHERE fcm_token IS NOT NULL AND fcm_token != ''
ON CONFLICT (token) DO NOTHING;

-- 6. Cleanup function for stale tokens (tokens not used in 60+ days)
CREATE OR REPLACE FUNCTION public.cleanup_stale_push_tokens()
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
    DELETE FROM public.push_tokens
    WHERE last_used_at < now() - INTERVAL '60 days';
$$;

-- 7. Schedule cleanup via pg_cron (runs daily at 3:00 AM UTC)
-- NOTE: pg_cron must be enabled in your Supabase project (Extensions > pg_cron)
-- If pg_cron is not available, run this manually or skip this section.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'cleanup-stale-push-tokens',
            '0 3 * * *',
            'SELECT public.cleanup_stale_push_tokens();'
        );
    ELSE
        RAISE NOTICE 'pg_cron not available — skipping scheduled cleanup. Enable pg_cron in Supabase Extensions.';
    END IF;
END
$$;
