import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendPushToRestaurant } from "@/lib/firebase/send-push";

/**
 * GET /api/auth/support/conversations
 * Liste les conversations de support de l'utilisateur connecté.
 * Retourne les tickets avec leur conversation liée et dernier message.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Fetch support tickets for this user
        const { data: tickets, error: ticketsError } = await supabase
            .from("support_tickets")
            .select("*")
            .eq("reporter_id", user.id)
            .order("created_at", { ascending: false });

        if (ticketsError) throw ticketsError;

        if (!tickets || tickets.length === 0) {
            return NextResponse.json([]);
        }

        // For each ticket, find the linked conversation and last message
        const admin = await createAdminClient();
        const ticketIds = tickets.map((t: any) => t.id);

        // Fetch conversations that reference these tickets via metadata
        const { data: conversations } = await admin
            .from("conversations")
            .select("*")
            .contains("metadata", { type: "support" });

        // Build a map of ticket_id -> conversation
        const convByTicket = new Map<string, any>();
        for (const conv of conversations || []) {
            const meta = conv.metadata as Record<string, any> | null;
            const ticketId = meta?.ticket_id;
            if (ticketId && ticketIds.includes(ticketId)) {
                convByTicket.set(ticketId, conv);
            }
        }

        // Fetch last message for each conversation
        const convIds = Array.from(convByTicket.values()).map((c: any) => c.id);
        let lastMessages = new Map<string, any>();

        if (convIds.length > 0) {
            // Get the latest message per conversation using distinct on
            const { data: messages } = await admin
                .from("messages")
                .select("*")
                .in("conversation_id", convIds)
                .order("created_at", { ascending: false });

            // Group by conversation_id, take the first (latest) per conversation
            for (const msg of messages || []) {
                if (!lastMessages.has(msg.conversation_id)) {
                    lastMessages.set(msg.conversation_id, msg);
                }
            }
        }

        // Fetch unread counts
        let unreadCounts = new Map<string, number>();
        if (convIds.length > 0) {
            const { data: unreadMessages } = await admin
                .from("messages")
                .select("conversation_id")
                .in("conversation_id", convIds)
                .eq("is_read", false)
                .neq("sender_id", user.id);

            for (const msg of unreadMessages || []) {
                unreadCounts.set(
                    msg.conversation_id,
                    (unreadCounts.get(msg.conversation_id) || 0) + 1
                );
            }
        }

        // Assemble response
        const result = tickets.map((ticket: any) => {
            const conv = convByTicket.get(ticket.id);
            const lastMsg = conv ? lastMessages.get(conv.id) : null;
            const unread = conv ? (unreadCounts.get(conv.id) || 0) : 0;

            return {
                ticket,
                conversationId: conv?.id || null,
                restaurantId: conv?.restaurant_id || ticket.restaurant_id,
                lastMessage: lastMsg
                    ? {
                          content: lastMsg.content,
                          senderId: lastMsg.sender_id,
                          createdAt: lastMsg.created_at,
                      }
                    : null,
                unreadCount: unread,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Erreur API fetch support conversations:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération des conversations" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/auth/support/conversations
 * Crée un ticket de support + conversation liée.
 * Body: { subject, description, restaurant_id?, order_id? }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const { subject, description, restaurant_id, order_id } = body;

        if (!subject || !description) {
            return NextResponse.json(
                { error: "Sujet et description sont requis" },
                { status: 400 }
            );
        }

        const admin = await createAdminClient();

        // If we have an order_id, check that the order belongs to this user and get restaurant_id
        let resolvedRestaurantId = restaurant_id;
        if (order_id && !resolvedRestaurantId) {
            const { data: order } = await admin
                .from("orders")
                .select("restaurant_id, customer_id")
                .eq("id", order_id)
                .single();

            if (!order || order.customer_id !== user.id) {
                return NextResponse.json(
                    { error: "Commande non trouvée" },
                    { status: 404 }
                );
            }
            resolvedRestaurantId = order.restaurant_id;
        }

        // restaurant_id is required for conversations table (NOT NULL)
        if (!resolvedRestaurantId) {
            return NextResponse.json(
                { error: "Le restaurant est requis pour ouvrir une conversation" },
                { status: 400 }
            );
        }

        // Create support ticket
        const { data: ticket, error: ticketError } = await admin
            .from("support_tickets")
            .insert({
                reporter_id: user.id,
                reporter_type: "client",
                subject,
                description,
                priority: "medium",
                status: "open",
                order_id: order_id || null,
                restaurant_id: resolvedRestaurantId,
            })
            .select()
            .single();

        if (ticketError) {
            console.error("[Support] Ticket insert error:", ticketError);
            return NextResponse.json(
                { error: `Erreur création ticket: ${ticketError.message}` },
                { status: 500 }
            );
        }

        // Fetch user name for metadata
        const { data: userProfile } = await admin
            .from("users")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();

        // Create linked conversation (no order_id on conversation — avoids FK conflict
        // with existing order conversations; support convs are identified by metadata.type)
        const { data: conversation, error: convError } = await admin
            .from("conversations")
            .insert({
                restaurant_id: resolvedRestaurantId,
                metadata: {
                    type: "support",
                    ticket_id: ticket.id,
                    customer_id: user.id,
                    customer_name: userProfile?.full_name || userProfile?.phone || "Client",
                    subject,
                },
            })
            .select()
            .single();

        if (convError) {
            console.error("[Support] Conversation insert error:", convError);
            return NextResponse.json(
                { error: `Erreur création conversation: ${convError.message}` },
                { status: 500 }
            );
        }

        // Insert initial message (the description as first message)
        const { error: msgError } = await admin.from("messages").insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            content: description,
            content_type: "text",
            is_read: false,
        });

        if (msgError) {
            console.error("[Support] Message insert error:", msgError);
            // Non-fatal — conversation exists, just no initial message
        }

        // Notify restaurant of the new support ticket (fire-and-forget)
        const preview = description.length > 80 ? description.slice(0, 77) + "…" : description;
        sendPushToRestaurant(admin as any, resolvedRestaurantId, {
            title: `🎫 Nouveau ticket : ${subject}`,
            body: preview,
            data: { conversationId: conversation.id, ticketId: ticket.id, type: "support_ticket" },
            link: `/dashboard/messages`,
        }).catch((e) => console.error("[Support] push to restaurant failed:", e));

        return NextResponse.json({ ticket, conversation });
    } catch (error: any) {
        console.error("Erreur API create support conversation:", error);
        return NextResponse.json(
            { error: error?.message || "Erreur serveur lors de la création de la conversation" },
            { status: 500 }
        );
    }
}
