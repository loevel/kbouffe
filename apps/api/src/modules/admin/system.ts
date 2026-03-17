import { Hono } from "hono";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminSystemRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminSystemRoutes.get("/audit", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const actionFilter = c.req.query("action") ?? "all";
    const targetFilter = c.req.query("target") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    let query = c.var.supabase
        .from("admin_audit_log")
        .select(`
            id, admin_id, action, target_type, target_id, details, ip_address, created_at,
            users(email, full_name)
        `, { count: "exact" });

    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (targetFilter !== "all") query = query.eq("target_type", targetFilter);

    const { data: rawData, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) {
        console.error("Audit query error:", error);
        return c.json({ error: "Erreur lors de la récupération de l'audit" }, 500);
    }

    const data = rawData?.map(item => {
        const user = Array.isArray(item.users) ? item.users[0] : item.users;
        return {
            ...item,
            userEmail: user?.email,
            userName: user?.full_name,
        };
    });

    return c.json({
        data,
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / limit)
        }
    });
});

adminSystemRoutes.get("/settings", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const { data, error } = await c.var.supabase.from("platform_settings").select("*");
    if (error) {
        console.error("Settings fetch error:", error);
        return c.json({ error: "Erreur lors de la récupération des réglages" }, 500);
    }
    return c.json(data);
});

adminSystemRoutes.patch("/settings", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const body = await c.req.json();
    if (!body.key || body.value === undefined) {
        return c.json({ error: "key et value requis" }, 400);
    }

    const { data: updated, error } = await c.var.supabase
        .from("platform_settings")
        .upsert({
            key: body.key,
            value: body.value,
            updated_by: c.var.userId,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error("Settings update error:", error);
        return c.json({ error: "Erreur lors de la mise à jour du réglage" }, 500);
    }

    await logAdminAction(c, {
        action: "update_setting",
        targetType: "platform_setting",
        targetId: body.key,
        details: { value: body.value }
    });

    return c.json(updated);
});
