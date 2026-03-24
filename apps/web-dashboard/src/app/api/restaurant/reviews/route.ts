// @ts-nocheck
/**
 * GET /api/restaurant/reviews?page=1
 * Liste les avis restaurant du commerçant connecté.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { restaurantId } = auth.ctx;

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
    const offset = (page - 1) * PAGE_SIZE;

    try {
        const adminDb = await createAdminClient();

        const { data: reviews, error, count } = await adminDb
            .from("reviews")
            .select("id, order_id, customer_id, rating, comment, response, is_visible, created_at, updated_at", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            console.error("[GET /api/restaurant/reviews]", error);
            return apiError("Erreur serveur");
        }

        // Résolution des noms clients
        const customerIds = [...new Set((reviews ?? []).map((r) => r.customer_id))];
        let customerMap: Record<string, string> = {};
        if (customerIds.length > 0) {
            const { data: users } = await adminDb
                .from("users")
                .select("id, full_name")
                .in("id", customerIds);
            for (const u of users ?? []) {
                customerMap[u.id] = u.full_name ?? "Client";
            }
        }

        const total = count ?? 0;
        return NextResponse.json({
            reviews: (reviews ?? []).map((r) => ({
                ...r,
                customerName: customerMap[r.customer_id] ?? "Client",
            })),
            total,
            page,
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (err) {
        console.error("[GET /api/restaurant/reviews] unexpected", err);
        return apiError("Erreur serveur");
    }
}
