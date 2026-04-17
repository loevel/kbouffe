/**
 * GET /api/finances/summary
 * Aggregated financial summary with proper status filtering and date range support
 *
 * Query params:
 * - from: ISO date string (default: 30 days ago)
 * - to: ISO date string (default: now)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Parse date range from query params
        const searchParams = new URL(request.url).searchParams;
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");
        const dateFrom = fromParam ? new Date(fromParam).toISOString() : thirtyDaysAgo.toISOString();
        const dateTo = toParam ? new Date(toParam).toISOString() : now.toISOString();

        const [{ data: orders }, { data: payouts }] = await Promise.all([
            // Fetch paid + completed/delivered orders only, with proper date filtering
            supabase
                .from("orders")
                .select("id, total, subtotal, delivery_fee, service_fee, tip_amount, corkage_fee, payment_method, payment_status, status, customer_name, created_at", { count: "exact" })
                .eq("restaurant_id", restaurantId)
                .eq("payment_status", "paid")
                .in("status", ["completed", "delivered"])
                .gte("created_at", dateFrom)
                .lte("created_at", dateTo)
                .order("created_at", { ascending: false })
                .limit(200),
            // Fetch all payouts for the restaurant
            supabase
                .from("payouts")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false }),
        ]);

        // Server-side aggregation
        const transactionsList = orders ?? [];
        const transactionCount = transactionsList.length;

        let grossRevenue = 0;
        let deliveryRevenue = 0;
        let feesRevenue = 0;
        let tipsRevenue = 0;
        let totalRevenue = 0;

        for (const order of transactionsList) {
            const o = order as any;
            const subtotal = o.subtotal || 0;
            const delivery_fee = o.delivery_fee || 0;
            const service_fee = o.service_fee || 0;
            const tip_amount = o.tip_amount || 0;
            const corkage_fee = o.corkage_fee || 0;
            const total = o.total || 0;

            grossRevenue += subtotal;
            deliveryRevenue += delivery_fee;
            feesRevenue += service_fee + corkage_fee;
            tipsRevenue += tip_amount;
            totalRevenue += total;
        }

        const avgOrderValue = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

        // Payout aggregation
        const payoutsList = payouts ?? [];
        let totalPaidOut = 0;
        let pendingPayouts = 0;

        for (const payout of payoutsList) {
            const p = payout as any;
            if (p.status === "paid") {
                totalPaidOut += p.amount || 0;
            } else if (p.status === "pending") {
                pendingPayouts += p.amount || 0;
            }
        }

        const response = NextResponse.json({
            summary: {
                grossRevenue,
                deliveryRevenue,
                feesRevenue,
                tipsRevenue,
                totalRevenue,
                transactionCount,
                avgOrderValue,
                totalPaidOut,
                pendingPayouts,
            },
            transactions: transactionsList.map((o: any) => ({
                id: o.id,
                customer_name: o.customer_name,
                total: o.total,
                payment_method: o.payment_method,
                payment_status: o.payment_status,
                status: o.status,
                created_at: o.created_at,
            })),
            payouts: payoutsList,
        });

        // Cache for 60 seconds, revalidate stale for up to 5 minutes
        response.headers.set(
            "Cache-Control",
            "private, s-maxage=60, stale-while-revalidate=300"
        );

        return response;
    } catch (error) {
        console.error("[/api/finances/summary] Error:", error);
        return apiError("Erreur lors du chargement des données financières");
    }
}
