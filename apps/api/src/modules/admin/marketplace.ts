import { Hono } from "hono";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

export const adminMarketplaceRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Stats ────────────────────────────────────────────────────────────
adminMarketplaceRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "marketplace:read");
    if (denied) return denied;

    const supabase = c.var.supabase;

    const [
        { count: totalServices },
        { count: activeServices },
        { count: totalPurchases },
        { data: revenueData },
        { count: activePurchases },
    ] = await Promise.all([
        supabase.from("marketplace_services").select("*", { count: "exact", head: true }),
        supabase.from("marketplace_services").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("marketplace_purchases").select("*", { count: "exact", head: true }),
        supabase.from("marketplace_purchases").select("amount_paid"),
        supabase.from("marketplace_purchases").select("*", { count: "exact", head: true }).eq("status", "active"),
    ]);

    const totalRevenue = (revenueData || []).reduce((acc: number, r: any) => acc + (r.amount_paid || 0), 0);

    return c.json({
        totalServices: totalServices || 0,
        activeServices: activeServices || 0,
        totalPurchases: totalPurchases || 0,
        activePurchases: activePurchases || 0,
        totalRevenue,
    });
});

// ── Services CRUD ────────────────────────────────────────────────────

// List all services
adminMarketplaceRoutes.get("/services", async (c) => {
    const denied = requireDomain(c, "marketplace:read");
    if (denied) return denied;

    const supabase = c.var.supabase;
    const category = c.req.query("category");

    let query = supabase
        .from("marketplace_services")
        .select("*")
        .order("sort_order", { ascending: true });

    if (category && category !== "all") {
        query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) return c.json({ error: error.message }, 500);

    // Attach purchase count per service
    const serviceIds = (data || []).map((s: any) => s.id);
    const { data: purchaseCounts } = await supabase
        .from("marketplace_purchases")
        .select("service_id")
        .in("service_id", serviceIds);

    const countMap: Record<string, number> = {};
    (purchaseCounts || []).forEach((p: any) => {
        countMap[p.service_id] = (countMap[p.service_id] || 0) + 1;
    });

    const services = (data || []).map((s: any) => ({
        ...s,
        purchaseCount: countMap[s.id] || 0,
    }));

    return c.json({ data: services });
});

// Create a service
adminMarketplaceRoutes.post("/services", async (c) => {
    const denied = requireDomain(c, "marketplace:write");
    if (denied) return denied;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    if (!body.name || !body.slug) return c.json({ error: "name et slug requis" }, 400);

    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("marketplace_services")
        .insert({
            name: body.name,
            slug: body.slug,
            description: body.description || null,
            category: body.category || "visibility",
            price: body.price || 0,
            duration_days: body.durationDays || null,
            features: body.features || [],
            icon: body.icon || "Package",
            is_active: body.isActive ?? true,
            sort_order: body.sortOrder || 0,
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { action: "create_marketplace_service", targetType: "marketplace_service", targetId: data.id, details: { name: body.name } });

    return c.json(data, 201);
});

// Update a service
adminMarketplaceRoutes.patch("/services/:id", async (c) => {
    const denied = requireDomain(c, "marketplace:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const supabase = c.var.supabase;

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.price !== undefined) updates.price = body.price;
    if (body.durationDays !== undefined) updates.duration_days = body.durationDays;
    if (body.features !== undefined) updates.features = body.features;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

    if (Object.keys(updates).length === 0) return c.json({ error: "Aucun champ à modifier" }, 400);

    const { data, error } = await supabase
        .from("marketplace_services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { action: "update_marketplace_service", targetType: "marketplace_service", targetId: id, details: updates });

    return c.json(data);
});

// Delete a service
adminMarketplaceRoutes.delete("/services/:id", async (c) => {
    const denied = requireDomain(c, "marketplace:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

    // Check if there are active purchases
    const { count } = await supabase
        .from("marketplace_purchases")
        .select("*", { count: "exact", head: true })
        .eq("service_id", id)
        .eq("status", "active");

    if (count && count > 0) {
        return c.json({ error: `Impossible de supprimer : ${count} achat(s) actif(s) liés à ce service.` }, 409);
    }

    const { error } = await supabase
        .from("marketplace_services")
        .delete()
        .eq("id", id);

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { action: "delete_marketplace_service", targetType: "marketplace_service", targetId: id });

    return c.json({ success: true });
});

// ── Purchases ────────────────────────────────────────────────────────

// List purchases
adminMarketplaceRoutes.get("/purchases", async (c) => {
    const denied = requireDomain(c, "marketplace:read");
    if (denied) return denied;

    const supabase = c.var.supabase;
    const status = c.req.query("status");
    const restaurantId = c.req.query("restaurantId");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    let query = supabase
        .from("marketplace_purchases")
        .select("*, service:marketplace_services(name, slug, category, icon), restaurant:restaurants(name, slug), admin:users!marketplace_purchases_admin_id_fkey(full_name)", { count: "exact" });

    if (status && status !== "all") query = query.eq("status", status);
    if (restaurantId) query = query.eq("restaurant_id", restaurantId);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count: total, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Marketplace purchases error:", error);
        return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    return c.json({
        data: data || [],
        pagination: {
            page,
            limit,
            total: total ?? 0,
            totalPages: Math.ceil((total ?? 0) / limit),
        },
    });
});

// Create a purchase (assign service to restaurant)
adminMarketplaceRoutes.post("/purchases", async (c) => {
    const denied = requireDomain(c, "marketplace:write");
    if (denied) return denied;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    if (!body.restaurantId || !body.serviceId) {
        return c.json({ error: "restaurantId et serviceId requis" }, 400);
    }

    const supabase = c.var.supabase;

    // Get service details for automatic expiration
    const { data: service } = await supabase
        .from("marketplace_services")
        .select("price, duration_days")
        .eq("id", body.serviceId)
        .single();

    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    let expiresAt: Date | null = null;
    if (service?.duration_days) {
        expiresAt = new Date(startsAt);
        expiresAt.setDate(expiresAt.getDate() + service.duration_days);
    }

    const { data, error } = await supabase
        .from("marketplace_purchases")
        .insert({
            restaurant_id: body.restaurantId,
            service_id: body.serviceId,
            admin_id: c.get("userId"),
            status: "active",
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt?.toISOString() || null,
            amount_paid: body.amountPaid ?? service?.price ?? 0,
            notes: body.notes || null,
        })
        .select("*, service:marketplace_services(name, slug, category, icon), restaurant:restaurants(name, slug)")
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "create_marketplace_purchase",
        targetType: "marketplace_purchase",
        targetId: data.id,
        details: { restaurantId: body.restaurantId, serviceId: body.serviceId },
    });

    return c.json(data, 201);
});

// Update purchase status
adminMarketplaceRoutes.patch("/purchases/:id", async (c) => {
    const denied = requireDomain(c, "marketplace:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const supabase = c.var.supabase;

    const updates: Record<string, any> = {};
    if (body.status !== undefined) {
        if (!["active", "expired", "cancelled"].includes(body.status)) {
            return c.json({ error: "Statut invalide" }, 400);
        }
        updates.status = body.status;
    }
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;

    if (Object.keys(updates).length === 0) return c.json({ error: "Aucun champ à modifier" }, 400);

    const { data, error } = await supabase
        .from("marketplace_purchases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { action: "update_marketplace_purchase", targetType: "marketplace_purchase", targetId: id, details: updates });

    return c.json(data);
});
