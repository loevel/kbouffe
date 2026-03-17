/**
 * Public store routes — customer-facing, no auth required.
 *
 * GET  /store/:slug         — restaurant detail + menu + reviews
 * POST /store/order         — create a guest order
 * GET  /store/orders/:id    — track order by ID
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { publicReservationsRoutes } from "@kbouffe/module-reservations";
import type { Env } from "../../types";

export const storePublicRoutes = new Hono<{ Bindings: Env }>();

storePublicRoutes.route("/", publicReservationsRoutes);

const ALLOWED_DELIVERY_TYPES = ["delivery", "pickup", "dine_in"] as const;
const ALLOWED_PAYMENT_METHODS = ["cash", "mobile_money_mtn", "mobile_money_orange"] as const;

type DeliveryType = (typeof ALLOWED_DELIVERY_TYPES)[number];
type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

// ── Helper: admin Supabase client ─────────────────────────────────
function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// ── POST /order — create a guest order ────────────────────────────
storePublicRoutes.post("/order", async (c) => {
    try {
        const body = await c.req.json<{
            restaurantId: string;
            items: Array<{
                productId: string;
                name: string;
                price: number;
                quantity: number;
                options?: Array<{
                    optionId?: string;
                    valueId?: string;
                    name: string;
                    value: string;
                    priceAdjustment: number;
                }>;
            }>;
            deliveryType: DeliveryType;
            deliveryAddress?: string;
            tableNumber?: string;
            customerName: string;
            customerPhone: string;
            paymentMethod: PaymentMethod;
            subtotal: number;
            deliveryFee: number;
            total: number;
            notes?: string;
        }>();

        // ── Validation ────────────────────────────────────────────
        if (!body.restaurantId) return c.json({ error: "restaurantId requis" }, 400);
        if (!body.items?.length) return c.json({ error: "La commande doit contenir au moins un article" }, 400);
        if (!body.customerName?.trim()) return c.json({ error: "customerName requis" }, 400);
        if (!body.customerPhone?.trim()) return c.json({ error: "customerPhone requis" }, 400);
        if (!ALLOWED_DELIVERY_TYPES.includes(body.deliveryType)) return c.json({ error: "deliveryType invalide" }, 400);
        if (!ALLOWED_PAYMENT_METHODS.includes(body.paymentMethod)) return c.json({ error: "paymentMethod invalide" }, 400);

        const supabase = getAdminClient(c.env);

        // 1. Create the Order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                restaurant_id: body.restaurantId,
                customer_id: null, // guest order
                customer_name: body.customerName.trim(),
                customer_phone: body.customerPhone.trim(),
                items: body.items, // Keep JSON for backward compatibility / quick view
                subtotal: body.subtotal,
                delivery_fee: body.deliveryFee,
                service_fee: 0,
                total: body.total,
                status: "pending",
                delivery_type: body.deliveryType,
                delivery_address: body.deliveryAddress ?? null,
                payment_method: body.paymentMethod,
                payment_status: "pending",
                notes: body.notes ?? null,
                table_number: body.tableNumber ?? null,
            } as any)
            .select("id")
            .single();

        if (orderError || !order) {
            console.error("[POST /store/order] Supabase order error:", orderError);
            return c.json({ error: "Erreur lors de la création de la commande" }, 500);
        }

        const orderId = (order as { id: string }).id;

        // 2. Create Order Items and Options
        for (const item of body.items) {
            const { data: orderItem, error: itemError } = await supabase
                .from("order_items")
                .insert({
                    order_id: orderId,
                    product_id: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity,
                } as any)
                .select("id")
                .single();

            if (itemError || !orderItem) {
                console.error("[POST /store/order] Supabase item error:", itemError);
                // We don't fail the whole request since order is created, but we should log
                continue;
            }

            if (item.options?.length) {
                const optionsToInsert = item.options.map(opt => ({
                    order_item_id: orderItem.id,
                    option_id: opt.optionId ?? null,
                    value_id: opt.valueId ?? null,
                    name: opt.name,
                    value: opt.value,
                    price_adjustment: opt.priceAdjustment
                }));

                const { error: optionsError } = await supabase
                    .from("order_item_options")
                    .insert(optionsToInsert as any);

                if (optionsError) {
                    console.error("[POST /store/order] Supabase options error:", optionsError);
                }
            }
        }

        return c.json({ success: true, orderId }, 201);
    } catch (error) {
        console.error("[POST /store/order] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── GET /orders/:id — track order by UUID ─────────────────────────
storePublicRoutes.get("/orders/:id", async (c) => {
    try {
        const id = c.req.param("id");
        if (!id || id.length < 10) return c.json({ error: "ID de commande invalide" }, 400);

        const supabase = getAdminClient(c.env);

        const { data: order, error } = await supabase
            .from("orders")
            .select(
                "id, status, payment_status, delivery_type, delivery_address, customer_name, customer_phone, items, subtotal, delivery_fee, service_fee, total, created_at, updated_at, notes, table_number, restaurant_id, preparation_time_minutes, scheduled_for, delivered_at, delivery_note",
            )
            .eq("id", id)
            .single();

        if (error || !order) return c.json({ error: "Commande introuvable" }, 404);

        return c.json({ order });
    } catch (error) {
        console.error("[GET /store/orders/:id] error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── GET /:slug — restaurant detail + menu + reviews ───────────────
storePublicRoutes.get("/:slug", async (c) => {
    try {
        const slug = c.req.param("slug");
        const supabase = getAdminClient(c.env);

        // 1. Resolve restaurant from Supabase
        const { data: results, error: restError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("slug", slug)
            .eq("is_published", true)
            .limit(1);

        if (restError || !results || results.length === 0) {
            return c.json({ error: "Restaurant non trouvé" }, 404);
        }

        const rest = results[0];

        // 2. Get categories + products and reviews from Supabase in parallel
        const [categoriesRes, productsRes, reviewsRes] = await Promise.all([
            supabase
                .from("categories")
                .select("id, name, description, sort_order")
                .eq("restaurant_id", rest.id)
                .order("sort_order"),
            supabase
                .from("products")
                .select("id, name, description, price, compare_at_price, image_url, is_available, category_id, sort_order")
                .eq("restaurant_id", rest.id)
                .eq("is_available", true)
                .order("sort_order"),
            supabase
                .from("reviews")
                .select("id, rating, comment, created_at")
                .eq("restaurant_id", rest.id)
                .eq("is_visible", true)
                .order("created_at", { ascending: false })
                .limit(20)
        ]);

        return c.json({
            restaurant: {
                id: rest.id,
                name: rest.name,
                slug: rest.slug,
                description: rest.description,
                logoUrl: rest.logo_url,
                coverUrl: rest.cover_url,
                address: rest.address,
                city: rest.city,
                cuisineType: rest.cuisine_type,
                rating: rest.rating,
                reviewCount: rest.review_count,
                orderCount: rest.order_count,
                isVerified: rest.is_verified,
                isPremium: rest.is_premium,
            },
            categories: categoriesRes.data ?? [],
            products: productsRes.data ?? [],
            reviews: reviewsRes.data ?? [],
        });
    } catch (error) {
        console.error("[GET /store/:slug] error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
