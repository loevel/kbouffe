-- ============================================================
-- TABLE: restaurant_galleries
-- Configuration de la galerie pour chaque restaurant
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurant_galleries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
    max_photos          INTEGER NOT NULL DEFAULT 5,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_galleries_restaurant_id_idx ON public.restaurant_galleries(restaurant_id);

-- ============================================================
-- TABLE: restaurant_photos
-- Photos individuelles de la galerie
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurant_photos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    photo_url           TEXT NOT NULL,
    alt_text            TEXT,
    display_order       INTEGER NOT NULL DEFAULT 0,
    is_featured         BOOLEAN NOT NULL DEFAULT false,
    uploaded_by         UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_photos_restaurant_id_idx ON public.restaurant_photos(restaurant_id);
CREATE INDEX IF NOT EXISTS restaurant_photos_display_order_idx ON public.restaurant_photos(restaurant_id, display_order);

-- ============================================================
-- TRIGGER: Auto-create gallery for new restaurants
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_restaurant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.restaurant_galleries (restaurant_id, max_photos)
    VALUES (NEW.id, 5);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_restaurant_created
    AFTER INSERT ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_restaurant();

-- ============================================================
-- RLS POLICIES: restaurant_galleries
-- ============================================================

ALTER TABLE public.restaurant_galleries ENABLE ROW LEVEL SECURITY;

-- Les propriétaires/admins peuvent voir et modifier les paramètres de leur galerie
CREATE POLICY "Restaurant owner can view gallery settings"
    ON public.restaurant_galleries
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owner can update gallery settings"
    ON public.restaurant_galleries
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- ============================================================
-- RLS POLICIES: restaurant_photos
-- ============================================================

ALTER TABLE public.restaurant_photos ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les photos des restaurants publiés
CREATE POLICY "Anyone can view photos of published restaurants"
    ON public.restaurant_photos
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE is_published = true
        )
    );

-- Les propriétaires/admins peuvent voir les photos de leurs restaurants
CREATE POLICY "Restaurant owner can view all photos"
    ON public.restaurant_photos
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- Les propriétaires/admins peuvent ajouter des photos
CREATE POLICY "Restaurant owner can insert photos"
    ON public.restaurant_photos
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- Les propriétaires/admins peuvent modifier les photos
CREATE POLICY "Restaurant owner can update photos"
    ON public.restaurant_photos
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- Les propriétaires/admins peuvent supprimer les photos
CREATE POLICY "Restaurant owner can delete photos"
    ON public.restaurant_photos
    FOR DELETE
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );
