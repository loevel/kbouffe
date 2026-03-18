import { Hono } from "hono";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminMarketingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminMarketingRoutes.get("/campaigns", async (c) => {
    const denied = requireDomain(c, "marketing");
    if (denied) return denied;

    const statusFilter = c.req.query("status") ?? "all";
    const packageFilter = c.req.query("package") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    let query = c.var.supabase
        .from("ad_campaigns")
        .select(`
            id, restaurant_id, package, status, starts_at, ends_at, budget,
            impressions, clicks, created_at, updated_at,
            restaurants!inner(name, slug)
        `, { count: "exact" });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (packageFilter !== "all") query = query.eq("package", packageFilter);

    const { data: rawData, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) {
        console.error("Marketing query error:", error);
        return c.json({ error: "Erreur lors de la récupération des campagnes" }, 500);
    }

    const data = rawData?.map(item => {
        const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
        return {
            ...item,
            startsAt: item.starts_at,
            endsAt: item.ends_at,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            restaurantName: restaurant?.name,
            restaurantSlug: restaurant?.slug,
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

    // Allow updating campaign status from admin UI
    adminMarketingRoutes.patch("/campaigns", async (c) => {
        const denied = requireDomain(c, "marketing");
        if (denied) return denied;

        const body = await c.req.json().catch(() => ({}));
        const { id, status } = body as { id?: string; status?: string };

        if (!id || !status) {
            return c.json({ error: "Paramètres invalides" }, 400);
        }

        try {
            const { data: updated, error } = await c.var.supabase
                .from("ad_campaigns")
                .update({ status, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select()
                .single();

            if (error) {
                console.error("Failed to update campaign status:", error);
                return c.json({ error: "Impossible de mettre à jour la campagne" }, 500);
            }

            await logAdminAction(c, {
                action: "update_campaign_status",
                targetType: "campaign",
                targetId: id,
                details: { status }
            });

            return c.json({ success: true, status: updated.status });
        } catch (err) {
            console.error("Unexpected error updating campaign status:", err);
            return c.json({ error: "Erreur serveur" }, 500);
        }
    });
