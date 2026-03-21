import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/dashboard/messages
 * Liste toutes les conversations du restaurant (support + commandes).
 * Retourne les conversations avec dernier message et nombre de non-lus.
 */
export async function GET() {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const admin = await createAdminClient();

        // Fetch all conversations for this restaurant
        const { data: conversations, error: convError } = await admin
            .from("conversations")
            .select("*")
            .eq("restaurant_id", ctx.restaurantId)
            .order("updated_at", { ascending: false });

        if (convError) throw convError;

        if (!conversations || conversations.length === 0) {
            return NextResponse.json([]);
        }

        const convIds = conversations.map((c: any) => c.id);

        // Fetch last message per conversation
        const { data: allMessages } = await admin
            .from("messages")
            .select("*")
            .in("conversation_id", convIds)
            .order("created_at", { ascending: false });

        const lastMessages = new Map<string, any>();
        for (const msg of allMessages || []) {
            if (!lastMessages.has(msg.conversation_id)) {
                lastMessages.set(msg.conversation_id, msg);
            }
        }

        // Fetch unread counts (messages not sent by merchant, not read)
        const unreadCounts = new Map<string, number>();
        for (const msg of allMessages || []) {
            if (!msg.is_read && msg.sender_id !== ctx.userId) {
                unreadCounts.set(
                    msg.conversation_id,
                    (unreadCounts.get(msg.conversation_id) || 0) + 1
                );
            }
        }

        // Assemble response
        const result = conversations.map((conv: any) => {
            const lastMsg = lastMessages.get(conv.id);
            const unread = unreadCounts.get(conv.id) || 0;
            const metadata = conv.metadata || {};

            return {
                id: conv.id,
                orderId: conv.order_id,
                type: metadata.type || "order_support",
                customerName: metadata.customer_name || "Client",
                subject: metadata.subject || null,
                ticketId: metadata.ticket_id || null,
                lastMessage: lastMsg
                    ? {
                          content: lastMsg.content,
                          senderId: lastMsg.sender_id,
                          createdAt: lastMsg.created_at,
                          contentType: lastMsg.content_type,
                      }
                    : null,
                unreadCount: unread,
                createdAt: conv.created_at,
                updatedAt: conv.updated_at,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/dashboard/messages error:", error);
        return apiError("Erreur lors de la récupération des messages");
    }
}
