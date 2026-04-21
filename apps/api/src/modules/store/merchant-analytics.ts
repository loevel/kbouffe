import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const analyticsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

analyticsRoutes.get("/stats", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const fromParam = c.req.query("from");
    const toParam = c.req.query("to");
    const now = Date.now();
    const to = new Date(toParam || now);
    const from = new Date(fromParam || now - 30 * 24 * 60 * 60 * 1000);

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
