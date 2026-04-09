-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Ensure users table allows self-profile updates via RLS
--
-- This migration ensures that authenticated users can update their own profile
-- information (full_name, phone, avatar_url, etc.) via the PATCH /account/profile
-- endpoint. The mobile app relies on this policy to save profile changes.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own profile
CREATE POLICY IF NOT EXISTS "users: select own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile (full_name, phone, avatar_url, preferences)
CREATE POLICY IF NOT EXISTS "users: update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Service role / admin can read all users (for internal operations)
CREATE POLICY IF NOT EXISTS "users: admin full access"
    ON public.users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Add comment explaining the profile update policy
COMMENT ON POLICY "users: update own profile" ON public.users
    IS 'Allows authenticated users to update their own profile information via PATCH /account/profile';
