-- Migration 034 : Aligne le schéma coupons avec l'API web-dashboard
-- La table existait avec un schéma différent (kind, min_order_amount, pas de restaurant_id)

DROP POLICY IF EXISTS "Anyone can see active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Merchants manage own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Service role full access coupons" ON public.coupons;
DROP POLICY IF EXISTS "Service role full access coupon_uses" ON public.coupon_uses;

ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS min_order INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_uses INTEGER,
    ADD COLUMN IF NOT EXISTS max_uses_per_customer INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS current_uses INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS applies_to TEXT NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.coupons SET min_order = COALESCE(min_order_amount, 0) WHERE min_order = 0;

ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_code_key;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_restaurant_code_unique') THEN
        ALTER TABLE public.coupons ADD CONSTRAINT coupons_restaurant_code_unique UNIQUE (restaurant_id, code);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coupons_restaurant ON public.coupons(restaurant_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own coupons" ON public.coupons
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            UNION
            SELECT restaurant_id FROM public.restaurant_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Anyone can see active coupons" ON public.coupons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access coupons" ON public.coupons
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access coupon_uses" ON public.coupon_uses
    FOR ALL USING (auth.role() = 'service_role');
