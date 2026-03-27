/**
 * Dashboard stats — migrated from web-dashboard/src/app/api/dashboard/stats/
 *
 * GET /dashboard/stats   — Aggregated merchant dashboard statistics
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

interface OrderRow {
    id: string;
    total: number;
    status: string;
    payment_status: string;
    customer_id: string | null;
    created_at: string;
}

export const dashboardRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /dashboard/stats */
dashboardRoutes.get("/stats", async (c) => {
    const period = c.req.query("period") ?? "7d";
    const chartDays = period === "3m" ? 90 : period === "30d" ? 30 : 7;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const fetchDays = Math.max(chartDays, 30);
    const fetchSince = new Date(now.getFullYear(), now.getMonth(), now.getDate() - fetchDays).toISOString();

    const { data: ordersRaw, error } = await c.var.supabase
        .from("orders")
        .select("id, total, status, payment_status, customer_id, created_at")
        .eq("restaurant_id", c.var.restaurantId)
        .gte("created_at", fetchSince)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Stats query error:", error);
        return c.json({ error: "Erreur lors du calcul des statistiques" }, 500);
    }

    const orders = (ordersRaw as unknown as OrderRow[]) ?? [];
    const paidOrders = orders.filter((o) => o.payment_status === "paid" && o.status !== "cancelled");

    const todayPaid = paidOrders.filter((o) => o.created_at >= todayStart);
    const weekPaid = paidOrders.filter((o) => o.created_at >= weekStart);
    const monthPaid = paidOrders.filter((o) => o.created_at >= monthStart);

    const todayRevenue = todayPaid.reduce((s, o) => s + o.total, 0);
    const weekRevenue = weekPaid.reduce((s, o) => s + o.total, 0);
    const monthRevenue = monthPaid.reduce((s, o) => s + o.total, 0);

    const avgOrderValue = paidOrders.length > 0
        ? Math.round(paidOrders.reduce((s, o) => s + o.total, 0) / paidOrders.length)
        : 0;

    const uniqueCustomers = new Set(orders.filter((o) => o.customer_id).map((o) => o.customer_id));

    const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const revenueChart = Array.from({ length: chartDays }, (_, i) => {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (chartDays - 1 - i));
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();

        const dayRevenue = paidOrders
            .filter((o) => o.created_at >= dayStart && o.created_at < dayEnd)
            .reduce((s, o) => s + o.total, 0);

        const label = chartDays > 7 ? `${day.getDate()}/${day.getMonth() + 1}` : dayLabels[day.getDay()];
        return { label, value: dayRevenue };
    });

    return c.json({
        stats: {
            revenue: { today: todayRevenue, week: weekRevenue, month: monthRevenue },
            orders: {
                today: orders.filter((o) => o.created_at >= todayStart).length,
                pending: orders.filter((o) => o.status === "pending").length,
                total: orders.length,
            },
            averageOrderValue: avgOrderValue,
            totalCustomers: uniqueCustomers.size,
        },
        revenueChart,
    });
});
