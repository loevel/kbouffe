-- ================================================================
-- Migration 035 : Support bilingue FR/EN (i18n) pour produits,
-- catégories et restaurants
-- ================================================================
-- Principe :
--   • name_i18n / description_i18n = JSONB { "fr": "...", "en": "..." }
--   • Les colonnes name / description existantes restent le texte
--     primaire (FR). Les colonnes i18n ne sont utilisées que si le
--     restaurateur a renseigné une traduction.
--   • Backward-compatible : aucune donnée existante n'est modifiée.
-- ================================================================

-- ── products ─────────────────────────────────────────────────────
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS name_i18n        JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS description_i18n JSONB          DEFAULT '{}';

-- ── categories ───────────────────────────────────────────────────
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS name_i18n        JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS description_i18n JSONB          DEFAULT '{}';

-- ── restaurants ───────────────────────────────────────────────────
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS description_i18n JSONB DEFAULT '{}';

-- ── Index GIN pour recherche future dans les JSONB ───────────────
CREATE INDEX IF NOT EXISTS products_name_i18n_idx
    ON public.products USING GIN (name_i18n);

CREATE INDEX IF NOT EXISTS categories_name_i18n_idx
    ON public.categories USING GIN (name_i18n);

-- ── Commentaires ─────────────────────────────────────────────────
COMMENT ON COLUMN public.products.name_i18n        IS 'Traductions du nom. Format : {"fr":"...","en":"..."}';
COMMENT ON COLUMN public.products.description_i18n IS 'Traductions de la description. Format : {"fr":"...","en":"..."}';
COMMENT ON COLUMN public.categories.name_i18n      IS 'Traductions du nom de catégorie. Format : {"fr":"...","en":"..."}';
COMMENT ON COLUMN public.restaurants.description_i18n IS 'Traductions de la description du restaurant. Format : {"fr":"...","en":"..."}';
