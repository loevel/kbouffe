/**
 * GET /api/admin/support/[id]  — détail complet d'un ticket
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

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
        .from("support_tickets")
        .select(`
            id, subject, description, status, priority,
            reporter_id, reporter_type, restaurant_id, order_id,
            created_at, resolved_at, last_replied_at,
            unread_admin, unread_reporter, assigned_to
        `)
        .eq("id", id)
        .single();

    if (error || !data) {
        console.error("[GET /api/admin/support/[id]]", error);
        return apiError("Ticket introuvable", 404);
    }

    // Fetch reporter info separately to avoid FK join issues
    let reporterName = null;
    let reporterEmail = null;
    let reporterPhone = null;
    if (data.reporter_id) {
        const { data: reporter } = await db
            .from("users")
            .select("full_name, email, phone")
            .eq("id", data.reporter_id)
            .maybeSingle();
        reporterName = reporter?.full_name ?? null;
        reporterEmail = reporter?.email ?? null;
        reporterPhone = reporter?.phone ?? null;
    }

    // Fetch restaurant name separately
    let restaurantName = null;
    if (data.restaurant_id) {
        const { data: restaurant } = await db
            .from("restaurants")
            .select("name")
            .eq("id", data.restaurant_id)
            .maybeSingle();
        restaurantName = restaurant?.name ?? null;
    }

    // Fetch assignee info separately
    let assigneeName = null;
    let assigneeEmail = null;
    if (data.assigned_to) {
        const { data: assignee } = await db
            .from("users")
            .select("full_name, email")
            .eq("id", data.assigned_to)
            .maybeSingle();
        assigneeName = assignee?.full_name ?? null;
        assigneeEmail = assignee?.email ?? null;
    }

    // Mark as read by admin
    await db
        .from("support_tickets")
        .update({ unread_admin: 0 })
        .eq("id", id);

    return NextResponse.json({
        id: data.id,
        reporterId: data.reporter_id,
        reporterType: data.reporter_type,
        subject: data.subject,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assigned_to,
        restaurantId: data.restaurant_id,
        restaurantName,
        orderId: data.order_id,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at,
        lastRepliedAt: data.last_replied_at,
        unreadAdmin: data.unread_admin ?? 0,
        unreadReporter: data.unread_reporter ?? 0,
        reporterName,
        reporterEmail,
        reporterPhone,
        assigneeName,
        assigneeEmail,
    });
}
