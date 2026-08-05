import { Hono } from "hono";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { CoreEnv, CoreVariables } from "@kbouffe/module-core";

const chat = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

/**
 * Service-role Supabase client — bypasses RLS.
 * Chat routes do their own authorization (isCustomer || isMerchant), so RLS is redundant.
 */
function chatDb(c: { env: CoreEnv }) {
    return createSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/**
 * Helper: Récupérer une conversation existante pour une commande, sans en créer.
 * Utilisé par les routes de LECTURE — visiter le chat ne doit pas générer une
 * conversation vide dans la messagerie du marchand.
 */
async function getExistingOrderConversation(supabase: any, orderId: string) {
    const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    return conv ?? null;
}

/**
 * Helper: Obtenir ou créer une conversation pour une commande.
 * Schema réel conversations: id, restaurant_id (NOT NULL), order_id, metadata, created_at, updated_at
 *
 * N'est appelé qu'au moment de l'ENVOI d'un message (jamais à la simple lecture),
 * pour éviter de créer des conversations vides.
 *
 * `conversations.order_id` porte un index UNIQUE partiel (order_id IS NOT NULL) —
 * voir migration 20260805_conversations_order_id_unique.sql. Le select-puis-insert
 * ci-dessous reste sujet à une course entre deux requêtes concurrentes (ex: client
 * et marchand ouvrant le chat en même temps) ; en cas de conflit, on récupère la
 * ligne créée entre-temps par l'autre requête plutôt que d'échouer ou de dupliquer.
 */
async function getOrCreateOrderConversation(
    supabase: any,
    orderId: string,
    restaurantId: string,
    customerName?: string | null
) {
    const existing = await getExistingOrderConversation(supabase, orderId);
    if (existing) return existing;

    const { data: createdConv, error: insertError } = await supabase
        .from("conversations")
        .insert({
            order_id: orderId,
            restaurant_id: restaurantId,
            metadata: {
                type: "order_support",
                ...(customerName ? { customer_name: customerName } : {}),
            },
        })
        .select()
        .single();

    if (!insertError) return createdConv;

    // Violation de la contrainte unique : une requête concurrente a créé la
    // conversation entre notre SELECT et notre INSERT. On la récupère plutôt
    // que de dupliquer ou d'échouer.
    if (insertError.code === "23505") {
        const raceWinner = await getExistingOrderConversation(supabase, orderId);
        if (raceWinner) return raceWinner;
    }

    console.error("[Chat] Error creating conversation:", insertError);
    throw new Error("Failed to create conversation");
}

/**
 * GET /chat/orders/:orderId/messages
 * Récupérer l'historique d'une conversation par ID de commande
 */
chat.get("/orders/:orderId/messages", async (c) => {
    const orderId = c.req.param("orderId");
    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    const db = chatDb(c);

    try {
        // Récupérer la commande pour obtenir restaurant_id et vérifier l'accès
        const { data: order, error: orderError } = await db
            .from("orders")
            .select("customer_id, restaurant_id")
            .eq("id", orderId)
            .single();

        if (orderError || !order) return c.json({ error: "Commande non trouvée" }, 404);

        const restaurantId = c.var.restaurantId;
        const isCustomer = userId === order.customer_id;
        const isMerchantForThisOrder = restaurantId && restaurantId === order.restaurant_id;

        if (!isCustomer && !isMerchantForThisOrder) {
            return c.json({ error: "Vous n'êtes pas autorisé à accéder à cette conversation" }, 403);
        }

        // Lecture seule : ne pas créer de conversation tant que personne n'a écrit.
        const conv = await getExistingOrderConversation(db, orderId);
        if (!conv) {
            return c.json({ conversationId: null, messages: [] });
        }

        const { data: chatMessages, error } = await db
            .from("messages")
            .select("id, conversation_id, sender_id, content, content_type, is_read, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        const transformed = (chatMessages || []).reverse().map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            content: msg.content,
            type: msg.content_type ?? "text",
            createdAt: msg.created_at,
        }));

        return c.json({ conversationId: conv.id, messages: transformed });
    } catch (err) {
        console.error("[Chat] Error fetching messages:", err);
        return c.json({ error: "Erreur lors de la récupération des messages" }, 500);
    }
});

/**
 * GET /chat/conversations/:id/messages
 * Récupérer l'historique d'une conversation par ID direct
 */
chat.get("/conversations/:id/messages", async (c) => {
    const conversationId = c.req.param("id");
    const db = chatDb(c);

    const { data: chatMessages, error } = await db
        .from("messages")
        .select("id, conversation_id, sender_id, content, content_type, is_read, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("[Chat] Error fetching messages:", error);
        return c.json({ error: "Erreur lors de la récupération des messages" }, 500);
    }

    const transformed = (chatMessages || []).reverse().map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        type: msg.content_type ?? "text",
        createdAt: msg.created_at,
    }));

    return c.json(transformed);
});

/**
 * POST /chat/orders/:orderId/messages
 * Envoi d'un message lié à une commande
 */
chat.post("/orders/:orderId/messages", async (c) => {
    const orderId = c.req.param("orderId");
    const body = await c.req.json();

    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    const content = body.content?.trim();
    if (!content) return c.json({ error: "Contenu requis" }, 400);

    const db = chatDb(c);

    try {
        // Récupérer la commande
        const { data: order, error: orderError } = await db
            .from("orders")
            .select("customer_id, restaurant_id")
            .eq("id", orderId)
            .single();

        if (orderError || !order) return c.json({ error: "Commande non trouvée" }, 404);

        const restaurantId = c.var.restaurantId;
        const isCustomer = userId === order.customer_id;
        const isMerchantForThisOrder = restaurantId && restaurantId === order.restaurant_id;

        if (!isCustomer && !isMerchantForThisOrder) {
            return c.json({ error: "Vous n'êtes pas autorisé à envoyer un message pour cette commande" }, 403);
        }

        // Nom du client pour l'affichage côté marchand (metadata.customer_name),
        // renseigné uniquement à la création de la conversation.
        const { data: customerProfile } = await db
            .from("users")
            .select("full_name, phone")
            .eq("id", order.customer_id)
            .maybeSingle();
        const customerName = customerProfile?.full_name || customerProfile?.phone || null;

        const conv = await getOrCreateOrderConversation(db, orderId, order.restaurant_id, customerName);

        // Schema messages: id, conversation_id, sender_id, content, content_type, is_read, created_at
        const { data: inserted, error: insertError } = await db
            .from("messages")
            .insert({
                conversation_id: conv.id,
                sender_id: userId,
                content,
                content_type: "text",
                is_read: false,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        const newMessage = {
            id: inserted.id,
            conversationId: inserted.conversation_id,
            senderId: inserted.sender_id,
            content: inserted.content,
            type: inserted.content_type ?? "text",
            createdAt: inserted.created_at,
        };

        // Broadcast Realtime
        try {
            await db.channel(`conversation:${conv.id}`).send({
                type: "broadcast",
                event: "new_message",
                payload: newMessage,
            });
        } catch (err) {
            console.error("[Realtime Error] Échec du broadcast Supabase:", err);
        }

        return c.json(newMessage);
    } catch (err) {
        console.error("[Chat] Error sending message:", err);
        return c.json({ error: "Erreur lors de l'envoi du message" }, 500);
    }
});

/**
 * POST /chat/conversations/:id/messages
 * Envoi d'un message direct par ID de conversation
 */
chat.post("/conversations/:id/messages", async (c) => {
    const conversationId = c.req.param("id");
    const body = await c.req.json();

    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    const content = body.content?.trim();
    if (!content) return c.json({ error: "Contenu requis" }, 400);

    const db = chatDb(c);

    const { data: inserted, error: insertError } = await db
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content,
            content_type: "text",
            is_read: false,
        })
        .select()
        .single();

    if (insertError) {
        console.error("[Chat] Error inserting message:", insertError);
        return c.json({ error: "Erreur lors de l'envoi du message" }, 500);
    }

    const newMessage = {
        id: inserted.id,
        conversationId: inserted.conversation_id,
        senderId: inserted.sender_id,
        content: inserted.content,
        type: inserted.content_type ?? "text",
        createdAt: inserted.created_at,
    };

    try {
        await db.channel(`conversation:${conversationId}`).send({
            type: "broadcast",
            event: "new_message",
            payload: newMessage,
        });
    } catch (err) {
        console.error("[Realtime Error] Échec du broadcast Supabase:", err);
    }

    return c.json(newMessage);
});

/**
 * POST /chat/orders/:orderId/upload
 * Upload d'une image pour le chat via commande (R2)
 */
chat.post("/orders/:orderId/upload", async (c) => {
    const bucket = c.env.IMAGES_BUCKET;
    if (!bucket) return c.json({ error: "Stockage R2 non configuré" }, 500);

    const body = await c.req.parseBody();
    const file = body["file"] as File;

    if (!file) return c.json({ error: "Aucun fichier fourni" }, 400);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
        return c.json({ error: "Type de fichier non supporté (JPG, PNG, WEBP, PDF uniquement)" }, 400);
    }

    const key = `chat/orders/${c.req.param("orderId")}/${crypto.randomUUID()}-${file.name}`;
    await bucket.put(key, file);

    const url = `https://pub-1729b536b57c42c9a54d530432764964.r2.dev/${key}`;
    return c.json({ url });
});

/**
 * POST /chat/conversations/:id/upload
 */
chat.post("/conversations/:id/upload", async (c) => {
    const bucket = c.env.IMAGES_BUCKET;
    if (!bucket) return c.json({ error: "Stockage R2 non configuré" }, 500);

    const body = await c.req.parseBody();
    const file = body["file"] as File;

    if (!file) return c.json({ error: "Aucun fichier fourni" }, 400);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
        return c.json({ error: "Type de fichier non supporté (JPG, PNG, WEBP, PDF uniquement)" }, 400);
    }

    const key = `chat/${crypto.randomUUID()}-${file.name}`;
    await bucket.put(key, file);

    const url = `https://pub-1729b536b57c42c9a54d530432764964.r2.dev/${key}`;
    return c.json({ url });
});

/**
 * POST /chat/conversations/:id/read
 * Marquer une conversation comme lue
 */
chat.post("/conversations/:id/read", async (c) => {
    const conversationId = c.req.param("id");

    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    const db = chatDb(c);

    // Authorize: only a participant may mark the thread read — the restaurant
    // owner/member (c.var.restaurantId is resolved by the auth middleware for
    // both) or, for order threads, the order's customer. (chatDb is service-role,
    // so this check is what prevents marking arbitrary conversations read.)
    const { data: conv, error: convErr } = await db
        .from("conversations")
        .select("id, restaurant_id, order_id")
        .eq("id", conversationId)
        .maybeSingle();

    if (convErr) {
        console.error("[Chat] Error loading conversation:", convErr);
        return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    }
    if (!conv) return c.json({ error: "Conversation non trouvée" }, 404);

    const restaurantId = c.var.restaurantId;
    const isMerchant = !!restaurantId && restaurantId === conv.restaurant_id;

    let isCustomer = false;
    if (!isMerchant && conv.order_id) {
        const { data: order } = await db
            .from("orders")
            .select("customer_id")
            .eq("id", conv.order_id)
            .maybeSingle();
        isCustomer = !!order && order.customer_id === userId;
    }

    if (!isMerchant && !isCustomer) {
        return c.json({ error: "Non autorisé" }, 403);
    }

    const { error } = await db
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId);

    if (error) {
        console.error("[Chat] Error marking as read:", error);
        return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    }

    return c.json({ success: true });
});

export const chatApi = {
    chatRoutes: chat,
};
