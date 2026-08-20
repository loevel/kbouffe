-- Sauvegarde des notes et compteurs d'avis avant le recalcul qui suit
-- (20260819000001_avis_restaurants_compteurs_derives.sql).
--
-- 91 des 93 restaurants publiés portaient une note et un nombre d'avis issus
-- des données de démonstration : jusqu'à 289 avis annoncés pour 0 avis réel.
-- Le recalcul les remet à leur valeur réelle ; cette table garde l'état d'avant
-- pour pouvoir revenir en arrière.
--
-- Restauration :
--   UPDATE restaurants r SET rating = b.rating, review_count = b.review_count
--   FROM restaurants_avis_sauvegarde b WHERE b.restaurant_id = r.id;
--
-- Table jetable : la supprimer une fois la décision confirmée.
CREATE TABLE IF NOT EXISTS public.restaurants_avis_sauvegarde (
    restaurant_id uuid PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    rating        double precision,
    review_count  integer,
    sauvegarde_le timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.restaurants_avis_sauvegarde IS
  'Notes/compteurs d''avis de démonstration, sauvegardés avant le recalcul du 2026-08-19. Supprimable.';

INSERT INTO public.restaurants_avis_sauvegarde (restaurant_id, rating, review_count)
SELECT id, rating, review_count FROM public.restaurants
ON CONFLICT (restaurant_id) DO NOTHING;

ALTER TABLE public.restaurants_avis_sauvegarde ENABLE ROW LEVEL SECURITY;
