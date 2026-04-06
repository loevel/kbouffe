/**
 * GET  /api/account/support/tickets/[id]/messages
 *   → Liste les messages d'un ticket (vue client mobile).
 *     Le premier message synthétisé reprend la description du ticket.
 *
 * POST /api/account/support/tickets/[id]/messages
 *   → Envoie un message client sur un ticket existant.
 *
 * Auth : cookie Supabase du client (bearer token injecté par le SDK mobile).
 * Sécurité : on vérifie reporter_id === user.id avant toute opération.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { id } = await params;

        // Service-role client to bypass RLS on support tables
        const admin = await createAdminClient();
        const db = admin as any;

        // Verify ticket belongs to this customer
        const { data: ticket, error: ticketErr } = await db
            .from("support_tickets")
            .select("id, subject, description, status, priority, reporter_id, created_at")
            .eq("id", id)
            .eq("reporter_id", user.id)
            .single();

        if (ticketErr || !ticket) {
            return NextResponse.json(
                { error: "Ticket introuvable ou accès refusé" },
                { status: 404 }
            );
        }

        // Fetch all messages for this ticket ordered chronologically
        const { data: msgs, error: msgsErr } = await db
            .from("support_messages")
            .select("id, ticket_id, sender_id, sender_type, content, is_read, created_at")
            .eq("ticket_id", id)
            .order("created_at", { ascending: true });

        if (msgsErr) {
            console.error("[GET /api/account/support/tickets/[id]/messages]", msgsErr);
            return NextResponse.json(
                { error: "Erreur de chargement des messages" },
                { status: 500 }
            );
        }

        // Batch-resolve sender display names
        const senderIds = [
            ...new Set(
                (msgs ?? []).map((m: any) => m.sender_id).filter(Boolean) as string[]
            ),
        ];
        const senderMap: Record<string, { full_name: string | null; avatar_url: string | null }> =
            {};
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

        // Synthesise the first "message" from the ticket description so the
        // thread always opens with the customer's original request.
        const initialMessage = {
            id: `init-${ticket.id}`,
            ticketId: ticket.id,
            senderId: user.id,
            senderType: "customer",
            content: ticket.description as string,
            isRead: true,
            createdAt: ticket.created_at as string,
            senderName: null,
            senderAvatar: null,
        };

        const messages = [
            initialMessage,
            ...(msgs ?? []).map((m: any) => {
                const sender = senderMap[m.sender_id] ?? null;
                return {
                    id: m.id as string,
                    ticketId: m.ticket_id as string,
                    senderId: m.sender_id as string,
                    senderType: m.sender_type as string,
                    content: m.content as string,
                    isRead: m.is_read as boolean,
                    createdAt: m.created_at as string,
                    senderName: sender?.full_name ?? null,
                    senderAvatar: sender?.avatar_url ?? null,
                };
            }),
        ];

        return NextResponse.json({ messages, ticket });
    } catch (err) {
        console.error(
            "[GET /api/account/support/tickets/[id]/messages] unexpected:",
            err
        );
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { id } = await params;
        const admin = await createAdminClient();
        const db = admin as any;

        const body = await request.json();
        const content: string = body?.content ?? "";
        if (!content.trim()) {
            return NextResponse.json({ error: "Message vide" }, { status: 400 });
        }

        // Verify ticket ownership + guard against writing to closed tickets
        const { data: ticket, error: ticketErr } = await db
            .from("support_tickets")
            .select("id, status, unread_admin")
            .eq("id", id)
            .eq("reporter_id", user.id)
            .single();

        if (ticketErr || !ticket) {
            return NextResponse.json(
                { error: "Ticket introuvable ou accès refusé" },
                { status: 404 }
            );
        }

        if (ticket.status === "closed") {
            return NextResponse.json(
                { error: "Ce ticket est clôturé. Veuillez créer un nouveau ticket." },
                { status: 400 }
            );
        }

        // Insert the customer's message
        const { data: message, error: msgErr } = await db
            .from("support_messages")
            .insert({
                ticket_id: id,
                sender_id: user.id,
                sender_type: "customer",
                content: content.trim(),
                is_read: false,
            })
            .select("id, ticket_id, sender_id, sender_type, content, is_read, created_at")
            .single();

        if (msgErr || !message) {
            console.error(
                "[POST /api/account/support/tickets/[id]/messages]",
                msgErr
            );
            return NextResponse.json(
                { error: "Erreur lors de l'envoi du message" },
                { status: 500 }
            );
        }

        // Update ticket metadata: bump unread_admin, reset unread_reporter,
        // update last_replied_at.  If the ticket was resolved the customer's
        // reply reopens it to "open".
        const ticketUpdates: Record<string, unknown> = {
            last_replied_at: new Date().toISOString(),
            unread_admin: (ticket.unread_admin ?? 0) + 1,
            unread_reporter: 0,
        };
        if (ticket.status === "resolved") {
            ticketUpdates.status = "open";
        }

        await db.from("support_tickets").update(ticketUpdates).eq("id", id);

        return NextResponse.json({ success: true, message }, { status: 201 });
    } catch (err) {
        console.error(
            "[POST /api/account/support/tickets/[id]/messages] unexpected:",
            err
        );
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
