-- ============================================================
-- KBOUFFE — Migration SQL complète
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('merchant', 'customer');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE payment_method AS ENUM ('mobile_money_mtn', 'mobile_money_orange', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE delivery_type AS ENUM ('delivery', 'pickup');

-- ============================================================
-- TABLE : users
-- Extension de auth.users de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    phone       TEXT,
    full_name   TEXT NOT NULL DEFAULT '',
    role        user_role NOT NULL DEFAULT 'customer',
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Créer le profil utilisateur automatiquement après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, phone, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE : restaurants
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    description         TEXT,
    address             TEXT,
    city                TEXT,
    phone               TEXT,
    email               TEXT,
    logo_url            TEXT,
    banner_url          TEXT,
    primary_color       TEXT NOT NULL DEFAULT '#f97316',
    is_published        BOOLEAN NOT NULL DEFAULT false,
    opening_hours       JSONB,
    delivery_zones      JSONB,
    min_order_amount    INTEGER NOT NULL DEFAULT 0,
    delivery_fee        INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurants_owner_id_idx ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS restaurants_slug_idx ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS restaurants_is_published_idx ON public.restaurants(is_published);

-- ============================================================
-- TABLE : categories
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_restaurant_id_idx ON public.categories(restaurant_id);

-- ============================================================
-- TABLE : products
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    price               INTEGER NOT NULL, -- en FCFA, entier (ex: 2500 = 2500 FCFA)
    compare_at_price    INTEGER,          -- prix barré pour les promos
    image_url           TEXT,
    is_available        BOOLEAN NOT NULL DEFAULT true,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    options             JSONB,            -- variantes/options du produit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_restaurant_id_idx ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_is_available_idx ON public.products(is_available);

-- ============================================================
-- TABLE : orders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
    customer_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT NOT NULL,
    items               JSONB NOT NULL,   -- snapshot des produits au moment de la commande
    subtotal            INTEGER NOT NULL,
    delivery_fee        INTEGER NOT NULL DEFAULT 0,
    total               INTEGER NOT NULL,
    status              order_status NOT NULL DEFAULT 'pending',
    delivery_type       delivery_type NOT NULL DEFAULT 'delivery',
    delivery_address    TEXT,
    payment_method      payment_method NOT NULL,
    payment_status      payment_status NOT NULL DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_restaurant_id_idx ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

-- ============================================================
-- TABLE : reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON public.reviews(restaurant_id);

-- ============================================================
-- TABLE : payouts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payouts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    amount          INTEGER NOT NULL,
    status          payout_status NOT NULL DEFAULT 'pending',
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_restaurant_id_idx ON public.payouts(restaurant_id);

-- ============================================================
-- TRIGGERS updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES : users
-- ============================================================

-- Lire son propre profil
CREATE POLICY "users: lecture propre profil"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Modifier son propre profil
CREATE POLICY "users: modification propre profil"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================
-- POLICIES : restaurants
-- ============================================================

-- Le propriétaire peut tout faire sur son restaurant
CREATE POLICY "restaurants: propriétaire CRUD"
    ON public.restaurants FOR ALL
    USING (auth.uid() = owner_id);

-- N'importe qui peut lire les restaurants publiés
CREATE POLICY "restaurants: lecture publique si publié"
    ON public.restaurants FOR SELECT
    USING (is_published = true);

-- ============================================================
-- POLICIES : categories
-- ============================================================

-- Propriétaire du restaurant peut gérer ses catégories
CREATE POLICY "categories: propriétaire CRUD"
    ON public.categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = categories.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

-- Lecture publique des catégories (restaurants publiés)
CREATE POLICY "categories: lecture publique"
    ON public.categories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = categories.restaurant_id
            AND restaurants.is_published = true
        )
    );

-- ============================================================
-- POLICIES : products
-- ============================================================

-- Propriétaire du restaurant peut gérer ses produits
CREATE POLICY "products: propriétaire CRUD"
    ON public.products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = products.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

-- Lecture publique des produits (restaurants publiés)
CREATE POLICY "products: lecture publique"
    ON public.products FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = products.restaurant_id
            AND restaurants.is_published = true
        )
    );

-- ============================================================
-- POLICIES : orders
-- ============================================================

-- Le restaurateur voit toutes les commandes de son restaurant
CREATE POLICY "orders: lecture par restaurateur"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = orders.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

-- Le restaurateur peut mettre à jour le statut de ses commandes
CREATE POLICY "orders: update par restaurateur"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = orders.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

-- Un client connecté peut voir ses propres commandes
CREATE POLICY "orders: lecture par client"
    ON public.orders FOR SELECT
    USING (auth.uid() = customer_id);

-- N'importe qui peut passer une commande (INSERT sans auth requis)
CREATE POLICY "orders: insertion publique"
    ON public.orders FOR INSERT
    WITH CHECK (true);

-- ============================================================
-- POLICIES : reviews
-- ============================================================

-- Lecture publique des avis
CREATE POLICY "reviews: lecture publique"
    ON public.reviews FOR SELECT
    USING (true);

-- Un client peut poster un avis sur sa propre commande
CREATE POLICY "reviews: insertion par client"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

-- ============================================================
-- POLICIES : payouts
-- ============================================================

-- Le restaurateur voit ses propres payouts
CREATE POLICY "payouts: lecture par restaurateur"
    ON public.payouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = payouts.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- À exécuter dans Supabase Dashboard → Storage → New bucket
-- Ou via la CLI : supabase storage buckets create ...

-- Bucket pour les images produits (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Bucket pour les logos/bannières restaurants (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-assets', 'restaurant-assets', true);

-- Bucket pour les avatars utilisateurs (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
