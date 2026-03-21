import { Hono } from "hono";
import type { CoreEnv, CoreVariables } from "@kbouffe/module-core";

const chat = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

/**
 * Helper: Obtenir ou créer une conversation pour une commande.
 * Schema réel conversations: id, restaurant_id (NOT NULL), order_id, metadata, created_at, updated_at
 */
async function getOrCreateOrderConversation(supabase: any, orderId: string, restaurantId: string) {
    const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (conv) return conv;

    const { data: createdConv, error: insertError } = await supabase
        .from("conversations")
        .insert({
            order_id: orderId,
            restaurant_id: restaurantId,
            metadata: { type: "order_support" },
        })
        .select()
        .single();

    if (insertError) {
        console.error("[Chat] Error creating conversation:", insertError);
        throw new Error("Failed to create conversation");
    }

    return createdConv;
}

/**
 * GET /chat/orders/:orderId/messages
 * Récupérer l'historique d'une conversation par ID de commande
 */
chat.get("/orders/:orderId/messages", async (c) => {
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);

    const orderId = c.req.param("orderId");
    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    try {
        // Récupérer la commande pour obtenir restaurant_id et vérifier l'accès
        const { data: order, error: orderError } = await supabase
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

        const conv = await getOrCreateOrderConversation(supabase, orderId, order.restaurant_id);

        const { data: chatMessages, error } = await supabase
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
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);

    const conversationId = c.req.param("id");

    const { data: chatMessages, error } = await supabase
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
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);

    const orderId = c.req.param("orderId");
    const body = await c.req.json();

    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    const content = body.content?.trim();
    if (!content) return c.json({ error: "Contenu requis" }, 400);

    try {
        // Récupérer la commande
        const { data: order, error: orderError } = await supabase
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

        const conv = await getOrCreateOrderConversation(supabase, orderId, order.restaurant_id);

        // Schema messages: id, conversation_id, sender_id, content, content_type, is_read, created_at
        const { data: inserted, error: insertError } = await supabase
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
            await supabase.channel(`conversation:${conv.id}`).send({
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
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);

    const conversationId = c.req.param("id");
    const body = await c.req.json();

    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    const content = body.content?.trim();
    if (!content) return c.json({ error: "Contenu requis" }, 400);

    const { data: inserted, error: insertError } = await supabase
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
        await supabase.channel(`conversation:${conversationId}`).send({
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
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);

    const conversationId = c.req.param("id");

    const { error } = await supabase
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
