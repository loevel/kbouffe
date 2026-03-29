/**
 * GET  /api/admin/support/[id]/messages  — liste les messages d'un ticket
 * POST /api/admin/support/[id]/messages  — envoie une réponse admin
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";
import { sendPushToRestaurant } from "@/lib/firebase/send-push";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { id } = await params;

    const { data, error } = await db
        .from("support_messages")
        .select("id, ticket_id, sender_id, sender_type, content, is_read, created_at")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[GET /api/admin/support/[id]/messages]", error);
        return apiError("Erreur de chargement des messages");
    }

    // Enrich messages with sender names (batch lookup)
    const senderIds = [...new Set((data ?? []).map((m: any) => m.sender_id).filter(Boolean))];
    const senderMap: Record<string, { full_name: string | null; avatar_url: string | null; email: string | null }> = {};
    if (senderIds.length > 0) {
        const { data: users } = await db
            .from("users")
            .select("id, full_name, avatar_url, email")
            .in("id", senderIds);
        (users ?? []).forEach((u: any) => {
            senderMap[u.id] = { full_name: u.full_name, avatar_url: u.avatar_url, email: u.email };
        });
    }

    // Mark restaurant messages as read (admin is viewing)
    await db
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", id)
        .eq("sender_type", "restaurant");

    // Reset unread_admin counter
    await db
        .from("support_tickets")
        .update({ unread_admin: 0 })
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
            senderEmail: sender?.email ?? null,
            senderAvatar: sender?.avatar_url ?? null,
        };
    });

    return NextResponse.json({ messages });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase, userId } = auth.ctx;
    const db = supabase as any;

    const { id } = await params;

    try {
        const { content } = await request.json();
        if (!content?.trim()) return apiError("Message vide", 400);

        // Verify ticket exists + get restaurant_id for push
        const { data: ticket, error: ticketErr } = await db
            .from("support_tickets")
            .select("id, subject, status, unread_reporter, restaurant_id")
            .eq("id", id)
            .single();

        if (ticketErr || !ticket) return apiError("Ticket introuvable", 404);

        // Insert message
        const { data: message, error: msgErr } = await db
            .from("support_messages")
            .insert({
                ticket_id: id,
                sender_id: userId,
                sender_type: "admin",
                content: content.trim(),
                is_read: false,
            })
            .select("id, ticket_id, sender_id, sender_type, content, is_read, created_at")
            .single();

        if (msgErr || !message) {
            console.error("[POST /api/admin/support/[id]/messages]", msgErr);
            return apiError("Erreur lors de l'envoi du message");
        }

        // Update ticket: last_replied_at, unread_reporter++, status → in_progress
        const now = new Date().toISOString();
        const ticketUpdates: Record<string, any> = {
            last_replied_at: now,
            unread_admin: 0,
            unread_reporter: (ticket.unread_reporter ?? 0) + 1,
        };
        if (ticket.status === "open") ticketUpdates.status = "in_progress";

        await db
            .from("support_tickets")
            .update(ticketUpdates)
            .eq("id", id);

        // 🔔 Push notification → restaurant (fire-and-forget)
        if (ticket.restaurant_id) {
            const preview = content.trim().length > 80
                ? content.trim().slice(0, 80) + "…"
                : content.trim();

            sendPushToRestaurant(db, ticket.restaurant_id, {
                title: "💬 Réponse de kBouffe Support",
                body: preview,
                link: `/dashboard/support/${id}`,
                data: {
                    type: "support_reply",
                    ticket_id: id,
                    subject: ticket.subject ?? "",
                    link: `/dashboard/support/${id}`,
                },
            }).catch(() => {});
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/admin/support/[id]/messages] unexpected:", err);
        return apiError("Erreur serveur");
    }
}
