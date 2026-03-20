import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Helper: Get or create a conversation for an order
 */
async function getOrCreateOrderConversation(supabase: any, orderId: string) {
    // Check if conversation exists
    const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (conv) return conv;

    // Create if doesn't exist
    const id = crypto.randomUUID();
    const newConv = {
        id,
        order_id: orderId,
        type: "order_support",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
 * GET /api/chat/orders/[orderId]/messages
 * Fetch conversation messages for an order
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const orderId = params.orderId;

        try {
            const conv = await getOrCreateOrderConversation(supabase, orderId);

            const { data: messages, error } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conv.id)
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Transform snake_case to camelCase for frontend
            const transformedMessages = (messages || []).map((msg: any) => ({
                id: msg.id,
                conversationId: msg.conversation_id,
                senderId: msg.sender_id,
                content: msg.content,
                type: msg.type,
                attachmentUrl: msg.attachment_url,
                createdAt: msg.created_at,
                readAt: msg.read_at,
            }));

            return NextResponse.json({
                conversationId: conv.id,
                messages: transformedMessages,
            });
        } catch (err) {
            console.error("[Chat] Error fetching messages:", err);
            return NextResponse.json(
                { error: "Failed to fetch messages" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("[Chat] Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/chat/orders/[orderId]/messages
 * Send a message for an order
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const orderId = params.orderId;
        const body = await request.json();
        const { content, type = "text", attachmentUrl } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        try {
            // Verify authorization: user must be the customer or the restaurant owner
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .select("customer_id, restaurant_id")
                .eq("id", orderId)
                .single();

            if (orderError || !order) {
                return NextResponse.json(
                    { error: "Order not found" },
                    { status: 404 }
                );
            }

            const isCustomer = user.id === order.customer_id;
            let isMerchant = false;

            if (!isCustomer) {
                // Check if user is the restaurant owner/merchant
                const { data: restaurant } = await supabase
                    .from("restaurants")
                    .select("owner_id")
                    .eq("id", order.restaurant_id)
                    .single();

                isMerchant = restaurant && restaurant.owner_id === user.id;
            }

            if (!isCustomer && !isMerchant) {
                return NextResponse.json(
                    { error: "Not authorized to send messages for this order" },
                    { status: 403 }
                );
            }

            const conv = await getOrCreateOrderConversation(supabase, orderId);

            const newMessage = {
                id: crypto.randomUUID(),
                conversation_id: conv.id,
                sender_id: user.id,
                content,
                type,
                attachment_url: attachmentUrl || null,
                created_at: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
                .from("messages")
                .insert(newMessage);

            if (insertError) throw insertError;

            // Transform to camelCase for response
            const transformedMessage = {
                id: newMessage.id,
                conversationId: newMessage.conversation_id,
                senderId: newMessage.sender_id,
                content: newMessage.content,
                type: newMessage.type,
                attachmentUrl: newMessage.attachment_url,
                createdAt: newMessage.created_at,
            };

            // Attempt to broadcast via Realtime (optional)
            try {
                await supabase.channel(`conversation:${conv.id}`).send({
                    type: "broadcast",
                    event: "new_message",
                    payload: transformedMessage,
                });
            } catch (err) {
                console.error("[Chat] Realtime broadcast error:", err);
                // Continue even if broadcast fails
            }

            return NextResponse.json(transformedMessage, { status: 201 });
        } catch (err) {
            console.error("[Chat] Error sending message:", err);
            return NextResponse.json(
                { error: "Failed to send message" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("[Chat] Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
