/**
 * GET  /api/admin/support   — liste tous les tickets (filtrés, paginés)
 * PATCH /api/admin/support  — met à jour un ticket (status, priority, assigned_to)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const reporter_type = searchParams.get("reporter_type");
    const search = searchParams.get("search");

    let query = db
        .from("support_tickets")
        .select(
            "id, subject, description, status, priority, reporter_id, reporter_type, restaurant_id, order_id, created_at, resolved_at, last_replied_at, unread_admin, unread_reporter, assigned_to",
            { count: "exact" }
        );

    if (status && status !== "all") query = query.eq("status", status);
    if (priority && priority !== "all") query = query.eq("priority", priority);
    if (reporter_type && reporter_type !== "all") query = query.eq("reporter_type", reporter_type);
    if (search) query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`);

    query = query
        .order("last_replied_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error("[GET /api/admin/support]", error);
        return apiError("Erreur de chargement des tickets");
    }

    const tickets = data ?? [];

    // Batch fetch reporter names
    const reporterIds = [...new Set(tickets.map((t: any) => t.reporter_id).filter(Boolean))];
    const reporterMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (reporterIds.length > 0) {
        const { data: users } = await db
            .from("users")
            .select("id, full_name, email")
            .in("id", reporterIds);
        (users ?? []).forEach((u: any) => {
            reporterMap[u.id] = { full_name: u.full_name, email: u.email };
        });
    }

    // Batch fetch restaurant names
    const restaurantIds = [...new Set(tickets.map((t: any) => t.restaurant_id).filter(Boolean))];
    const restaurantMap: Record<string, string> = {};
    if (restaurantIds.length > 0) {
        const { data: restaurants } = await db
            .from("restaurants")
            .select("id, name")
            .in("id", restaurantIds);
        (restaurants ?? []).forEach((r: any) => {
            restaurantMap[r.id] = r.name;
        });
    }

    const result = tickets.map((t: any) => ({
        id: t.id,
        reporterId: t.reporter_id,
        reporterType: t.reporter_type,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assigned_to,
        restaurantId: t.restaurant_id,
        orderId: t.order_id,
        createdAt: t.created_at,
        resolvedAt: t.resolved_at,
        lastRepliedAt: t.last_replied_at,
        unreadAdmin: t.unread_admin ?? 0,
        reporterName: reporterMap[t.reporter_id]?.full_name ?? null,
        reporterEmail: reporterMap[t.reporter_id]?.email ?? null,
        assigneeName: null, // kept for compatibility
        restaurantName: restaurantMap[t.restaurant_id] ?? null,
    }));

    const total = count ?? 0;
    return NextResponse.json({
        data: result,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

export async function PATCH(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    try {
        const body = await request.json();
        const { id, status, priority, assigned_to } = body;

        if (!id) return apiError("ID du ticket requis", 400);

        const updates: Record<string, any> = {};
        if (status !== undefined) {
            const validStatuses = ["open", "in_progress", "resolved", "closed"];
            if (!validStatuses.includes(status)) return apiError("Statut invalide", 400);
            updates.status = status;
            if (status === "resolved") updates.resolved_at = new Date().toISOString();
            if (status === "open" || status === "in_progress") updates.resolved_at = null;
        }
        if (priority !== undefined) {
            const validPriorities = ["low", "medium", "high", "urgent"];
            if (!validPriorities.includes(priority)) return apiError("Priorité invalide", 400);
            updates.priority = priority;
        }
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;

        if (Object.keys(updates).length === 0) return apiError("Aucune modification", 400);

        const { data, error } = await db
            .from("support_tickets")
            .update(updates)
            .eq("id", id)
            .select("id, status, priority, assigned_to, resolved_at")
            .single();

        if (error || !data) {
            console.error("[PATCH /api/admin/support]", error);
            return apiError("Erreur lors de la mise à jour");
        }

        return NextResponse.json({ ticket: data });
    } catch (err) {
        console.error("[PATCH /api/admin/support] unexpected:", err);
        return apiError("Erreur serveur");
    }
}
