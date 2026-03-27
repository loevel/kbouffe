-- ============================================================
-- Migration 027 — Programme de fidélité
-- Ajoute les colonnes de configuration loyalty sur restaurants
-- et la colonne loyalty_points_earned sur orders.
-- ============================================================

-- Colonnes de configuration du programme sur le restaurant
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS loyalty_enabled            BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS loyalty_points_per_order   INTEGER     NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS loyalty_point_value        INTEGER     NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS loyalty_min_redeem_points  INTEGER     NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS loyalty_reward_tiers       JSONB       NOT NULL DEFAULT '[]'::jsonb;

-- Traçabilité par commande : combien de points ont été crédités
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS loyalty_points_earned      INTEGER     DEFAULT 0;

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_restaurants_loyalty_enabled ON public.restaurants(loyalty_enabled) WHERE loyalty_enabled = true;
