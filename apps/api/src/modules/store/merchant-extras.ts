/**
 * Merchant extras — advanced endpoints for analytics, support, and data export
 *
 * Mounted at multiple paths in index.ts:
 * - /analytics for analytics stats
 * - /restaurant for support and export
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const merchantExtrasRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /stats — Analytics KPIs (mounted at /analytics/stats) */
merchantExtrasRoutes.get("/stats", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const fromParam = c.req.query("from");
    const toParam = c.req.query("to");
    const now = Date.now();
    const to = new Date(toParam || now);
    const from = new Date(fromParam || now - 30 * 24 * 60 * 60 * 1000);

    // ── 1. Orders in date range ──────────────────────────────────────────
    const { data: ordersRaw } = await supabase
        .from("orders")
        .select("id, total, status, delivery_type, created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: true });

    const allOrders = ordersRaw ?? [];
    const validOrders = allOrders.filter(o => !["cancelled", "refunded"].includes(o.status));
    const completedOrders = allOrders.filter(o => ["completed", "delivered"].includes(o.status)).length;
    const cancelledOrders = allOrders.filter(o => o.status === "cancelled").length;
    const cancelRate = allOrders.length > 0 ? (cancelledOrders / allOrders.length) * 100 : 0;
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // ── 2. This week vs prev week (independent of date range) ────────────
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const { data: weekRaw } = await supabase
        .from("orders")
        .select("total, status, created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", fourteenDaysAgo.toISOString())
        .not("status", "in", "(cancelled,refunded)");

    const weekOrders = weekRaw ?? [];
    const thisWeekRevenue = weekOrders
        .filter(o => new Date(o.created_at) >= sevenDaysAgo)
        .reduce((sum, o) => sum + (o.total || 0), 0);
    const prevWeekRevenue = weekOrders
        .filter(o => new Date(o.created_at) < sevenDaysAgo)
        .reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueGrowth = prevWeekRevenue > 0
        ? ((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100
        : 0;
    const recentOrdersCount = weekOrders.filter(o => new Date(o.created_at) >= sevenDaysAgo).length;

    // ── 3. Aggregates per order ──────────────────────────────────────────
    const DAY_MAP = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
    const ordersByDay: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 };
    const ordersByHour: Record<string, number> = {};
    const ordersByStatus: Record<string, number> = {};
    const deliveryBreakdown: Record<string, number> = {};
    const dailyRevenueMap: Record<string, number> = {};
    let peakHour: string | null = null;
    let peakCount = 0;

    for (const order of allOrders) {
        const d = new Date(order.created_at);
        ordersByDay[DAY_MAP[d.getDay()]] = (ordersByDay[DAY_MAP[d.getDay()]] || 0) + 1;
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }
    for (const order of validOrders) {
        const d = new Date(order.created_at);
        const hourKey = String(d.getHours());
        ordersByHour[hourKey] = (ordersByHour[hourKey] || 0) + 1;
        if (ordersByHour[hourKey] > peakCount) {
            peakCount = ordersByHour[hourKey];
            peakHour = `${d.getHours()}h`;
        }
        const delivKey = order.delivery_type || "unknown";
        deliveryBreakdown[delivKey] = (deliveryBreakdown[delivKey] || 0) + 1;
        const dateStr = order.created_at.slice(0, 10);
        dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + (order.total || 0);
    }

    const dailyRevenue = Object.entries(dailyRevenueMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // ── 4. Best sellers from order_items ────────────────────────────────
    const orderIds = validOrders.map(o => o.id);
    let bestSellers: { name: string; qty: number; revenue: number }[] = [];
    if (orderIds.length > 0) {
        const { data: items } = await supabase
            .from("order_items")
            .select("name, quantity, subtotal")
            .in("order_id", orderIds);

        const productMap = new Map<string, { qty: number; revenue: number }>();
        for (const item of items ?? []) {
            const key = item.name || "Produit";
            const cur = productMap.get(key) ?? { qty: 0, revenue: 0 };
            cur.qty += item.quantity || 0;
            cur.revenue += item.subtotal || 0;
            productMap.set(key, cur);
        }
        bestSellers = Array.from(productMap.entries())
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 10);
    }

    // ── 5. Products stats ────────────────────────────────────────────────
    const { data: productsRaw } = await supabase
        .from("products")
        .select("price, image_url, is_available")
        .eq("restaurant_id", restaurantId);

    const products = productsRaw ?? [];
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_available).length;
    const productsWithoutImages = products.filter(p => !p.image_url).length;
    const activePrices = products.filter(p => p.is_available && p.price > 0).map(p => p.price);
    const avgPrice = activePrices.length > 0
        ? activePrices.reduce((s, p) => s + p, 0) / activePrices.length
        : 0;

    // ── 6. Categories stats ──────────────────────────────────────────────
    const { data: categoriesRaw } = await supabase
        .from("categories")
        .select("id, is_active")
        .eq("restaurant_id", restaurantId);

    const categories = categoriesRaw ?? [];

    return c.json({
        totalProducts,
        activeProducts,
        productsWithoutImages,
        totalOrders: allOrders.length,
        completedOrders,
        cancelledOrders,
        cancelRate,
        totalRevenue,
        avgOrderValue,
        avgPrice,
        thisWeekRevenue,
        prevWeekRevenue,
        revenueGrowth,
        recentOrdersCount,
        peakHour,
        bestSellers,
        ordersByDay,
        ordersByHour,
        deliveryBreakdown,
        ordersByStatus,
        dailyRevenue,
        totalCategories: categories.length,
        activeCategories: categories.filter(cat => cat.is_active).length,
    });
});

/** GET /support/tickets — Get merchant support tickets (mounted at /restaurant/support/tickets) */
merchantExtrasRoutes.get("/support/tickets", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, description, type, status, priority, created_at, updated_at")
        .eq("restaurant_id", restaurantId)
        .eq("reporter_type", "restaurant")
        .order("created_at", { ascending: false });

    if (error) {
        return c.json({ error: "Failed to fetch support tickets" }, 500);
    }

    return c.json({ tickets: data || [] });
});

/** POST /support/tickets — Create a new support ticket (mounted at /restaurant/support/tickets) */
merchantExtrasRoutes.post("/support/tickets", async (c) => {
    const restaurantId = c.var.restaurantId;
    const userId = c.var.userId;
    const supabase = c.var.supabase;

    const body = await c.req.json();

    const { data, error } = await supabase
        .from("support_tickets")
        .insert({
            restaurant_id: restaurantId,
            reporter_id: userId,
            reporter_type: "restaurant",
            subject: body.subject,
            description: body.description,
            type: body.type || "general",
            status: "open",
            priority: body.priority || "normal",
        })
        .select()
        .single();

    if (error) {
        return c.json({ error: "Failed to create support ticket" }, 500);
    }

    return c.json(data, 201);
});

/** GET /export/:type — Export merchant data (RGPD compliance - mounted at /restaurant/export/:type) */
merchantExtrasRoutes.get("/export/:type", async (c) => {
    const restaurantId = c.var.restaurantId;
    const exportType = c.req.param("type");
    const supabase = c.var.supabase;

    // Create service role client for unrestricted access
    const serviceSupabase = supabase;

    let exportData: any = {};

    switch (exportType) {
        case "products":
            const { data: products } = await serviceSupabase
                .from("products")
                .select("*")
                .eq("restaurant_id", restaurantId);
            exportData = products || [];
            break;

        case "orders":
            const { data: orders } = await serviceSupabase
                .from("orders")
                .select("*, order_items(*)")
                .eq("restaurant_id", restaurantId);
            exportData = orders || [];
            break;

        case "reviews":
            const { data: reviews } = await serviceSupabase
                .from("reviews")
                .select("*")
                .eq("restaurant_id", restaurantId);
            exportData = reviews || [];
            break;

        case "team":
            const { data: members } = await serviceSupabase
                .from("restaurant_members")
                .select("*, users(id, email, full_name)")
                .eq("restaurant_id", restaurantId);
            exportData = members || [];
            break;

        case "all":
            const allExports = await Promise.all([
                serviceSupabase.from("products").select("*").eq("restaurant_id", restaurantId),
                serviceSupabase.from("orders").select("*, order_items(*)").eq("restaurant_id", restaurantId),
                serviceSupabase.from("reviews").select("*").eq("restaurant_id", restaurantId),
                serviceSupabase.from("restaurant_members").select("*, users(id, email, full_name)").eq("restaurant_id", restaurantId),
            ]);
            exportData = {
                products: allExports[0].data || [],
                orders: allExports[1].data || [],
                reviews: allExports[2].data || [],
                team: allExports[3].data || [],
            };
            break;

        default:
            return c.json({ error: "Invalid export type" }, 400);
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `kbouffe_${exportType}_${timestamp}.json`;

    return c.json({
        data: exportData,
        filename,
        exported_at: new Date().toISOString(),
    });
});

/** GET /summary — Get finances summary (mounted at /finances/summary) */
merchantExtrasRoutes.get("/summary", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    // Get date range from query params
    const fromParam = c.req.query("from");
    const toParam = c.req.query("to");

    const to = new Date(toParam || Date.now()).toISOString();
    const from = new Date(fromParam || Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
        // Get transactions (orders) for the period
        const { data: orders } = await supabase
            .from("orders")
            .select("id, total, delivery_fee, status, payment_method, payment_status, customer_name, created_at")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", from)
            .lte("created_at", to)
            .order("created_at", { ascending: false });

        // Get payouts
        const { data: payouts } = await supabase
            .from("payouts")
            .select("id, amount, status, period_start, period_end, paid_at, created_at")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false });

        // Calculate summary
        const validOrders = (orders || []).filter(o => !["cancelled", "refunded"].includes(o.status));

        const grossRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const deliveryRevenue = validOrders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
        const feesRevenue = 0; // Would need to calculate from order fees
        const tipsRevenue = 0; // Would need tip data
        const totalRevenue = grossRevenue + deliveryRevenue;

        const paidPayouts = (payouts || []).filter(p => p.status === "paid");
        const totalPaidOut = paidPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
        const pendingPayouts = (payouts || [])
            .filter(p => p.status === "pending")
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        return c.json({
            summary: {
                grossRevenue,
                deliveryRevenue,
                feesRevenue,
                tipsRevenue,
                totalRevenue,
                transactionCount: validOrders.length,
                avgOrderValue: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
                totalPaidOut,
                pendingPayouts,
            },
            transactions: (orders || []).map(o => ({
                id: o.id,
                customer_name: o.customer_name || "Client",
                total: o.total,
                payment_method: o.payment_method || "unknown",
                payment_status: o.payment_status || "pending",
                status: o.status,
                created_at: o.created_at,
            })),
            payouts: payouts || [],
        });
    } catch (err) {
        return c.json({ error: "Failed to fetch finances summary" }, 500);
    }
});

/** GET /marketplace/services — Get available marketplace services (mounted at /marketplace/services) */
merchantExtrasRoutes.get("/services", async (c) => {
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("marketplace_services")
        .select("id, name, description, price, category, duration_days, features, icon")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        return c.json({ error: "Failed to fetch marketplace services" }, 500);
    }

    return c.json({ services: data || [] });
});
