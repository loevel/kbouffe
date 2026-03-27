/**
 * GET /api/dashboard/stats — Aggregated stats for the merchant's dashboard overview.
 *
 * Query params:
 *   period: "7d" (default) | "30d" | "3m" — affects revenueChart only
 *
 * Returns: { stats, revenueChart }
 * - stats: order counts, revenue, averageOrderValue, customerCount
 * - revenueChart: revenue data points for the requested period
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

interface OrderRow {
  id: string;
  total: number;
  subtotal: number;
  status: string;
  payment_status: string;
  customer_id: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const period = request.nextUrl.searchParams.get("period") ?? "7d";
    const chartDays = period === "3m" ? 90 : period === "30d" ? 30 : 7;

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    ).toISOString();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    // Fetch all orders for this restaurant covering chartDays + 30-day stats
    const fetchDays = Math.max(chartDays, 30);
    const fetchSince = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - fetchDays
    ).toISOString();

    const { data: ordersRaw, error } = await ctx.supabase
      .from("orders")
      .select("id, total, subtotal, status, payment_status, customer_id, created_at")
      .eq("restaurant_id", ctx.restaurantId)
      .gte("created_at", fetchSince)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Stats query error:", error);
      return apiError("Erreur lors du calcul des statistiques");
    }

    const orders = (ordersRaw as unknown as OrderRow[]) ?? [];

    // Revenue calculations (only orders with paid status)
    const paidOrders = orders.filter(
      (o) => o.payment_status === "paid" && o.status !== "cancelled"
    );

    const todayOrders = orders.filter((o) => o.created_at >= todayStart);
    const todayPaid = paidOrders.filter((o) => o.created_at >= todayStart);
    const weekPaid = paidOrders.filter((o) => o.created_at >= weekStart);
    const monthPaid = paidOrders.filter((o) => o.created_at >= monthStart);

    const todayRevenue = todayPaid.reduce((sum, o) => sum + o.total, 0);
    const weekRevenue = weekPaid.reduce((sum, o) => sum + o.total, 0);
    const monthRevenue = monthPaid.reduce((sum, o) => sum + o.total, 0);

    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const avgOrderValue =
      paidOrders.length > 0
        ? Math.round(
            paidOrders.reduce((sum, o) => sum + o.total, 0) / paidOrders.length
          )
        : 0;

    // Unique customers
    const uniqueCustomers = new Set(
      orders
        .filter((o) => o.customer_id)
        .map((o) => o.customer_id)
    );

    // Revenue chart: build per-day data for chartDays
    const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const revenueChart = Array.from({ length: chartDays }, (_, i) => {
      const day = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (chartDays - 1 - i)
      );
      const dayStart = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      ).toISOString();
      const dayEnd = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate() + 1
      ).toISOString();

      const dayRevenue = paidOrders
        .filter((o) => o.created_at >= dayStart && o.created_at < dayEnd)
        .reduce((sum, o) => sum + o.total, 0);

      // For 3m, show abbreviated month/day label; for others, show day label
      let label: string;
      if (chartDays === 90) {
        label = `${day.getDate()}/${day.getMonth() + 1}`;
      } else if (chartDays === 30) {
        label = `${day.getDate()}/${day.getMonth() + 1}`;
      } else {
        label = dayLabels[day.getDay()];
      }

      return { label, value: dayRevenue };
    });

    return NextResponse.json({
      stats: {
        revenue: {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
        },
        orders: {
          today: todayOrders.length,
          pending: pendingCount,
          total: orders.length,
        },
        averageOrderValue: avgOrderValue,
        totalCustomers: uniqueCustomers.size,
      },
      revenueChart,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return apiError("Erreur serveur");
  }
}
