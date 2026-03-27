-- ============================================================
-- Customer Loyalty Program
-- 1. loyalty_programs        — per-restaurant program config
-- 2. loyalty_rewards         — redeemable rewards catalog
-- 3. customer_loyalty        — customer membership & balance
-- 4. loyalty_transactions    — earn/redeem history
-- ============================================================

-- 1. Loyalty programs
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'Programme de fidelite',
    points_per_fcfa INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT loyalty_programs_restaurant_unique UNIQUE (restaurant_id),
    CONSTRAINT loyalty_programs_points_positive CHECK (points_per_fcfa > 0)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_restaurant
    ON public.loyalty_programs (restaurant_id);

-- 2. Loyalty rewards
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id      UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    points_required INTEGER NOT NULL,
    reward_type     TEXT NOT NULL,
    reward_value    INTEGER NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT loyalty_rewards_type_check CHECK (reward_type IN ('discount_percent', 'discount_fixed', 'free_item')),
    CONSTRAINT loyalty_rewards_points_positive CHECK (points_required > 0),
    CONSTRAINT loyalty_rewards_value_positive CHECK (reward_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_program
    ON public.loyalty_rewards (program_id);

-- 3. Customer loyalty membership
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    points_balance      INTEGER NOT NULL DEFAULT 0,
    total_points_earned INTEGER NOT NULL DEFAULT 0,
    tier                TEXT NOT NULL DEFAULT 'bronze',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT customer_loyalty_unique UNIQUE (customer_id, restaurant_id),
    CONSTRAINT customer_loyalty_tier_check CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    CONSTRAINT customer_loyalty_balance_non_negative CHECK (points_balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer
    ON public.customer_loyalty (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_restaurant
    ON public.customer_loyalty (restaurant_id);

-- 4. Loyalty transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
    points              INTEGER NOT NULL,
    type                TEXT NOT NULL,
    order_id            UUID,
    reward_id           UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT loyalty_transactions_type_check CHECK (type IN ('earn', 'redeem')),
    CONSTRAINT loyalty_transactions_points_positive CHECK (points > 0)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_membership
    ON public.loyalty_transactions (customer_loyalty_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created
    ON public.loyalty_transactions (created_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Loyalty programs: restaurant owner can manage
CREATE POLICY loyalty_programs_owner_all ON public.loyalty_programs
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    );

-- Loyalty programs: customers can view active programs
CREATE POLICY loyalty_programs_public_read ON public.loyalty_programs
    FOR SELECT
    USING (is_active = true);

-- Loyalty rewards: restaurant owner can manage
CREATE POLICY loyalty_rewards_owner_all ON public.loyalty_rewards
    FOR ALL
    USING (
        program_id IN (
            SELECT lp.id FROM public.loyalty_programs lp
            JOIN public.restaurants r ON r.id = lp.restaurant_id
            WHERE r.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        program_id IN (
            SELECT lp.id FROM public.loyalty_programs lp
            JOIN public.restaurants r ON r.id = lp.restaurant_id
            WHERE r.owner_id = auth.uid()
        )
    );

-- Loyalty rewards: customers can view active rewards
CREATE POLICY loyalty_rewards_public_read ON public.loyalty_rewards
    FOR SELECT
    USING (is_active = true);

-- Customer loyalty: owner can view members of their restaurant
CREATE POLICY customer_loyalty_owner_read ON public.customer_loyalty
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    );

-- Customer loyalty: customers can view their own data
CREATE POLICY customer_loyalty_customer_read ON public.customer_loyalty
    FOR SELECT
    USING (customer_id = auth.uid());

-- Loyalty transactions: owner can view transactions for their restaurant
CREATE POLICY loyalty_transactions_owner_read ON public.loyalty_transactions
    FOR SELECT
    USING (
        customer_loyalty_id IN (
            SELECT cl.id FROM public.customer_loyalty cl
            JOIN public.restaurants r ON r.id = cl.restaurant_id
            WHERE r.owner_id = auth.uid()
        )
    );

-- Loyalty transactions: customers can view their own transactions
CREATE POLICY loyalty_transactions_customer_read ON public.loyalty_transactions
    FOR SELECT
    USING (
        customer_loyalty_id IN (
            SELECT id FROM public.customer_loyalty WHERE customer_id = auth.uid()
        )
    );
