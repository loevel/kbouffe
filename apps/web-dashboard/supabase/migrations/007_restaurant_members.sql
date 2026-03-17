-- Migration converted from packages/db/migrations/0003_restaurant_members.sql
-- NOTE: converted `created_at`/`accepted_at` to TIMESTAMPTZ; review IDs and types.

CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id              TEXT PRIMARY KEY,
    restaurant_id   TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'viewer',
    invited_by      TEXT REFERENCES public.users(id),
    status          TEXT NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at     TIMESTAMPTZ,
    UNIQUE(restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_restaurant ON public.restaurant_members(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON public.restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.restaurant_members(status);

-- NOTE: original migration inserted initial owner memberships from users with restaurant_id.
-- Manual data migration may be required to backfill `restaurant_members`.
