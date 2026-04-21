import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  Merchant routes — uses authMiddleware (sets restaurantId)
// ═══════════════════════════════════════════════════════════════════════
export const merchantReviewRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
export const merchantProductReviewRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /restaurant/reviews — List reviews for the merchant's restaurant
 */
merchantReviewRoutes.get("/", async (c) => {
    try {
        const restaurantId = c.var.restaurantId;
        const supabase = getAdminClient(c.env);
        const page = parseInt(c.req.query("page") ?? "1");
        const limit = 20;
        const offset = (page - 1) * limit;

        const { data: reviews, error, count } = await supabase
            .from("reviews")
            .select("id, order_id, customer_id, rating, comment, response, is_visible, created_at, updated_at", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("[GET /restaurant/reviews] error:", error);
            return c.json({ error: "Erreur serveur" }, 500);
        }

        // Fetch customer names
        const customerIds = [...new Set((reviews ?? []).map(r => r.customer_id))];
        const customerMap: Record<string, string> = {};
        if (customerIds.length > 0) {
            const { data: customers } = await supabase
                .from("users")
                .select("id, full_name")
                .in("id", customerIds);
            for (const u of customers ?? []) {
                customerMap[u.id] = u.full_name ?? "Client";
            }
        }

        return c.json({
            reviews: (reviews ?? []).map(r => ({
                ...r,
                customerName: customerMap[r.customer_id] ?? "Client",
            })),
            total: count ?? 0,
            page,
            totalPages: Math.ceil((count ?? 0) / limit),
        });
    } catch (error) {
        console.error("[GET /restaurant/reviews] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

/**
 * PATCH /restaurant/reviews/:id — Respond to a review
 * Body: { response: string }
 */
merchantReviewRoutes.patch("/:id", async (c) => {
    try {
        const restaurantId = c.var.restaurantId;
        const reviewId = c.req.param("id");
        const body = await c.req.json<{ response: string }>();

        if (!body.response?.trim()) {
            return c.json({ error: "La réponse ne peut pas être vide" }, 400);
        }

        const supabase = getAdminClient(c.env);

        // Verify the review belongs to this restaurant
        const { data: review } = await supabase
            .from("reviews")
            .select("id, restaurant_id")
            .eq("id", reviewId)
            .single();

        if (!review) return c.json({ error: "Avis introuvable" }, 404);
        if (review.restaurant_id !== restaurantId) {
            return c.json({ error: "Cet avis ne concerne pas votre restaurant" }, 403);
        }

        const { error: updateError } = await supabase
            .from("reviews")
            .update({
                response: body.response.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", reviewId);

        if (updateError) {
            console.error("[PATCH /restaurant/reviews/:id] error:", updateError);
            return c.json({ error: "Erreur lors de la mise à jour" }, 500);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("[PATCH /restaurant/reviews/:id] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

/**
 * GET /restaurant/product-reviews — List product reviews for the merchant's restaurant
 */
merchantProductReviewRoutes.get("/", async (c) => {
    try {
        const restaurantId = c.var.restaurantId;
        const supabase = getAdminClient(c.env);
        const page = parseInt(c.req.query("page") ?? "1");
        const limit = 20;
        const offset = (page - 1) * limit;

        const { data: reviews, error, count } = await supabase
            .from("product_reviews")
            .select("id, product_id, customer_id, rating, comment, response, is_visible, created_at, updated_at", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("[GET /restaurant/product-reviews] error:", error);
            return c.json({ error: "Erreur serveur" }, 500);
        }

        const customerIds = [...new Set((reviews ?? []).map((r) => r.customer_id))];
        const productIds = [...new Set((reviews ?? []).map((r) => r.product_id))];

        const customerMap: Record<string, string> = {};
        const productMap: Record<string, string> = {};

        if (customerIds.length > 0) {
            const { data: customers } = await supabase
                .from("users")
                .select("id, full_name")
                .in("id", customerIds);
            for (const user of customers ?? []) {
                customerMap[user.id] = user.full_name ?? "Client";
            }
        }

        if (productIds.length > 0) {
            const { data: products } = await supabase
                .from("products")
                .select("id, name")
                .in("id", productIds);
            for (const product of products ?? []) {
                productMap[product.id] = product.name ?? "Produit";
            }
        }

        return c.json({
            reviews: (reviews ?? []).map((review) => ({
                ...review,
                customerName: customerMap[review.customer_id] ?? "Client",
                productName: productMap[review.product_id] ?? "Produit",
            })),
            total: count ?? 0,
            page,
            totalPages: Math.ceil((count ?? 0) / limit),
        });
    } catch (error) {
        console.error("[GET /restaurant/product-reviews] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

/**
 * PATCH /restaurant/product-reviews/:id — Respond to a product review
 * Body: { response: string }
 */
merchantProductReviewRoutes.patch("/:id", async (c) => {
    try {
        const restaurantId = c.var.restaurantId;
        const reviewId = c.req.param("id");
        const body = await c.req.json<{ response: string }>();

        if (!body.response?.trim()) {
            return c.json({ error: "La réponse ne peut pas être vide" }, 400);
        }

        const supabase = getAdminClient(c.env);

        const { data: review } = await supabase
            .from("product_reviews")
            .select("id, restaurant_id")
            .eq("id", reviewId)
            .single();

        if (!review) return c.json({ error: "Avis introuvable" }, 404);
        if (review.restaurant_id !== restaurantId) {
            return c.json({ error: "Cet avis ne concerne pas votre restaurant" }, 403);
        }

        const { error: updateError } = await supabase
            .from("product_reviews")
            .update({
                response: body.response.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", reviewId);

        if (updateError) {
            console.error("[PATCH /restaurant/product-reviews/:id] error:", updateError);
            return c.json({ error: "Erreur lors de la mise à jour" }, 500);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("[PATCH /restaurant/product-reviews/:id] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
