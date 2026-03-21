-- ============================================================
-- Migration: 019_add_photo_gallery_pack
-- Description: Add photo gallery packs to marketplace and link with restaurant_galleries
-- ============================================================

-- ============================================================
-- Add gallery_pack_id column to restaurant_galleries
-- ============================================================
ALTER TABLE IF EXISTS public.restaurant_galleries
ADD COLUMN IF NOT EXISTS pack_id UUID REFERENCES public.marketplace_services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_pack_active BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- Add photo gallery packs to marketplace_services
-- ============================================================
INSERT INTO public.marketplace_services (
    id, name, slug, description, category, price, duration_days,
    features, icon, is_active, sort_order
) VALUES
    -- ── Basic Gallery Pack (Inclus par défaut, peut être upgradé)
    (
        'gallery-basic-pack'::uuid,
        'Galerie de Photos Basique',
        'gallery_basic',
        'Gérez jusqu''à 5 photos professionnelles de votre restaurant. Galerie automatique sur votre page boutique.',
        'advertising',
        0,
        NULL,
        ARRAY[
            'Jusqu''à 5 photos',
            'Galerie responsive automatique',
            'Texte alternatif pour chaque photo',
            'Photo à la une (featured)',
            'Lightbox interactif pour clients'
        ],
        'Images',
        true,
        0
    ),
    -- ── Extended Gallery Pack
    (
        'gallery-extended-pack'::uuid,
        'Galerie Étendue (20 Photos)',
        'gallery_extended',
        'Augmentez votre limite à 20 photos pour mieux showcaser votre menu, ambiance et spécialités.',
        'advertising',
        15000,
        30,
        ARRAY[
            'Jusqu''à 20 photos',
            'Galerie pro avec carousel',
            'Carrousel automatisé en page d''accueil',
            'Descriptions détaillées par photo',
            'Photo à la une personnalisable'
        ],
        'Images',
        true,
        7
    ),
    -- ── Premium Gallery Pack
    (
        'gallery-premium-pack'::uuid,
        'Galerie Premium (50 Photos)',
        'gallery_premium',
        'Galerie complète avec 50 photos et sélection intelligente pour l''engagement maximum.',
        'advertising',
        35000,
        30,
        ARRAY[
            'Jusqu''à 50 photos',
            'Galerie auto-optimisée (IA)',
            'Carousel rotatif en première page',
            'Statistiques d''engagement par photo',
            'Ordre intelligent par popularité',
            'Support dédié galerie'
        ],
        'Images',
        true,
        8
    );

-- ============================================================
-- TRIGGER: Update restaurant_galleries when pack is purchased
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_gallery_pack_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_max_photos INTEGER;
BEGIN
    -- Determine max_photos based on pack_id
    CASE NEW.service_id
        WHEN 'gallery-basic-pack'::uuid THEN v_max_photos := 5;
        WHEN 'gallery-extended-pack'::uuid THEN v_max_photos := 20;
        WHEN 'gallery-premium-pack'::uuid THEN v_max_photos := 50;
        ELSE v_max_photos := 5;
    END CASE;

    -- Update restaurant_galleries with new pack info and max_photos
    UPDATE public.restaurant_galleries
    SET
        pack_id = NEW.service_id,
        max_photos = v_max_photos,
        is_pack_active = (NEW.status = 'active')
    WHERE restaurant_id = NEW.restaurant_id;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_gallery_pack_purchased
    AFTER INSERT ON public.marketplace_purchases
    FOR EACH ROW
    WHEN (NEW.service_id IN (
        'gallery-basic-pack'::uuid,
        'gallery-extended-pack'::uuid,
        'gallery-premium-pack'::uuid
    ))
    EXECUTE FUNCTION public.handle_gallery_pack_purchase();

-- ============================================================
-- TRIGGER: Handle pack expiration or cancellation
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_gallery_pack_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- When pack is deactivated/expired, revert to basic gallery (5 photos)
    IF NEW.status != OLD.status AND NEW.status != 'active' THEN
        UPDATE public.restaurant_galleries
        SET
            max_photos = 5,
            is_pack_active = false
        WHERE pack_id = NEW.service_id AND restaurant_id = NEW.restaurant_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_gallery_pack_status_change
    AFTER UPDATE ON public.marketplace_purchases
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.handle_gallery_pack_status_change();

-- ============================================================
-- RLS POLICY: Restaurant can view their own pack purchase
-- ============================================================
CREATE POLICY IF NOT EXISTS "restaurant_can_view_own_gallery_pack"
    ON public.marketplace_purchases FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants
            WHERE owner_id = auth.uid()
        )
    );

-- ============================================================
-- Initialize existing restaurants with basic gallery pack
-- ============================================================
UPDATE public.restaurant_galleries
SET pack_id = 'gallery-basic-pack'::uuid
WHERE pack_id IS NULL;
