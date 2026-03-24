-- ============================================================
-- Migration: Engagement Features
-- 1. restaurant_notifications (in-app notifications for restaurants)
-- 2. restaurant_badges (milestone/achievement system)
-- 3. restaurant_stats_daily (daily stats for record tracking)
-- 4. pg_cron jobs for daily summary & inactive customer alerts
-- ============================================================

-- ============================
-- 1. restaurant_notifications
-- ============================
CREATE TABLE IF NOT EXISTS public.restaurant_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,  -- 'daily_summary', 'badge_earned', 'inactive_customer'
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rest_notif_restaurant
    ON public.restaurant_notifications(restaurant_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rest_notif_type_created
    ON public.restaurant_notifications(restaurant_id, type, created_at DESC);

ALTER TABLE public.restaurant_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_notifications_member_access"
    ON public.restaurant_notifications FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            UNION
            SELECT restaurant_id FROM public.restaurant_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Enable realtime for live notification updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_notifications;

-- ============================
-- 2. restaurant_badges
-- ============================
CREATE TABLE IF NOT EXISTS public.restaurant_badges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    badge_type      TEXT NOT NULL,
    badge_name      TEXT NOT NULL,
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata        JSONB NOT NULL DEFAULT '{}',
    UNIQUE(restaurant_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_rest_badges_restaurant
    ON public.restaurant_badges(restaurant_id);

ALTER TABLE public.restaurant_badges ENABLE ROW LEVEL SECURITY;

-- Public read (badges shown on store page)
CREATE POLICY "restaurant_badges_public_read"
    ON public.restaurant_badges FOR SELECT
    USING (true);

-- Service role or owner can insert
CREATE POLICY "restaurant_badges_insert"
    ON public.restaurant_badges FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
        OR current_setting('role', true) = 'service_role'
    );

-- ============================
-- 3. restaurant_stats_daily
-- ============================
CREATE TABLE IF NOT EXISTS public.restaurant_stats_daily (
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    stat_date       DATE NOT NULL,
    order_count     INTEGER NOT NULL DEFAULT 0,
    revenue         BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (restaurant_id, stat_date)
);

ALTER TABLE public.restaurant_stats_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_stats_daily_member_read"
    ON public.restaurant_stats_daily FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            UNION
            SELECT restaurant_id FROM public.restaurant_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Service role can upsert (Edge Function)
CREATE POLICY "restaurant_stats_daily_service_upsert"
    ON public.restaurant_stats_daily FOR ALL
    USING (current_setting('role', true) = 'service_role')
    WITH CHECK (current_setting('role', true) = 'service_role');

-- ============================
-- 4. pg_cron jobs
-- ============================

-- Daily summary at 20:00 UTC (21:00 Cameroon WAT)
SELECT cron.schedule(
    'engagement-daily-summary',
    '0 20 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/engagement-cron',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
            'Content-Type', 'application/json'
        ),
        body := '{"action":"daily_summary"}'::jsonb
    );
    $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '0 20 * * *';

-- Inactive customer alerts at 10:00 UTC (11:00 Cameroon WAT)
SELECT cron.schedule(
    'engagement-inactive-customers',
    '0 10 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/engagement-cron',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
            'Content-Type', 'application/json'
        ),
        body := '{"action":"inactive_customers"}'::jsonb
    );
    $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '0 10 * * *';
