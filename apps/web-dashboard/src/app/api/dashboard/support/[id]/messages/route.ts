/**
 * GET  /api/dashboard/support/[id]/messages  — liste les messages du ticket
 * POST /api/dashboard/support/[id]/messages  — envoie un message (restaurant)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAdmins } from "@/lib/firebase/send-push";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { restaurantId, userId } = auth.ctx;

    const { id } = await params;

    // Service role client — bypass RLS on support tables
    const adminSupa = await createAdminClient();
    const db = adminSupa as any;

    // Verify ticket belongs to this restaurant
    const { data: ticket, error: ticketErr } = await db
        .from("support_tickets")
        .select("id, unread_reporter, status")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .eq("reporter_type", "restaurant")
        .single();

    if (ticketErr || !ticket) {
        return apiError("Ticket introuvable ou accès refusé", 404);
    }

    const { data, error } = await db
        .from("support_messages")
        .select("id, ticket_id, sender_id, sender_type, content, is_read, created_at")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[GET /api/dashboard/support/[id]/messages]", error);
        return apiError("Erreur de chargement des messages");
    }

    // Enrich with sender names (batch lookup)
    const senderIds = [...new Set((data ?? []).map((m: any) => m.sender_id).filter(Boolean))];
    const senderMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (senderIds.length > 0) {
        const { data: users } = await db
            .from("users")
            .select("id, full_name, avatar_url")
            .in("id", senderIds);
        (users ?? []).forEach((u: any) => {
            senderMap[u.id] = { full_name: u.full_name, avatar_url: u.avatar_url };
        });
    }

    // Mark admin messages as read + reset unread_reporter counter
    await db
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", id)
        .eq("sender_type", "admin");

    await db
        .from("support_tickets")
        .update({ unread_reporter: 0 })
        .eq("id", id);

    const messages = (data ?? []).map((m: any) => {
        const sender = senderMap[m.sender_id] ?? null;
        return {
            id: m.id,
            ticketId: m.ticket_id,
            senderId: m.sender_id,
            senderType: m.sender_type,
            content: m.content,
            isRead: m.is_read,
            createdAt: m.created_at,
            senderName: sender?.full_name ?? null,
            senderAvatar: sender?.avatar_url ?? null,
            isMe: m.sender_id === userId,
        };
    });

    return NextResponse.json({ messages, ticket });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { restaurantId, userId } = auth.ctx;

    const { id } = await params;

    // Service role client — bypass RLS on support tables
    const adminSupa = await createAdminClient();
    const db = adminSupa as any;

    try {
        const { content } = await request.json();
        if (!content?.trim()) return apiError("Message vide", 400);

        // Verify ticket belongs to this restaurant and is not closed
        const { data: ticket, error: ticketErr } = await db
            .from("support_tickets")
            .select("id, subject, status, unread_admin")
            .eq("id", id)
            .eq("restaurant_id", restaurantId)
            .eq("reporter_type", "restaurant")
            .single();

        if (ticketErr || !ticket) {
            return apiError("Ticket introuvable ou accès refusé", 404);
        }

        if (ticket.status === "closed") {
            return apiError("Ce ticket est fermé. Créez un nouveau ticket.", 400);
        }

        // Fetch restaurant name for push notification
        const { data: restaurant } = await db
            .from("restaurants")
            .select("name")
            .eq("id", restaurantId)
            .maybeSingle();
        const restaurantName = restaurant?.name ?? "Un restaurant";

        const { data: message, error: msgErr } = await db
            .from("support_messages")
            .insert({
                ticket_id: id,
                sender_id: userId,
                sender_type: "restaurant",
                content: content.trim(),
                is_read: false,
            })
            .select("id, ticket_id, sender_id, sender_type, content, is_read, created_at")
            .single();

        if (msgErr || !message) {
            console.error("[POST /api/dashboard/support/[id]/messages]", msgErr);
            return apiError("Erreur lors de l'envoi du message");
        }

        // Update ticket
        const now = new Date().toISOString();
        const reopen = ticket.status === "resolved";

        await db
            .from("support_tickets")
            .update({
                last_replied_at: now,
                unread_reporter: 0,
                unread_admin: (ticket.unread_admin ?? 0) + 1,
                ...(reopen ? { status: "open" } : {}),
            })
            .eq("id", id);

        // 🔔 Push notification → tous les admins (fire-and-forget)
        const preview = content.trim().length > 80
            ? content.trim().slice(0, 80) + "…"
            : content.trim();

        sendPushToAdmins(db, {
            title: `🎫 ${restaurantName} — Nouveau message`,
            body: preview,
            link: `/admin/support/${id}`,
            data: {
                type: "support_message",
                ticket_id: id,
                subject: ticket.subject ?? "",
                restaurant_name: restaurantName,
                link: `/admin/support/${id}`,
            },
        }).catch(() => {});

        // In-app admin notification (keep as fallback)
        await db.from("admin_notifications").insert({
            type: "support_message",
            title: `💬 ${restaurantName} — Nouveau message`,
            body: preview,
            payload: {
                ticket_id: id,
                restaurant_id: restaurantId,
                link: `/admin/support/${id}`,
            },
            is_read: false,
        }).then(() => {}).catch(() => {});

        return NextResponse.json({ message }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/dashboard/support/[id]/messages] unexpected:", err);
        return apiError("Erreur serveur");
    }
}
