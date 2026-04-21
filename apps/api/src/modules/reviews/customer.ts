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
//  Customer routes — uses userAuthMiddleware (sets userId, no restaurant required)
// ═══════════════════════════════════════════════════════════════════════
export const customerReviewRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /reviews — Submit a review
 * Body: { orderId, restaurantId, rating (1-5), comment? }
 */
customerReviewRoutes.post("/", async (c) => {
    try {
        const userId = c.var.userId;
        const body = await c.req.json<{
            orderId?: string;
            restaurantId: string;
            rating: number;
            comment?: string;
        }>();

        // ── Validate fields ──────────────────────────────────────
        if (!body.restaurantId) return c.json({ error: "restaurantId requis" }, 400);
        if (!body.rating || body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
            return c.json({ error: "La note doit être un entier entre 1 et 5" }, 400);
        }

        const supabase = getAdminClient(c.env);

        // ── If orderId is provided, validate the order ───────────
        if (body.orderId) {
            const { data: order } = await supabase
                .from("orders")
                .select("id, customer_id, restaurant_id, status")
                .eq("id", body.orderId)
                .single();

            if (!order) return c.json({ error: "Commande introuvable" }, 404);
            if (order.customer_id !== userId) {
                return c.json({ error: "Cette commande ne vous appartient pas" }, 403);
            }
            if (order.restaurant_id !== body.restaurantId) {
                return c.json({ error: "Le restaurant ne correspond pas à la commande" }, 400);
            }
            if (!["delivered", "completed", "picked_up"].includes(order.status)) {
                return c.json({ error: "Vous ne pouvez noter qu'une commande terminée" }, 400);
            }

            // Check duplicate review for this order
            const { data: existingReview } = await supabase
                .from("reviews")
                .select("id")
                .eq("order_id", body.orderId)
                .eq("customer_id", userId)
                .maybeSingle();

            if (existingReview) {
                return c.json({ error: "Vous avez déjà laissé un avis pour cette commande" }, 409);
            }
        }

        // ── Verify the restaurant exists ─────────────────────────
        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("id")
            .eq("id", body.restaurantId)
            .single();

        if (!restaurant) return c.json({ error: "Restaurant introuvable" }, 404);

        // ── Insert the review ────────────────────────────────────
        const { data: review, error: insertError } = await supabase
            .from("reviews")
            .insert({
                order_id: body.orderId ?? null,
                restaurant_id: body.restaurantId,
                customer_id: userId,
                rating: body.rating,
                comment: body.comment?.trim() || null,
                is_visible: true,
            })
            .select("id, rating, comment, created_at")
            .single();

        if (insertError) {
            console.error("[POST /reviews] Insert error:", insertError);
            return c.json({ error: "Erreur lors de l'envoi de l'avis" }, 500);
        }

        // ── Update denormalized rating & review_count ────────────
        const { data: stats } = await supabase
            .from("reviews")
            .select("rating")
            .eq("restaurant_id", body.restaurantId)
            .eq("is_visible", true);

        if (stats && stats.length > 0) {
            const avg = stats.reduce((sum, r) => sum + r.rating, 0) / stats.length;
            await supabase
                .from("restaurants")
                .update({
                    rating: Math.round(avg * 10) / 10,
                    review_count: stats.length,
                })
                .eq("id", body.restaurantId);
        }

        return c.json({ success: true, review }, 201);
    } catch (error) {
        console.error("[POST /reviews] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

/**
 * GET /reviews/mine — List the authenticated customer's own reviews
 */
customerReviewRoutes.get("/mine", async (c) => {
    try {
        const userId = c.var.userId;
        const supabase = getAdminClient(c.env);

        const { data: reviews, error } = await supabase
            .from("reviews")
            .select("id, order_id, restaurant_id, rating, comment, response, created_at, updated_at")
            .eq("customer_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("[GET /reviews/mine] error:", error);
            return c.json({ error: "Erreur serveur" }, 500);
        }

        // Fetch restaurant names for context
        const restaurantIds = [...new Set((reviews ?? []).map(r => r.restaurant_id))];
        const restaurantMap: Record<string, string> = {};
        if (restaurantIds.length > 0) {
            const { data: restaurants } = await supabase
                .from("restaurants")
                .select("id, name")
                .in("id", restaurantIds);
            for (const r of restaurants ?? []) {
                restaurantMap[r.id] = r.name;
            }
        }

        return c.json({
            reviews: (reviews ?? []).map(r => ({
                ...r,
                restaurantName: restaurantMap[r.restaurant_id] ?? null,
            })),
        });
    } catch (error) {
        console.error("[GET /reviews/mine] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

/**
 * POST /reviews/product — Submit a product review
 * Body: { productId, restaurantId, rating (1-5), comment? }
 */
customerReviewRoutes.post("/product", async (c) => {
    try {
        const userId = c.var.userId;
        const body = await c.req.json<{
            productId: string;
            restaurantId: string;
            rating: number;
            comment?: string;
        }>();

        if (!body.productId) return c.json({ error: "productId requis" }, 400);
        if (!body.restaurantId) return c.json({ error: "restaurantId requis" }, 400);
        if (!body.rating || body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
            return c.json({ error: "La note doit être un entier entre 1 et 5" }, 400);
        }

        const supabase = getAdminClient(c.env);

        // Verify product exists and belongs to restaurant
        const { data: product } = await supabase
            .from("products")
            .select("id, restaurant_id")
            .eq("id", body.productId)
            .single();

        if (!product) return c.json({ error: "Produit introuvable" }, 404);
        if (product.restaurant_id !== body.restaurantId) {
            return c.json({ error: "Le produit ne correspond pas au restaurant" }, 400);
        }

        // Insert (unique constraint will prevent duplicates)
        const { data: review, error: insertError } = await supabase
            .from("product_reviews")
            .upsert(
                {
                    product_id: body.productId,
                    restaurant_id: body.restaurantId,
                    customer_id: userId,
                    rating: body.rating,
                    comment: body.comment?.trim() || null,
                    is_visible: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "product_id,customer_id" },
            )
            .select("id, rating, comment, created_at")
            .single();

        if (insertError) {
            console.error("[POST /reviews/product] Insert error:", insertError);
            return c.json({ error: "Erreur lors de l'envoi de l'avis" }, 500);
        }

        return c.json({ success: true, review }, 201);
    } catch (error) {
        console.error("[POST /reviews/product] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
