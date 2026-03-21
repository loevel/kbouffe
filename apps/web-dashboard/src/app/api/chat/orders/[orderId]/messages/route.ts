import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS.
 * The API does its own authorization (isCustomer || isMerchant).
 */
function chatDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * Helper: Get or create a conversation for an order.
 * conversations schema: id, restaurant_id (NOT NULL), order_id, metadata, created_at, updated_at
 */
async function getOrCreateOrderConversation(db: any, orderId: string, restaurantId: string) {
    const { data: conv } = await db
        .from("conversations")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (conv) return conv;

    const { data: createdConv, error: insertError } = await db
        .from("conversations")
        .insert({
            id: crypto.randomUUID(),
            restaurant_id: restaurantId,
            order_id: orderId,
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
 * GET /api/chat/orders/[orderId]/messages
 * Fetch conversation messages for an order (customer or restaurant merchant/staff)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const supabase = await createServerClient();
    const { orderId } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = chatDb();

    // Fetch order to verify authorization
    const { data: order, error: orderError } = await db
        .from("orders")
        .select("customer_id, restaurant_id")
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isCustomer = user.id === order.customer_id;
    let isMerchant = false;

    if (!isCustomer) {
        const { data: restaurant } = await db
            .from("restaurants")
            .select("owner_id")
            .eq("id", order.restaurant_id)
            .single();

        isMerchant = !!(restaurant && restaurant.owner_id === user.id);

        if (!isMerchant) {
            const { data: member } = await db
                .from("restaurant_members")
                .select("id")
                .eq("restaurant_id", order.restaurant_id)
                .eq("user_id", user.id)
                .eq("status", "active")
                .maybeSingle();
            isMerchant = !!member;
        }
    }

    if (!isCustomer && !isMerchant) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    try {
        const conv = await getOrCreateOrderConversation(db, orderId, order.restaurant_id);

        const { data: messages, error } = await db
            .from("messages")
            .select("id, conversation_id, sender_id, content, content_type, is_read, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });

        if (error) throw error;

        const transformed = (messages || []).map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            content: msg.content,
            type: msg.content_type ?? "text",
            createdAt: msg.created_at,
        }));

        return NextResponse.json({ conversationId: conv.id, messages: transformed });
    } catch (err) {
        console.error("[Chat] Error fetching messages:", err);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

/**
 * POST /api/chat/orders/[orderId]/messages
 * Send a message (customer or restaurant merchant/staff)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const supabase = await createServerClient();
    const { orderId } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})) as { content?: string };
    const { content } = body;

    if (!content?.trim()) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const db = chatDb();

    // Verify authorization
    const { data: order, error: orderError } = await db
        .from("orders")
        .select("customer_id, restaurant_id")
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isCustomer = user.id === order.customer_id;
    let isMerchant = false;

    if (!isCustomer) {
        const { data: restaurant } = await db
            .from("restaurants")
            .select("owner_id")
            .eq("id", order.restaurant_id)
            .single();

        isMerchant = !!(restaurant && restaurant.owner_id === user.id);

        if (!isMerchant) {
            const { data: member } = await db
                .from("restaurant_members")
                .select("id")
                .eq("restaurant_id", order.restaurant_id)
                .eq("user_id", user.id)
                .eq("status", "active")
                .maybeSingle();
            isMerchant = !!member;
        }
    }

    if (!isCustomer && !isMerchant) {
        return NextResponse.json({ error: "Not authorized to send messages for this order" }, { status: 403 });
    }

    try {
        const conv = await getOrCreateOrderConversation(db, orderId, order.restaurant_id);

        const messageId = crypto.randomUUID();
        const now = new Date().toISOString();

        const { error: insertError } = await db
            .from("messages")
            .insert({
                id: messageId,
                conversation_id: conv.id,
                sender_id: user.id,
                content: content.trim(),
                content_type: "text",
                is_read: false,
                created_at: now,
            });

        if (insertError) throw insertError;

        const newMessage = {
            id: messageId,
            conversationId: conv.id,
            senderId: user.id,
            content: content.trim(),
            type: "text",
            createdAt: now,
        };

        // Broadcast via Realtime so both sides receive instantly
        try {
            const rtClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            await rtClient.channel(`conversation:${conv.id}`).send({
                type: "broadcast",
                event: "new_message",
                payload: newMessage,
            });
        } catch (err) {
            console.error("[Chat] Realtime broadcast error:", err);
        }

        return NextResponse.json(newMessage, { status: 201 });
    } catch (err) {
        console.error("[Chat] Error sending message:", err);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
