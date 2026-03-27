-- ============================================================
-- Migration: 029_driver_interface
-- Description: Interface livreur — table drivers, driver_id sur orders, RLS
-- ============================================================

-- ============================================================
-- Colonne driver_id sur orders
-- ============================================================
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_driver_id_idx ON public.orders(driver_id);

-- ============================================================
-- TABLE: drivers
-- Profil de chaque livreur : lien vers son restaurant et statut en ligne
-- ============================================================
CREATE TABLE IF NOT EXISTS public.drivers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    restaurant_id   UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    is_online       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drivers_user_id_idx       ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS drivers_restaurant_id_idx ON public.drivers(restaurant_id);

CREATE OR REPLACE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS — drivers
-- ============================================================
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Le livreur peut lire et mettre à jour son propre profil
CREATE POLICY "Driver can read own profile"
    ON public.drivers FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Driver can update own profile"
    ON public.drivers FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Le propriétaire du restaurant peut lire les drivers de son restaurant
CREATE POLICY "Owner can read restaurant drivers"
    ON public.drivers FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    );

-- Les membres actifs (managers) peuvent aussi lire les drivers
CREATE POLICY "Manager can read restaurant drivers"
    ON public.drivers FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.restaurant_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- ============================================================
-- RLS — orders : accès livreur
-- ============================================================

-- Le livreur peut lire les commandes qui lui sont assignées
CREATE POLICY "Driver can read assigned orders"
    ON public.orders FOR SELECT
    USING (driver_id = auth.uid());

-- Le livreur peut mettre à jour le statut de ses commandes assignées (→ delivered)
CREATE POLICY "Driver can update assigned order status"
    ON public.orders FOR UPDATE
    USING (driver_id = auth.uid())
    WITH CHECK (driver_id = auth.uid());
