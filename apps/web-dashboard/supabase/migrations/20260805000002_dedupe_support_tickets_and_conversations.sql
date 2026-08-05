-- Nettoie les tickets de support (et conversations liées) dupliqués par
-- l'ancienne absence de garde-fou anti-double-soumission dans
-- POST /account/support/tickets (packages/modules/core/src/api/users.ts).
-- Exemple observé : un même client a soumis 9 fois le même ticket
-- ("probleme avec le deg de piment") en moins de 30 minutes, chaque soumission
-- créant un nouveau support_ticket + une nouvelle conversation.
--
-- On regroupe par (reporter_id, subject, description) : la première
-- soumission est conservée, les suivantes créées dans les 24h qui suivent
-- sont considérées comme des doublons de soumission. Leurs messages sont
-- réattachés à la conversation conservée avant suppression.

DO $$
DECLARE
    keep_ticket_id uuid;
    keep_conv_id uuid;
    dup_ticket_id uuid;
    dup_conv_id uuid;
    grp record;
BEGIN
    FOR grp IN
        SELECT reporter_id, subject, description
        FROM public.support_tickets
        GROUP BY reporter_id, subject, description
        HAVING COUNT(*) > 1
           AND MAX(created_at) - MIN(created_at) < interval '24 hours'
    LOOP
        SELECT id INTO keep_ticket_id
        FROM public.support_tickets
        WHERE reporter_id = grp.reporter_id
          AND subject = grp.subject
          AND description = grp.description
        ORDER BY created_at ASC
        LIMIT 1;

        SELECT id INTO keep_conv_id
        FROM public.conversations
        WHERE metadata->>'ticket_id' = keep_ticket_id::text
        LIMIT 1;

        FOR dup_ticket_id IN
            SELECT id FROM public.support_tickets
            WHERE reporter_id = grp.reporter_id
              AND subject = grp.subject
              AND description = grp.description
              AND id <> keep_ticket_id
        LOOP
            SELECT id INTO dup_conv_id
            FROM public.conversations
            WHERE metadata->>'ticket_id' = dup_ticket_id::text
            LIMIT 1;

            IF dup_conv_id IS NOT NULL THEN
                IF keep_conv_id IS NOT NULL THEN
                    UPDATE public.messages SET conversation_id = keep_conv_id WHERE conversation_id = dup_conv_id;
                    DELETE FROM public.conversation_participants WHERE conversation_id = dup_conv_id;
                    DELETE FROM public.conversations WHERE id = dup_conv_id;
                ELSE
                    -- Pas encore de conversation conservée pour ce groupe : on
                    -- promeut celle du doublon courant plutôt que de la perdre.
                    keep_conv_id := dup_conv_id;
                END IF;
            END IF;

            DELETE FROM public.support_tickets WHERE id = dup_ticket_id;
        END LOOP;
    END LOOP;
END $$;
