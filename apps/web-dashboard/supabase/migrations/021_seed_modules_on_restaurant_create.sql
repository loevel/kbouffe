-- Migration 021: Trigger pour seeder les modules par défaut à la création d'un restaurant
-- Chaque nouveau restaurant reçoit automatiquement tous les modules activés.
-- L'admin peut ensuite les désactiver via le backoffice.

CREATE OR REPLACE FUNCTION public.seed_default_modules_for_restaurant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.restaurant_modules (restaurant_id, module_id, is_active)
    VALUES
        (NEW.id, 'reservations', true),
        (NEW.id, 'marketing',    true),
        (NEW.id, 'hr',           true),
        (NEW.id, 'delivery',     true),
        (NEW.id, 'dine_in',      true)
    ON CONFLICT (restaurant_id, module_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_modules_on_restaurant_create ON public.restaurants;

CREATE TRIGGER trg_seed_modules_on_restaurant_create
    AFTER INSERT ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.seed_default_modules_for_restaurant();
