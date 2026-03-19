-- Migration: 014_marketplace_services_and_purchases
-- Description: Create marketplace_services and marketplace_purchases tables with seed data

-- ============================================================
-- TABLE: marketplace_services
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketplace_services (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    description         TEXT,
    category            TEXT NOT NULL DEFAULT 'visibility', -- visibility, advertising, analytics, communication
    price               INTEGER NOT NULL DEFAULT 0,        -- en FCFA
    duration_days       INTEGER,                           -- NULL = permanent
    features            TEXT[] NOT NULL DEFAULT '{}',
    icon                TEXT NOT NULL DEFAULT 'Package',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_services_category_idx ON public.marketplace_services(category);
CREATE INDEX IF NOT EXISTS marketplace_services_is_active_idx ON public.marketplace_services(is_active);
CREATE INDEX IF NOT EXISTS marketplace_services_sort_order_idx ON public.marketplace_services(sort_order);

-- ============================================================
-- TABLE: marketplace_purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    service_id          UUID NOT NULL REFERENCES public.marketplace_services(id) ON DELETE RESTRICT,
    admin_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status              TEXT NOT NULL DEFAULT 'active',    -- active, expired, cancelled
    starts_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ,                       -- NULL = no expiration
    amount_paid         INTEGER NOT NULL DEFAULT 0,        -- en FCFA
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_purchases_restaurant_id_idx ON public.marketplace_purchases(restaurant_id);
CREATE INDEX IF NOT EXISTS marketplace_purchases_service_id_idx ON public.marketplace_purchases(service_id);
CREATE INDEX IF NOT EXISTS marketplace_purchases_status_idx ON public.marketplace_purchases(status);
CREATE INDEX IF NOT EXISTS marketplace_purchases_created_at_idx ON public.marketplace_purchases(created_at DESC);

-- ============================================================
-- TRIGGER: updated_at for marketplace_services
-- ============================================================
CREATE OR REPLACE TRIGGER update_marketplace_services_updated_at
    BEFORE UPDATE ON public.marketplace_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_marketplace_purchases_updated_at
    BEFORE UPDATE ON public.marketplace_purchases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.marketplace_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

-- Services: Lecture publique pour les services actifs
CREATE POLICY "marketplace_services: lecture publique si actif"
    ON public.marketplace_services FOR SELECT
    USING (is_active = true);

-- Purchases: Les restaurateurs ne peuvent pas lire leurs propres achats (admin only)
-- Les achats ne sont gérés que par l'admin via l'API

-- ============================================================
-- SEED DATA: 9 marketplace packs
-- ============================================================

INSERT INTO public.marketplace_services (
    id, name, slug, description, category, price, duration_days,
    features, icon, is_active, sort_order
) VALUES
    -- ── Essentials (Packs de base)
    (
        'a001-essentials-top3'::uuid,
        'Pack Visibilité Top 3',
        'visibility_top3',
        'Apparaissez dans le Top 3 des recherches de votre ville et attirez plus de clients.',
        'visibility',
        15000,
        7,
        ARRAY[
            'Position garantie dans le Top 3',
            'Badge Sponsorisé visible',
            'Jusqu''à 3x plus de visites'
        ],
        'Star',
        true,
        1
    ),
    (
        'a002-essentials-sms'::uuid,
        'Campagne Push SMS',
        'communication_sms',
        'Relancez vos anciens clients et informez-les de vos nouvelles offres par SMS.',
        'communication',
        25000,
        NULL,
        ARRAY[
            'Envoi à 1000 clients locaux',
            'Message personnalisé',
            'Lien direct vers votre menu'
        ],
        'Megaphone',
        true,
        2
    ),
    (
        'a003-essentials-boost'::uuid,
        'Pack Boost Continu',
        'visibility_boost_continuous',
        'La solution ultime pour maximiser vos commandes tous les jours.',
        'visibility',
        50000,
        30,
        ARRAY[
            'Visibilité Top 3 pendant 1 mois',
            '1 Campagne SMS incluse',
            'Support marketing dédié'
        ],
        'TrendingUp',
        true,
        3
    ),
    -- ── Premium (Packs haut de gamme)
    (
        'b001-premium-dominance'::uuid,
        'Pack Premium Dominance',
        'premium_dominance',
        'La solution ultime pour dominer votre marché avec support VIP 24/7.',
        'visibility',
        150000,
        30,
        ARRAY[
            'Top 3 garanti toute la journée',
            '2 SMS campaigns inclus',
            'Photo professionnel (studio partenaire)',
            'Support dédié en WhatsApp 24/7',
            'Analytics détaillés temps réel',
            'Badge ''Premium'' visible'
        ],
        'Crown',
        true,
        4
    ),
    (
        'b002-premium-weekend'::uuid,
        'Pack Visibilité Weekend',
        'visibility_weekend',
        'Boostez vos ventes le vendredi, samedi et dimanche aux meilleures heures.',
        'visibility',
        20000,
        2,
        ARRAY[
            'Top 3 pendant les pics de commandes',
            'Parfait avant événements/promotions',
            'SMS de rappel inclus',
            'Activation flexible selon horaires'
        ],
        'Calendar',
        true,
        5
    ),
    (
        'b003-premium-gallery'::uuid,
        'Pack Gallery Boost',
        'advertising_gallery_boost',
        'Augmentez vos conversions avec des contenus visuels professionnels et attractifs.',
        'advertising',
        35000,
        15,
        ARRAY[
            'Jusqu''à 20 photos supplémentaires',
            'Carousel professionnel automatisé',
            'Vidéos de 30sec du plat best-seller',
            'Augmente convictions des clients'
        ],
        'Image',
        true,
        6
    ),
    -- ── Engagement (Packs de fidélisation)
    (
        'c001-engagement-reviews'::uuid,
        'Pack Avis & Réputation',
        'analytics_reviews_reputation',
        'Réussissez vos avis clients et gérez votre réputation en ligne.',
        'analytics',
        40000,
        30,
        ARRAY[
            'Outils pour récolter avis clients',
            'Réponses automatiques aux avis',
            'Badge ''Bien noté'' si > 4.5 ⭐',
            'Monitoring des mentions'
        ],
        'Star',
        true,
        7
    ),
    (
        'c002-engagement-loyalty'::uuid,
        'Pack Fidélité+',
        'communication_loyalty_plus',
        'Fidélisez vos clients avec un système de récompenses intelligent et automatisé.',
        'communication',
        50000,
        30,
        ARRAY[
            'Système de loyauté avec codes promo',
            'Emails automatiques (base de clients)',
            'Analytics de client retention',
            'Segmentation intelligente des clients'
        ],
        'Heart',
        true,
        8
    ),
    (
        'c003-engagement-social'::uuid,
        'Pack Social Amplifier',
        'advertising_social_amplifier',
        'Augmentez votre présence sur les réseaux sociaux avec contenu généré automatiquement.',
        'advertising',
        45000,
        30,
        ARRAY[
            'Boost automatique sur réseaux sociaux',
            '3 posts/semaine générés (IA)',
            'Partage des nouvelles recettes',
            'Planification intelligente des publications'
        ],
        'Share2',
        true,
        9
    );

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT SELECT ON public.marketplace_services TO authenticated;
GRANT SELECT ON public.marketplace_services TO anon;
