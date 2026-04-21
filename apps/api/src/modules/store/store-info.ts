/**
 * Public restaurant info route — returns restaurant profile, menu, and reviews.
 *
 * GET /:slug — restaurant detail + categories + products + reviews
 */
import { Hono } from "hono";
import type { Env } from "../../types";
import { getAdminClient } from "./store-helpers";

export const storeInfoRoutes = new Hono<{ Bindings: Env }>();

// ── GET /:slug — restaurant detail + menu + reviews ───────────────
storeInfoRoutes.get("/:slug", async (c) => {
    try {
        const slug = c.req.param("slug");
        const supabase = getAdminClient(c.env);

        // 1. Resolve restaurant from Supabase
        const { data: results, error: restError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("slug", slug)
            .eq("is_published", true)
            .eq("compliance_status", "compliant")
            .limit(1);

        if (restError || !results || results.length === 0) {
            return c.json({ error: "Restaurant non trouvé" }, 404);
        }

        const rest = results[0];

        // 2. Get categories + products + reviews (with customer names joined) in parallel
        //    showcase_sections and restaurant_members are fetched separately / lazily if needed.
        const [categoriesRes, productsRes, reviewsRes] = await Promise.all([
            supabase
                .from("categories")
                .select("id, name, description, sort_order")
                .eq("restaurant_id", rest.id)
                .order("sort_order"),
            supabase
                .from("products")
                .select("id, name, description, price, compare_at_price, image_url, is_available, category_id, sort_order, options, is_halal, is_vegan, is_gluten_free, allergens, product_images(url, display_order)")
                .eq("restaurant_id", rest.id)
                .eq("is_available", true)
                .order("sort_order"),
            // Join users table to get customer name in one round trip
            supabase
                .from("reviews")
                .select("id, rating, comment, response, created_at, customer_id, users!reviews_customer_id_fkey(full_name)")
                .eq("restaurant_id", rest.id)
                .eq("is_visible", true)
                .order("created_at", { ascending: false })
                .limit(10),
        ]);

        const reviewData = reviewsRes.data ?? [];

        return c.json({
            restaurant: {
                id: rest.id,
                name: rest.name,
                slug: rest.slug,
                description: rest.description,
                logoUrl: rest.logo_url,
                coverUrl: rest.cover_url ?? rest.banner_url,
                address: rest.address,
                city: rest.city,
                phone: rest.phone,
                email: rest.email,
                cuisineType: rest.cuisine_type,
                primaryColor: rest.primary_color,
                openingHours: rest.opening_hours,
                rating: rest.rating,
                reviewCount: rest.review_count,
                orderCount: rest.order_count,
                isVerified: rest.is_verified,
                isPremium: rest.is_premium,
                hasDineIn: rest.has_dine_in,
                hasReservations: rest.has_reservations,
                totalTables: rest.total_tables,
                deliveryFee: rest.delivery_fee,
                minOrderAmount: rest.min_order_amount,
                // Dine-in fees (needed by client to compute order totals)
                dineInServiceFee: rest.dine_in_service_fee ?? 0,
                corkageFeeAmount: rest.corkage_fee_amount ?? 0,
                // Reservation slot config
                reservationSlotDuration: rest.reservation_slot_duration ?? 90,
                reservationOpenTime: rest.reservation_open_time ?? "10:00",
                reservationCloseTime: rest.reservation_close_time ?? "22:00",
                reservationSlotInterval: rest.reservation_slot_interval ?? 30,
                // Cancellation policies (shown to customers before booking/ordering)
                orderCancelPolicy: rest.order_cancel_policy ?? "flexible",
                orderCancelNoticeMinutes: rest.order_cancel_notice_minutes ?? 30,
                orderCancellationFeeAmount: rest.order_cancellation_fee_amount ?? 0,
                reservationCancelPolicy: rest.reservation_cancel_policy ?? "flexible",
                reservationCancelNoticeMinutes: rest.reservation_cancel_notice_minutes ?? 120,
                reservationCancellationFeeAmount: rest.reservation_cancellation_fee_amount ?? 0,
                // Loyalty program
                loyaltyEnabled: rest.loyalty_enabled ?? false,
                loyaltyPointsPerOrder: rest.loyalty_points_per_order ?? 10,
                loyaltyPointValue: rest.loyalty_point_value ?? 1,
                loyaltyMinRedeemPoints: rest.loyalty_min_redeem_points ?? 100,
                loyaltyRewardTiers: rest.loyalty_reward_tiers ?? [],
                // Coordinates (for map features)
                lat: rest.lat ?? null,
                lng: rest.lng ?? null,
                maxDeliveryRadiusKm: rest.max_delivery_radius_km ?? null,
            },
            categories: categoriesRes.data ?? [],
            products: (productsRes.data ?? []).map((p: any) => {
                const extraImages: string[] = (p.product_images ?? [])
                    .sort((a: any, b: any) => a.display_order - b.display_order)
                    .map((img: any) => img.url);
                const images = p.image_url
                    ? [p.image_url, ...extraImages]
                    : extraImages;
                const { product_images: _, options: rawOptions, ...product } = p;
                // Map extra_price → extraPrice for mobile compatibility
                const options = (rawOptions ?? []).map((opt: any) => ({
                    name: opt.name,
                    required: opt.required ?? false,
                    choices: (opt.choices ?? []).map((c: any) => ({
                        label: c.label,
                        extraPrice: c.extra_price ?? 0,
                    })),
                }));
                return { ...product, images, options: options.length > 0 ? options : undefined };
            }),
            reviews: reviewData.map((r: any) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                response: r.response,
                created_at: r.created_at,
                customerName: r.users?.full_name ?? "Client",
            })),
        });
    } catch (error) {
        console.error("[GET /store/:slug] error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
