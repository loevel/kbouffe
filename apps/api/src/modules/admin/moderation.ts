import { Hono } from "hono";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

export const adminModerationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminModerationRoutes.get("/reviews", async (c) => {
    const denied = requireDomain(c, "moderation");
    if (denied) return denied;

    const ratingFilter = c.req.query("rating");
    const visibleFilter = c.req.query("visible");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    let query = c.var.supabase
        .from("reviews")
        .select(`
            id, rating, comment, response, is_visible, created_at,
            user_id, restaurant_id,
            users(full_name, email),
            restaurants(name)
        `, { count: "exact" });

    if (ratingFilter && ratingFilter !== "all") {
        const r = parseInt(ratingFilter);
        if (!isNaN(r)) query = query.eq("rating", r);
    }
    if (visibleFilter === "true") query = query.eq("is_visible", true);
    if (visibleFilter === "false") query = query.eq("is_visible", false);

    const { data: rawData, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) {
        console.error("Moderation query error:", error);
        return c.json({ error: "Erreur lors de la récupération des avis" }, 500);
    }

    const data = rawData?.map(item => {
        const user = Array.isArray(item.users) ? item.users[0] : item.users;
        const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
        return {
            ...item,
            isVisible: item.is_visible,
            createdAt: item.created_at,
            userName: user?.full_name,
            userEmail: user?.email,
            restaurantName: restaurant?.name,
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

adminModerationRoutes.patch("/reviews", async (c) => {
    const denied = requireDomain(c, "moderation");
    if (denied) return denied;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    if (!body.id || typeof body.isVisible !== "boolean") {
        return c.json({ error: "id et isVisible (boolean) requis" }, 400);
    }

    const { error } = await c.var.supabase
        .from("reviews")
        .update({
            is_visible: body.isVisible,
            updated_at: new Date().toISOString()
        })
        .eq("id", body.id);

    if (error) {
        console.error("Update review error:", error);
        return c.json({ error: "Erreur lors de la mise à jour de l'avis" }, 500);
    }

    await logAdminAction(c, {
        action: body.isVisible ? "show_review" : "hide_review",
        targetType: "review",
        targetId: body.id
    });

    return c.json({ success: true, id: body.id, isVisible: body.isVisible });
});
