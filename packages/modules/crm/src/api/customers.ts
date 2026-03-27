/**
 * Customers route
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

interface CustomerAggregate {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
    createdAt: string;
}

interface OrderRow {
    customer_id: string | null;
    customer_name: string;
    customer_phone: string;
    total: number;
    created_at: string;
}

export const customersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /customers */
customersRoutes.get("/", async (c) => {
    const search = c.req.query("search")?.trim() ?? "";
    const segment = c.req.query("segment") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    let query = c.var.supabase
        .from("restaurant_customers")
        .select(`
            *,
            customer:users(id, full_name, email, phone, avatar_url)
        `, { count: "exact" })
        .eq("restaurant_id", c.var.restaurantId);

    if (segment !== "all") {
        query = query.eq("segment", segment);
    }

    if (search) {
        // Since customer is joined, search is a bit more complex in simple Supabase query
        // For MVP, we'll search by phone/name if possible or fetch all and filter
    }

    const { data, count, error } = await query
        .order("total_spent", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const customers = (data ?? []).map((rc: any) => ({
        id: rc.customer_id,
        name: rc.customer?.full_name || "Client",
        phone: rc.customer?.phone || "",
        email: rc.customer?.email,
        avatarUrl: rc.customer?.avatar_url,
        totalOrders: rc.orders_count,
        totalSpent: rc.total_spent,
        lastOrderAt: rc.last_order_at,
        segment: rc.segment,
        internalNotes: rc.internal_notes,
        createdAt: rc.created_at,
    }));

    return c.json({
        customers,
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
        }
    });
});

/** GET /customers/:id — Fiche client complète */
customersRoutes.get("/:id", async (c) => {
    const customerId = c.req.param("id");
    const restaurantId = c.var.restaurantId;

    const [
        { data: rc, error: rcError },
        { data: orders, error: ordersError },
        { data: favProducts, error: favError }
    ] = await Promise.all([
        c.var.supabase
            .from("restaurant_customers")
            .select(`
                *,
                customer:users(*)
            `)
            .eq("restaurant_id", restaurantId)
            .eq("customer_id", customerId)
            .single(),
        
        c.var.supabase
            .from("orders")
            .select("id, total, status, created_at, items")
            .eq("restaurant_id", restaurantId)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
            .limit(20),

        // Calculate favorite products via order items aggregation (Simplified for MVP)
        c.var.supabase
            .from("orders")
            .select("items")
            .eq("restaurant_id", restaurantId)
            .eq("customer_id", customerId)
            .eq("payment_status", "paid")
    ]);

    if (rcError || !rc) return c.json({ error: "Client introuvable" }, 404);

    // Dynamic favorite products logic
    const productCounts: Record<string, { name: string, count: number }> = {};
    (favProducts || []).forEach((o: any) => {
        const items = o.items || [];
        items.forEach((item: any) => {
            if (!productCounts[item.productId]) {
                productCounts[item.productId] = { name: item.productName || item.name || "Produit", count: 0 };
            }
            productCounts[item.productId].count += item.quantity;
        });
    });

    const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    return c.json({
        id: rc.customer_id,
        profile: {
            name: rc.customer?.full_name,
            email: rc.customer?.email,
            phone: rc.customer?.phone,
            avatarUrl: rc.customer?.avatar_url,
            joinedAt: rc.created_at,
        },
        stats: {
            totalSpent: rc.total_spent,
            ordersCount: rc.orders_count,
            lastOrderAt: rc.last_order_at,
            avgOrderValue: rc.orders_count > 0 ? Math.round(rc.total_spent / rc.orders_count) : 0,
            topProducts
        },
        segment: rc.segment,
        internalNotes: rc.internal_notes,
        tags: rc.tags,
        orders: orders || []
    });
});

/** PATCH /customers/:id — Mettre à jour segment ou notes */
customersRoutes.patch("/:id", async (c) => {
    const customerId = c.req.param("id");
    const restaurantId = c.var.restaurantId;
    const body = await c.req.json();

    const { data, error } = await c.var.supabase
        .from("restaurant_customers")
        .update({
            segment: body.segment,
            internal_notes: body.internalNotes,
            tags: body.tags,
            updated_at: new Date().toISOString()
        })
        .eq("restaurant_id", restaurantId)
        .eq("customer_id", customerId)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, data });
});
