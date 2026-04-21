import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env } from "../../types";

function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  Public restaurant reviews — no auth required
// ═══════════════════════════════════════════════════════════════════════
export const publicRestaurantReviewRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /store/restaurants/:restaurantId/reviews — Public restaurant reviews
 */
publicRestaurantReviewRoutes.get("/restaurants/:restaurantId/reviews", async (c) => {
    try {
        const restaurantId = c.req.param("restaurantId");
        if (!restaurantId) return c.json({ error: "restaurantId requis" }, 400);

        const supabase = getAdminClient(c.env);

        // Fetch visible reviews with customer names
        const { data: reviews, error } = await supabase
            .from("reviews")
            .select("id, rating, comment, response, created_at, customer_id")
            .eq("restaurant_id", restaurantId)
            .eq("is_visible", true)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("[GET /store/restaurants/:id/reviews] error:", error);
            return c.json({ error: "Erreur serveur" }, 500);
        }

        // Fetch customer names
        const customerIds = [...new Set((reviews ?? []).map(r => r.customer_id))];
        const customerMap: Record<string, string> = {};
        if (customerIds.length > 0) {
            const { data: users } = await supabase
                .from("users")
                .select("id, full_name")
                .in("id", customerIds);
            for (const u of users ?? []) {
                customerMap[u.id] = u.full_name ?? "Client";
            }
        }

        // Compute stats & distribution
        const ratings = (reviews ?? []).map(r => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of ratings) {
            distribution[r] = (distribution[r] ?? 0) + 1;
        }

        return c.json({
            reviews: (reviews ?? []).map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                response: r.response,
                created_at: r.created_at,
                customerName: customerMap[r.customer_id] ?? "Client",
            })),
            stats: {
                count: ratings.length,
                average: Math.round(avgRating * 10) / 10,
                distribution,
            },
        });
    } catch (error) {
        console.error("[GET /store/restaurants/:id/reviews] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ═══════════════════════════════════════════════════════════════════════
//  Public product reviews — no auth required
// ═══════════════════════════════════════════════════════════════════════
export const publicProductReviewRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /store/products/:productId/reviews — Public product reviews
 */
publicProductReviewRoutes.get("/products/:productId/reviews", async (c) => {
    try {
        const productId = c.req.param("productId");
        if (!productId) return c.json({ error: "productId requis" }, 400);

        const supabase = getAdminClient(c.env);

        // Fetch visible reviews with customer names
        const { data: reviews, error } = await supabase
            .from("product_reviews")
            .select("id, rating, comment, response, created_at, customer_id")
            .eq("product_id", productId)
            .eq("is_visible", true)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("[GET /store/products/:id/reviews] error:", error);
            return c.json({ error: "Erreur serveur" }, 500);
        }

        // Fetch customer names
        const customerIds = [...new Set((reviews ?? []).map(r => r.customer_id))];
        const customerMap: Record<string, string> = {};
        if (customerIds.length > 0) {
            const { data: users } = await supabase
                .from("users")
                .select("id, full_name")
                .in("id", customerIds);
            for (const u of users ?? []) {
                customerMap[u.id] = u.full_name ?? "Client";
            }
        }

        // Compute stats
        const ratings = (reviews ?? []).map(r => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

        return c.json({
            reviews: (reviews ?? []).map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                response: r.response,
                created_at: r.created_at,
                customerName: customerMap[r.customer_id] ?? "Client",
            })),
            stats: {
                count: ratings.length,
                average: Math.round(avgRating * 10) / 10,
            },
        });
    } catch (error) {
        console.error("[GET /store/products/:id/reviews] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
