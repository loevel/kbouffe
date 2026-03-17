-- ============================================================
-- Migration : Auto-création du restaurant à l'inscription d'un merchant
-- ============================================================

-- Fonction helper pour générer un slug à partir du nom du restaurant
CREATE OR REPLACE FUNCTION public.slugify(text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    slug TEXT;
BEGIN
    slug := lower(trim(text));
    slug := regexp_replace(slug, '[àáâãäå]', 'a', 'g');
    slug := regexp_replace(slug, '[èéêë]', 'e', 'g');
    slug := regexp_replace(slug, '[ìíîï]', 'i', 'g');
    slug := regexp_replace(slug, '[òóôõö]', 'o', 'g');
    slug := regexp_replace(slug, '[ùúûü]', 'u', 'g');
    slug := regexp_replace(slug, '[ç]', 'c', 'g');
    slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
    slug := regexp_replace(slug, '[\s-]+', '-', 'g');
    slug := regexp_replace(slug, '^-+|-+$', '', 'g');
    RETURN slug;
END;
$$;

-- Mettre à jour handle_new_user pour :
-- 1) Lire le rôle depuis les metadata (merchant ou customer)
-- 2) Aussi enregistrer le phone depuis les metadata
-- 3) Auto-créer un restaurant si le rôle est 'merchant' et un restaurant_name est fourni
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    _role user_role;
    _full_name TEXT;
    _phone TEXT;
    _restaurant_name TEXT;
    _slug TEXT;
    _base_slug TEXT;
    _counter INT := 0;
BEGIN
    _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    _phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone);
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer');
    _restaurant_name := NEW.raw_user_meta_data->>'restaurant_name';

    -- 1) Créer le profil utilisateur
    INSERT INTO public.users (id, email, phone, full_name, role)
    VALUES (NEW.id, NEW.email, _phone, _full_name, _role);

    -- 2) Si c'est un merchant et qu'un nom de restaurant est fourni, créer le restaurant
    IF _role = 'merchant' AND _restaurant_name IS NOT NULL AND _restaurant_name != '' THEN
        _base_slug := slugify(_restaurant_name);
        _slug := _base_slug;

        -- Gérer l'unicité du slug en ajoutant un suffixe si nécessaire
        WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = _slug) LOOP
            _counter := _counter + 1;
            _slug := _base_slug || '-' || _counter;
        END LOOP;

        INSERT INTO public.restaurants (owner_id, name, slug, email, phone)
        VALUES (NEW.id, _restaurant_name, _slug, NEW.email, _phone);
    END IF;

    RETURN NEW;
END;
$$;
