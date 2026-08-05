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
    // Cap raised to 500 — the table/stats UI fetches up to 200 rows in one page
    // (no server pagination in the UI yet), so a lower cap here silently truncated
    // the customer list and under-reported the "Total clients" stat.
    const limit = Math.min(500, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
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
        // Sanitize: strip PostgREST special chars to prevent query injection,
        // same convention as orders.ts.
        const safe = search.replace(/[%_(),.*!~]/g, "").slice(0, 100).trim();
        if (safe) {
            // `customer` is a joined table (users), so it can't be filtered with
            // a plain .ilike()/.or() on the restaurant_customers query — resolve
            // matching user ids first, then restrict the main query to them.
            const { data: matchingUsers, error: usersError } = await c.var.supabase
                .from("users")
                .select("id")
                .or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`);

            if (usersError) throw new Error(usersError.message);

            const matchingIds = (matchingUsers ?? []).map((u: any) => u.id);
            if (matchingIds.length === 0) {
                return c.json({
                    customers: [],
                    pagination: { page, limit, total: 0, totalPages: 1 }
                });
            }
            query = query.in("customer_id", matchingIds);
        }
    }

    // Order by recency, not spend — sorting by total_spent here silently biased
    // any truncated page toward big spenders, hiding new/low-spend customers
    // from the "Total clients" stat and from every client-side sort mode
    // (the UI's own sort options re-sort this same fetched window).
    const { data, count, error } = await query
        .order("created_at", { ascending: false })
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
        { data: orders, error: ordersError }
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
        
        // Parked (draft) orders aren't real orders yet — same convention as the
        // main orders list (see orders.ts) — so keep them out of the customer's
        // order history. Fetched uncapped (well, capped generously at 200) so the
        // stats below can be derived from this same set instead of a denormalized
        // column that may use a different filtering rule.
        c.var.supabase
            .from("orders")
            .select("id, total, status, payment_status, created_at, items")
            .eq("restaurant_id", restaurantId)
            .eq("customer_id", customerId)
            .neq("status", "draft")
            .order("created_at", { ascending: false })
            .limit(200)
    ]);

    if (rcError || !rc) return c.json({ error: "Client introuvable" }, 404);

    const nonDraftOrders = orders || [];
    // Only paid orders count as "favorite products" / actual spend — this must
    // stay the same filter used for totalSpent below, otherwise the "Habitudes
    // de Consommation" panel and the top-line stats represent different subsets
    // of the customer's orders (see audit finding #5/#6).
    const paidOrders = nonDraftOrders.filter((o: any) => o.payment_status === "paid");

    // Dynamic favorite products logic
    const productCounts: Record<string, { name: string, count: number }> = {};
    paidOrders.forEach((o: any) => {
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

    // Derive the header stats from the same non-draft order set shown in the
    // "Historique Récent" table below, instead of the denormalized
    // restaurant_customers.orders_count/total_spent columns — those are
    // maintained by a DB-side trigger/job whose own filtering rule isn't
    // guaranteed to match (drafts/cancelled orders), which previously let the
    // displayed stats silently diverge from the visible order rows.
    const ordersCount = nonDraftOrders.length;
    const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

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
            totalSpent,
            ordersCount,
            lastOrderAt: rc.last_order_at,
            avgOrderValue: ordersCount > 0 ? Math.round(totalSpent / ordersCount) : 0,
            topProducts
        },
        segment: rc.segment,
        internalNotes: rc.internal_notes,
        tags: rc.tags,
        orders: nonDraftOrders.slice(0, 20)
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
