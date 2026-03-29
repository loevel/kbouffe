/**
 * GET  /api/dashboard/support   — liste les tickets du restaurant connecté
 * POST /api/dashboard/support   — crée un nouveau ticket
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { restaurantId } = auth.ctx;

    // Service role client — bypass RLS on support_tickets
    const adminSupa = await createAdminClient();
    const db = adminSupa as any;

    const { data, error } = await db
        .from("support_tickets")
        .select(`
            id, subject, description, status, priority,
            created_at, resolved_at, last_replied_at,
            unread_admin, unread_reporter
        `)
        .eq("restaurant_id", restaurantId)
        .eq("reporter_type", "restaurant")
        .order("last_replied_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[GET /api/dashboard/support]", error);
        return apiError("Erreur de chargement des tickets");
    }

    return NextResponse.json({ tickets: data ?? [] });
}

export async function POST(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { restaurantId, userId } = auth.ctx;

    // Service role client — bypass RLS on support_tickets + support_messages
    const adminSupa = await createAdminClient();
    const db = adminSupa as any;

    try {
        const { subject, description, priority = "medium", category = "general" } = await request.json();

        if (!subject?.trim() || !description?.trim()) {
            return apiError("Sujet et description requis", 400);
        }

        const validPriorities = ["low", "medium", "high", "urgent"];
        if (!validPriorities.includes(priority)) {
            return apiError("Priorité invalide", 400);
        }

        // Create ticket
        const { data: ticket, error: ticketErr } = await db
            .from("support_tickets")
            .insert({
                reporter_id: userId,
                reporter_type: "restaurant",
                restaurant_id: restaurantId,
                subject: subject.trim(),
                description: description.trim(),
                priority,
                status: "open",
                last_replied_at: new Date().toISOString(),
                unread_admin: 1,
                unread_reporter: 0,
            })
            .select("id, subject, status, priority, created_at")
            .single();

        if (ticketErr || !ticket) {
            console.error("[POST /api/dashboard/support] ticket:", ticketErr);
            return apiError("Erreur lors de la création du ticket");
        }

        // Create first message from the description
        await db.from("support_messages").insert({
            ticket_id: ticket.id,
            sender_id: userId,
            sender_type: "restaurant",
            content: description.trim(),
            is_read: false,
        });

        // Notify admin via admin_notifications
        await db.from("admin_notifications").insert({
            type: "support_ticket",
            title: `🎫 Nouveau ticket — ${subject.trim()}`,
            body: description.trim().slice(0, 120),
            payload: {
                ticket_id: ticket.id,
                restaurant_id: restaurantId,
                priority,
                link: `/admin/support/${ticket.id}`,
            },
            is_read: false,
        });

        return NextResponse.json({ ticket }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/dashboard/support] unexpected:", err);
        return apiError("Erreur serveur");
    }
}
