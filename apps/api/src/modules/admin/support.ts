import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminSupportRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

function maskEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    if (localPart.length <= 2) return `${localPart[0] ?? "*"}***@${domain}`;
    return `${localPart.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return phone;
    if (digits.length <= 4) return "••••";
    return `${digits.slice(0, 3)}•••${digits.slice(-2)}`;
}

adminSupportRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "support");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const statusFilter = c.req.query("status") ?? "all";
    const priorityFilter = c.req.query("priority") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    let query = supabase
        .from("support_tickets")
        .select(`
            *,
            reporter:users!reporter_id(full_name, email),
            assignee:users!assigned_to(full_name)
        `, { count: "exact" });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, count: total, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Supabase Support API Error:", error);
        return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const formattedData = (data || []).map((t: any) => ({
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
        reporterName: t.reporter?.full_name,
        reporterEmail: maskEmail(t.reporter?.email),
        assigneeName: t.assignee?.full_name
    }));

    return c.json({ 
        data: formattedData, 
        pagination: { 
            page, 
            limit, 
            total: total ?? 0, 
            totalPages: Math.ceil((total ?? 0) / limit) 
        } 
    });
});

adminSupportRoutes.patch("/", async (c) => {
    const denied = requireDomain(c, "support");
    if (denied) return denied;
    
    const body = await c.req.json();
    if (!body.id) return c.json({ error: "id requis" }, 400);

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const updates: Record<string, any> = {};

    if (body.status) {
        if (!["open", "in_progress", "resolved", "closed"].includes(body.status)) return c.json({ error: "Statut invalide" }, 400);
        updates.status = body.status;
        if (body.status === "resolved" || body.status === "closed") updates.resolved_at = new Date().toISOString();
    }
    if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo;
    if (body.priority) updates.priority = body.priority;

    if (Object.keys(updates).length === 0) return c.json({ error: "Aucun champ à modifier" }, 400);

    const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", body.id);

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { action: "update_ticket", targetType: "support_ticket", targetId: body.id, details: updates });

    return c.json({ success: true });
});

adminSupportRoutes.get("/:id", async (c) => {
    const denied = requireDomain(c, "support");
    if (denied) return denied;
    
    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data: t, error } = await supabase
        .from("support_tickets")
        .select(`
            *,
            reporter:users!reporter_id(full_name, email, phone),
            assignee:users!assigned_to(full_name, email)
        `)
        .eq("id", id)
        .maybeSingle();

    if (error || !t) return c.json({ error: "Ticket introuvable" }, 404);

    return c.json({
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
        reporterName: t.reporter?.full_name,
        reporterEmail: maskEmail(t.reporter?.email),
        reporterPhone: maskPhone(t.reporter?.phone),
        assigneeName: t.assignee?.full_name,
        assigneeEmail: maskEmail(t.assignee?.email)
    });
});
