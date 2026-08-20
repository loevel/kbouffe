-- Recherche insensible aux accents sur les restaurants et les produits.
--
-- La vitrine cherchait en `ilike '%q%'` directement sur `name`, `city`,
-- `cuisine_type` et `products.name`. Résultat mesuré en production :
-- « ndolé » remontait 58 restaurants, « ndole » un seul — or c'est la seconde
-- forme qu'on tape sur un clavier de téléphone, sans accent.
--
-- On matérialise donc une forme normalisée (minuscules, sans accents ni
-- ligatures) dans une colonne générée, et on cherche dessus.
--
-- `unaccent()` conviendrait mais n'est pas IMMUTABLE : elle dépend d'un
-- dictionnaire modifiable, donc Postgres refuse de l'utiliser dans une colonne
-- générée. `translate()` sur une table de caractères explicite l'est, elle.
--
-- Les deux chaînes de `translate` doivent rester de longueur identique
-- (54 caractères) : tout décalage traduirait silencieusement les mauvaises
-- lettres. Les ligatures sont traitées avant, par `replace`, parce qu'elles se
-- développent sur deux caractères et que `translate` fait du un-pour-un.
--
-- Attention : `apps/web-dashboard/src/lib/search/normalize.ts` applique les
-- mêmes règles côté requête. Les deux doivent évoluer ensemble, sinon le terme
-- normalisé d'un côté ne correspond plus à la colonne de l'autre.

-- `ilike '%x%'` ne peut pas utiliser d'index B-tree : le joker en tête interdit
-- le parcours ordonné. Les trigrammes, eux, indexent les sous-chaînes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.sans_accents(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT lower(translate(
        replace(replace(replace(replace(coalesce(txt, ''),
            'œ','oe'), 'Œ','OE'), 'æ','ae'), 'Æ','AE'),
        'àáâãäåÀÁÂÃÄÅçÇèéêëÈÉÊËìíîïÌÍÎÏñÑòóôõöÒÓÔÕÖùúûüÙÚÛÜýÿÝŸ',
        'aaaaaaAAAAAAcCeeeeEEEEiiiiIIIInNoooooOOOOOuuuuUUUUyyYY'
    ));
$function$;

-- Le nom, la ville et le type de cuisine dans un seul champ : la recherche
-- principale les interrogeait par un `.or()` de trois `ilike`, une seule
-- colonne suffit et un seul index la couvre.
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS recherche_normalisee text
    GENERATED ALWAYS AS (public.sans_accents(
        coalesce(name, '') || ' ' || coalesce(city, '') || ' ' || coalesce(cuisine_type, '')
    )) STORED;

-- La description est incluse : c'est là que se trouvent les ingrédients, donc
-- ce qu'un client cherche quand il tape « arachide » ou « plantain ».
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS recherche_normalisee text
    GENERATED ALWAYS AS (public.sans_accents(
        coalesce(name, '') || ' ' || coalesce(description, '')
    )) STORED;

CREATE INDEX IF NOT EXISTS idx_restaurants_recherche_trgm
    ON public.restaurants USING gin (recherche_normalisee gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_recherche_trgm
    ON public.products USING gin (recherche_normalisee gin_trgm_ops);
