-- Les avis affichés sur la vitrine ne reposaient sur rien.
--
-- `restaurants.rating` et `restaurants.review_count` sont des compteurs
-- dénormalisés. Seule la création d'un avis les mettait à jour (route
-- POST /reviews, apps/api/src/modules/reviews/customer.ts), et ce recalcul
-- était partiel : rien à la suppression d'un avis, rien quand la modération en
-- masque un, et un garde `stats.length > 0` qui empêchait de repasser à zéro —
-- supprimer le dernier avis laissait le compteur à 1.
--
-- Surtout, 91 des 93 restaurants publiés portaient encore les valeurs des
-- données de démonstration : jusqu'à 289 avis annoncés pour 0 avis réel, ces
-- restaurants n'ayant jamais reçu d'avis, donc jamais déclenché le recalcul.
-- Pendant ce temps /api/store/:slug recomptait déjà à la volée depuis
-- `reviews`. Les deux surfaces se contredisaient : la carte de la liste
-- promettait « (48+) », la vitrine du même restaurant affichait « 0 avis ».
--
-- Ces colonnes deviennent réellement dérivées : `reviews` fait foi, le trigger
-- entretient le cache sur les quatre chemins (insertion, modification,
-- déplacement, suppression). Seuls les avis visibles comptent, pour qu'un avis
-- masqué disparaisse aussi de la moyenne.
--
-- Le recalcul remet 91 restaurants à 0 avis et 0 de note ; les cartes les
-- présentent alors comme « Nouveau ». Ces valeurs avaient été sauvegardées le
-- temps de valider le changement, puis la sauvegarde a été supprimée : les
-- compteurs se reconstruisent maintenant depuis `reviews`, ce que les chiffres
-- de démonstration, eux, ne permettaient pas.

CREATE OR REPLACE FUNCTION public.recalculer_avis_restaurant(p_restaurant_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE restaurants r
       SET review_count = s.nb,
           rating       = s.moyenne
      FROM (
        SELECT COUNT(*)::int AS nb,
               COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::double precision AS moyenne
          FROM reviews
         WHERE restaurant_id = p_restaurant_id
           AND is_visible IS NOT FALSE
      ) s
     WHERE r.id = p_restaurant_id;
$$;

COMMENT ON FUNCTION public.recalculer_avis_restaurant(uuid) IS
  'Recalcule restaurants.rating et review_count depuis les avis visibles.';

CREATE OR REPLACE FUNCTION public.trg_recalculer_avis_restaurant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculer_avis_restaurant(OLD.restaurant_id);
        RETURN OLD;
    END IF;

    -- Un avis déplacé d'un restaurant à l'autre en laisse deux à recalculer.
    IF TG_OP = 'UPDATE' AND OLD.restaurant_id IS DISTINCT FROM NEW.restaurant_id THEN
        PERFORM recalculer_avis_restaurant(OLD.restaurant_id);
    END IF;

    PERFORM recalculer_avis_restaurant(NEW.restaurant_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_avis_maj_compteurs ON public.reviews;
CREATE TRIGGER trg_avis_maj_compteurs
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_recalculer_avis_restaurant();

-- Remise à niveau de l'existant.
UPDATE restaurants r
   SET review_count = s.nb,
       rating       = s.moyenne
  FROM (
    SELECT rst.id,
           COUNT(v.id)::int AS nb,
           COALESCE(ROUND(AVG(v.rating)::numeric, 1), 0)::double precision AS moyenne
      FROM restaurants rst
      LEFT JOIN reviews v
        ON v.restaurant_id = rst.id AND v.is_visible IS NOT FALSE
     GROUP BY rst.id
  ) s
 WHERE r.id = s.id;
