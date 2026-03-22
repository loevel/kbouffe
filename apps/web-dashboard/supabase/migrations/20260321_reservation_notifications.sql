-- ─── Reservation status → client notification (in-app + realtime) ──────────
--
-- Étend client_notifications pour couvrir les réservations.
-- Un trigger AFTER UPDATE OF status sur `reservations` insère automatiquement
-- une notification dans `client_notifications` quand le statut change.
-- Le client voit la notif en temps réel via Supabase Realtime.

-- 1. Ajouter la colonne reservation_id (nullable) à client_notifications
ALTER TABLE public.client_notifications
    ADD COLUMN IF NOT EXISTS reservation_id UUID
        REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS client_notifications_reservation_id_idx
    ON public.client_notifications(reservation_id);

-- 2. Fonction trigger — notifie le client lors d'un changement de statut
CREATE OR REPLACE FUNCTION public.notify_client_reservation_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_title         TEXT;
    v_body          TEXT;
    v_type          TEXT;
    v_restaurant    TEXT;
    v_date_fmt      TEXT;
BEGIN
    -- Ne rien faire si pas de client ou statut inchangé
    IF NEW.customer_id IS NULL OR NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Nom du restaurant pour les messages personnalisés
    SELECT COALESCE(name, 'le restaurant')
    INTO v_restaurant
    FROM public.restaurants
    WHERE id = NEW.restaurant_id;

    -- Date formatée DD/MM/YYYY
    v_date_fmt := TO_CHAR(NEW.date, 'DD/MM/YYYY');

    CASE NEW.status
        WHEN 'confirmed' THEN
            v_type  := 'reservation_confirmed';
            v_title := 'Réservation confirmée ✓';
            v_body  := 'Votre réservation du ' || v_date_fmt ||
                       ' à ' || TO_CHAR(NEW.time, 'HH24:MI') ||
                       ' chez ' || v_restaurant ||
                       ' pour ' || NEW.party_size || ' personne(s) a été confirmée.';

        WHEN 'seated' THEN
            v_type  := 'reservation_seated';
            v_title := 'Votre table est prête !';
            v_body  := 'Bienvenue chez ' || v_restaurant ||
                       ' ! Votre table est prête, bonne dégustation.';

        WHEN 'completed' THEN
            v_type  := 'reservation_completed';
            v_title := 'Merci de votre visite';
            v_body  := 'Nous espérons vous avoir comblé chez ' || v_restaurant ||
                       '. N''hésitez pas à nous laisser un avis !';

        WHEN 'cancelled' THEN
            v_type  := 'reservation_cancelled';
            v_title := 'Réservation annulée';
            v_body  := 'Votre réservation du ' || v_date_fmt ||
                       ' chez ' || v_restaurant || ' a été annulée.' ||
                       CASE
                           WHEN NEW.cancellation_reason IS NOT NULL AND NEW.cancellation_reason <> ''
                           THEN ' Motif : ' || NEW.cancellation_reason
                           ELSE ''
                       END;

        WHEN 'no_show' THEN
            v_type  := 'reservation_no_show';
            v_title := 'Absence enregistrée';
            v_body  := 'Votre réservation du ' || v_date_fmt ||
                       ' chez ' || v_restaurant ||
                       ' a été clôturée (absence non signalée). Contactez-nous si c''est une erreur.';

        ELSE
            -- pending / seated intermédiaire : rien à notifier
            RETURN NEW;
    END CASE;

    INSERT INTO public.client_notifications
        (user_id, reservation_id, type, title, body)
    VALUES
        (NEW.customer_id, NEW.id, v_type, v_title, v_body);

    RETURN NEW;
END;
$$;

-- 3. Créer le trigger (remplace si déjà existant)
DROP TRIGGER IF EXISTS trg_notify_client_reservation_status ON public.reservations;
CREATE TRIGGER trg_notify_client_reservation_status
    AFTER UPDATE OF status ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.notify_client_reservation_status();
