-- Empêche la création de conversations dupliquées pour une même commande.
--
-- getOrCreateOrderConversation() (packages/modules/chat/src/api/index.ts) fait un
-- SELECT puis un INSERT non atomiques : deux requêtes concurrentes (client et
-- marchand ouvrant/écrivant dans le chat en même temps) pouvaient toutes deux
-- constater l'absence de conversation et en créer chacune une, produisant des
-- doublons visibles dans /dashboard/messages (ex: conversation "Dorlin" dupliquée
-- ~9 fois). L'index UNIQUE ci-dessous transforme la seconde insertion concurrente
-- en erreur de contrainte (code 23505) que le code applicatif intercepte pour
-- récupérer la ligne gagnante au lieu de dupliquer.
--
-- Partiel (WHERE order_id IS NOT NULL) car les conversations de support
-- (metadata.type = "support") n'ont pas de order_id et plusieurs peuvent coexister.

-- Supprime d'abord les doublons existants, en conservant la conversation la plus
-- ancienne (celle qui porte l'historique de messages le plus complet) par order_id
-- et en réattachant les messages des doublons avant de les supprimer.
DO $$
DECLARE
    keep_id uuid;
    dup_id uuid;
    order_row record;
BEGIN
    FOR order_row IN
        SELECT order_id
        FROM public.conversations
        WHERE order_id IS NOT NULL
        GROUP BY order_id
        HAVING COUNT(*) > 1
    LOOP
        SELECT id INTO keep_id
        FROM public.conversations
        WHERE order_id = order_row.order_id
        ORDER BY created_at ASC
        LIMIT 1;

        FOR dup_id IN
            SELECT id FROM public.conversations
            WHERE order_id = order_row.order_id AND id <> keep_id
        LOOP
            UPDATE public.messages SET conversation_id = keep_id WHERE conversation_id = dup_id;
            DELETE FROM public.conversation_participants WHERE conversation_id = dup_id;
            DELETE FROM public.conversations WHERE id = dup_id;
        END LOOP;
    END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_order_id_unique
    ON public.conversations (order_id)
    WHERE order_id IS NOT NULL;
