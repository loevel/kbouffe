-- ============================================================
-- Sous-domaine personnalisé pour restaurant (feature premium_storefront)
-- Permet à un restaurant abonné au pack "premium_storefront" d'exposer
-- sa vitrine sur <slug>.kbouffe.com au lieu de kbouffe.com/r/<slug>.
-- Le wildcard DNS *.kbouffe.com existe déjà (Cloudflare, proxied).
-- Date : 2026-08-05
-- ============================================================

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_subdomain TEXT DEFAULT NULL;

COMMENT ON COLUMN public.restaurants.custom_subdomain IS
  'Sous-domaine personnalisé (ex: pizza-momo → pizza-momo.kbouffe.com). '
  'Actif uniquement si le restaurant a un abonnement "premium_storefront" en statut active.';

-- Format : minuscules, chiffres, tirets, 3 à 63 caractères (limite DNS label).
-- Interdit de commencer/finir par un tiret.
ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_custom_subdomain_format_check
  CHECK (
    custom_subdomain IS NULL
    OR custom_subdomain ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'
  );

-- Sous-domaines réservés à l'infrastructure — jamais attribuables à un restaurant.
ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_custom_subdomain_reserved_check
  CHECK (
    custom_subdomain IS NULL
    OR custom_subdomain NOT IN (
      'www', 'admin', 'api', 'blog', 'app', 'mail', 'ns1', 'ns2',
      'status', 'docs', 'staging', 'dev', 'cdn', 'assets', 'mcp'
    )
  );

-- Unicité insensible à la casse (un seul restaurant par sous-domaine).
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_custom_subdomain_unique_idx
  ON public.restaurants (lower(custom_subdomain))
  WHERE custom_subdomain IS NOT NULL;

-- ============================================================
-- FUNCTION : restaurant_has_active_premium_storefront
-- Vérifie si un restaurant a acheté le service "premium_storefront" et que
-- l'achat est actif. SECURITY DEFINER pour être appelable depuis le
-- middleware (clé anon) sans exposer marketplace_purchases/marketplace_services
-- en lecture publique.
-- Schéma réel : marketplace_services (catalogue, slug unique) +
-- marketplace_purchases (restaurant_id, service_id, status text, expires_at).
-- ============================================================
CREATE OR REPLACE FUNCTION public.restaurant_has_active_premium_storefront(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.marketplace_purchases mpu
    JOIN public.marketplace_services ms ON ms.id = mpu.service_id
    WHERE mpu.restaurant_id = p_restaurant_id
      AND ms.slug = 'premium_storefront'
      AND mpu.status = 'active'
      AND (mpu.expires_at IS NULL OR mpu.expires_at > now())
  );
$$;

-- ============================================================
-- FUNCTION : resolve_custom_subdomain
-- Résout un sous-domaine vers le slug du restaurant correspondant,
-- uniquement si l'abonnement premium_storefront est actif.
-- Utilisée par le middleware Next.js (edge) — une seule requête RPC,
-- pas d'accès direct aux tables sensibles depuis le client anon.
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_custom_subdomain(p_subdomain TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.slug
  FROM public.restaurants r
  WHERE lower(r.custom_subdomain) = lower(p_subdomain)
    AND public.restaurant_has_active_premium_storefront(r.id)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_custom_subdomain(TEXT) TO anon, authenticated;
