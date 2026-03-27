/**
 * GET /api/analytics/stats
 * Returns enriched analytics stats for the restaurant dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";

export async function GET(_request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    try {
        const [
            { data: products },
            { data: orders },
            { data: categories },
            { data: orderItems },
        ] = await Promise.all([
            supabase
                .from("products")
                .select("id, name, price, is_available, category_id, image_url")
                .eq("restaurant_id", restaurantId),
            supabase
                .from("orders")
                .select("id, total_amount, status, delivery_method, created_at")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false })
                .limit(500),
            supabase
                .from("categories")
                .select("id, name, is_active")
                .eq("restaurant_id", restaurantId),
            supabase
                .from("order_items")
                .select("product_id, quantity, unit_price, product_name")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false })
                .limit(1000),
        ]);

        // --- Products ---
        const totalProducts = products?.length ?? 0;
        const activeProducts = products?.filter((p: any) => p.is_available)?.length ?? 0;
        const productsWithoutImages = products?.filter((p: any) => !p.image_url)?.length ?? 0;
        const avgPrice =
            totalProducts > 0
                ? Math.round(
                      (products?.reduce((sum: number, p: any) => sum + (p.price || 0), 0) ?? 0) /
                          totalProducts
                  )
                : 0;

        // --- Orders ---
        const totalOrders = orders?.length ?? 0;
        const completedOrders =
            orders?.filter((o: any) => o.status === "delivered" || o.status === "completed") ?? [];
        const cancelledOrders =
            orders?.filter((o: any) => o.status === "cancelled")?.length ?? 0;
        const cancelRate =
            totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

        // --- Revenue ---
        const totalRevenue = completedOrders.reduce(
            (sum: number, o: any) => sum + (o.total_amount || 0),
            0
        );
        const avgOrderValue =
            completedOrders.length > 0
                ? Math.round(totalRevenue / completedOrders.length)
                : 0;

        // --- Time-based filters ---
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentOrders =
            orders?.filter((o: any) => new Date(o.created_at) >= oneWeekAgo) ?? [];
        const prevWeekOrders =
            orders?.filter((o: any) => {
                const d = new Date(o.created_at);
                return d >= twoWeeksAgo && d < oneWeekAgo;
            }) ?? [];
        const monthOrders =
            orders?.filter((o: any) => new Date(o.created_at) >= oneMonthAgo) ?? [];

        // --- Week-over-week revenue ---
        const thisWeekRevenue = recentOrders
            .filter((o: any) => o.status === "delivered" || o.status === "completed")
            .reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const prevWeekRevenue = prevWeekOrders
            .filter((o: any) => o.status === "delivered" || o.status === "completed")
            .reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const revenueGrowth =
            prevWeekRevenue > 0
                ? Math.round(((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
                : 0;

        // --- Recent orders count (last 7 days) ---
        const recentOrdersCount = recentOrders.length;

        // --- Orders by day of week (last 30 days) ---
        const ordersByDay: Record<string, number> = {
            Lun: 0,
            Mar: 0,
            Mer: 0,
            Jeu: 0,
            Ven: 0,
            Sam: 0,
            Dim: 0,
        };
        const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        for (const o of monthOrders) {
            const day = dayNames[new Date(o.created_at).getDay()];
            ordersByDay[day] = (ordersByDay[day] || 0) + 1;
        }

        // --- Orders by hour (last 30 days) ---
        const ordersByHour: Record<number, number> = {};
        for (const o of monthOrders) {
            const hour = new Date(o.created_at).getHours();
            ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
        }

        // --- Peak hour ---
        const peakHourEntry = Object.entries(ordersByHour).sort(([, a], [, b]) => b - a)[0];
        const peakHour = peakHourEntry ? `${peakHourEntry[0]}h` : null;

        // --- Delivery breakdown ---
        const deliveryBreakdown: Record<string, number> = {};
        for (const o of orders ?? []) {
            const m = (o as any).delivery_method || "unknown";
            deliveryBreakdown[m] = (deliveryBreakdown[m] || 0) + 1;
        }

        // --- Orders by status ---
        const ordersByStatus: Record<string, number> = {};
        for (const o of orders ?? []) {
            const s = (o as any).status || "unknown";
            ordersByStatus[s] = (ordersByStatus[s] || 0) + 1;
        }

        // --- Best sellers (top 5) ---
        const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
        for (const item of orderItems ?? []) {
            const id = (item as any).product_id || "unknown";
            if (!productSales[id]) {
                productSales[id] = {
                    name: (item as any).product_name || "Produit inconnu",
                    qty: 0,
                    revenue: 0,
                };
            }
            productSales[id].qty += (item as any).quantity || 1;
            productSales[id].revenue +=
                ((item as any).unit_price || 0) * ((item as any).quantity || 1);
        }
        const bestSellers = Object.values(productSales)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        // --- Daily revenue (last 30 days) ---
        const dailyRevenueMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            dailyRevenueMap[key] = 0;
        }
        for (const o of monthOrders) {
            if ((o as any).status === "delivered" || (o as any).status === "completed") {
                const key = new Date(o.created_at).toISOString().slice(0, 10);
                if (key in dailyRevenueMap) {
                    dailyRevenueMap[key] += (o as any).total_amount || 0;
                }
            }
        }
        const dailyRevenue = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
            date,
            revenue: Math.round(revenue),
        }));

        // --- Categories ---
        const totalCategories = categories?.length ?? 0;
        const activeCategories =
            categories?.filter((c: any) => c.is_active)?.length ?? 0;

        return NextResponse.json({
            totalProducts,
            activeProducts,
            productsWithoutImages,
            totalOrders,
            completedOrders: completedOrders.length,
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
            totalCategories,
            activeCategories,
        });
    } catch (error) {
        console.error("[analytics/stats] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
