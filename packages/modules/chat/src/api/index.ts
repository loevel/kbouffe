import { Hono } from "hono";
import type { CoreEnv, CoreVariables } from "@kbouffe/module-core";

const chat = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

/**
 * Helper: Obtenir ou créer une conversation pour une commande via Supabase
 */
async function getOrCreateOrderConversation(supabase: any, orderId: string) {
    // 1. Chercher si elle existe déjà
    const { data: conv, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (conv) return conv;

    // 2. Créer si elle n'existe pas
    const id = crypto.randomUUID();
    const newConv = {
        id,
        order_id: orderId,
        type: "order_support",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data: createdConv, error: insertError } = await supabase
        .from("conversations")
        .insert(newConv)
        .select()
        .single();

    if (insertError) {
        console.error("[Chat] Error creating conversation:", insertError);
        throw new Error("Failed to create conversation");
    }

    return createdConv;
}

/**
 * Récupérer l'historique d'une conversation par ID de commande
 */
chat.get("/orders/:orderId/messages", async (c) => {
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);
    
    const orderId = c.req.param("orderId");
    
    try {
        const conv = await getOrCreateOrderConversation(supabase, orderId);

        const { data: chatMessages, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        return c.json({
            conversationId: conv.id,
            messages: (chatMessages || []).reverse()
        });
    } catch (err) {
        console.error("[Chat] Error fetching messages:", err);
        return c.json({ error: "Erreur lors de la récupération des messages" }, 500);
    }
});

/**
 * Récupérer l'historique d'une conversation (par ID direct de conversation)
 */
chat.get("/conversations/:id/messages", async (c) => {
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);
    
    const conversationId = c.req.param("id");

    const { data: chatMessages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("[Chat] Error fetching messages:", error);
        return c.json({ error: "Erreur lors de la récupération des messages" }, 500);
    }

    return c.json((chatMessages || []).reverse());
});

/**
 * Envoi d'un message lié à une commande
 */
chat.post("/orders/:orderId/messages", async (c) => {
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);

    const orderId = c.req.param("orderId");
    const body = await c.req.json();
    
    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    try {
        const conv = await getOrCreateOrderConversation(supabase, orderId);
        const conversationId = conv.id;

        // --- Autorisation ---
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
        // --------------------

        const newMessageId = crypto.randomUUID();
        const newMessage = {
            id: newMessageId,
            conversation_id: conversationId,
            sender_id: userId,
            content: body.content,
            type: body.type || "text",
            attachment_url: body.attachmentUrl,
            created_at: new Date().toISOString(),
        };

        // 1. Persistance dans Supabase
        const { error: insertError } = await supabase
            .from("messages")
            .insert(newMessage);

        if (insertError) throw insertError;

        // 2. Diffusion temps réel via Supabase Broadcast (optionnel car Supabase le fait déjà si activé sur la table, 
        //    mais on garde la logique de broadcast manuel si nécessaire pour des payloads spécifiques)
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
    } catch (err) {
        console.error("[Chat] Error sending message:", err);
        return c.json({ error: "Erreur lors de l'envoi du message" }, 500);
    }
});

/**
 * Envoi d'un message direct par ID de conversation
 */
chat.post("/conversations/:id/messages", async (c) => {
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);

    const conversationId = c.req.param("id");
    const body = await c.req.json();
    
    const userId = c.var.userId;
    if (!userId) return c.json({ error: "Utilisateur non identifié" }, 401);

    const newMessageId = crypto.randomUUID();
    const newMessage = {
        id: newMessageId,
        conversation_id: conversationId,
        sender_id: userId,
        content: body.content,
        type: body.type || "text",
        attachment_url: body.attachmentUrl,
        created_at: new Date().toISOString(),
    };

    // 1. Persistance dans Supabase
    const { error: insertError } = await supabase
        .from("messages")
        .insert(newMessage);

    if (insertError) {
        console.error("[Chat] Error inserting message:", insertError);
        return c.json({ error: "Erreur lors de l'envoi du message" }, 500);
    }

    // 2. Diffusion temps réel
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
 * Upload d'une image pour le chat via commande (R2 reste utilisé)
 */
chat.post("/orders/:orderId/upload", async (c) => {
    const bucket = c.env.IMAGES_BUCKET;
    if (!bucket) return c.json({ error: "Stockage R2 non configuré" }, 500);

    const body = await c.req.parseBody();
    const file = body["file"] as File;

    if (!file) return c.json({ error: "Aucun fichier fourni" }, 400);

    // Issue 11: MIME type validation
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
 * Upload d'une image pour le chat (R2 reste utilisé)
 */
chat.post("/conversations/:id/upload", async (c) => {
    const bucket = c.env.IMAGES_BUCKET;
    if (!bucket) return c.json({ error: "Stockage R2 non configuré" }, 500);

    const body = await c.req.parseBody();
    const file = body["file"] as File;

    if (!file) return c.json({ error: "Aucun fichier fourni" }, 400);

    // Issue 11: MIME type validation
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
 * Marquer une conversation comme lue
 */
chat.post("/conversations/:id/read", async (c) => {
    const supabase = c.var.supabase;
    if (!supabase) return c.json({ error: "Supabase client non configuré" }, 500);
    
    const conversationId = c.req.param("id");

    const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
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
