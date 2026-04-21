import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const financesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

financesRoutes.get("/summary", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const fromParam = c.req.query("from");
    const toParam = c.req.query("to");
    const to = new Date(toParam || Date.now()).toISOString();
    const from = new Date(fromParam || Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
        const { data: orders } = await supabase
            .from("orders")
            .select("id, total, delivery_fee, status, payment_method, payment_status, customer_name, created_at")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", from)
            .lte("created_at", to)
            .order("created_at", { ascending: false });

        const { data: payouts } = await supabase
            .from("payouts")
            .select("id, amount, status, period_start, period_end, paid_at, created_at")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false });

        const validOrders = (orders || []).filter(o => !["cancelled", "refunded"].includes(o.status));
        const grossRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const deliveryRevenue = validOrders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
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
                feesRevenue: 0,
                tipsRevenue: 0,
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
    } catch {
        return c.json({ error: "Erreur lors du chargement des finances" }, 500);
    }
});
