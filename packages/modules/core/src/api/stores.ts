import { Hono } from "hono";
import type { CoreEnv, CoreVariables } from "./types";

export const storesRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

/**
 * GET /stores
 * Public restaurant listing (explore / search)
 */
storesRoutes.get("/", async (c) => {
    // SEC-013: Strip characters that are significant in PostgREST filter syntax
    // to prevent query injection via .or() filter strings.
    const sanitize = (s: string) => s.replace(/[%,.()\[\]!<>&|*;]/g, "").slice(0, 100);

    const q       = sanitize(c.req.query("q")?.trim() ?? "");
    const cuisine = sanitize(c.req.query("cuisine")?.trim() ?? "");
    const city    = sanitize(c.req.query("city")?.trim() ?? "");
    const sort  = c.req.query("sort") ?? "recommended";
    const limit = Math.min(parseInt(c.req.query("limit") ?? "60"), 100);

    const supabase = c.get("supabase");

    // Build Supabase query
    let query = supabase
        .from("restaurants")
        .select(`
            id, name, slug, description, logo_url, banner_url, address, city,
            cuisine_type, price_range, rating, review_count, order_count,
            is_verified, is_premium, is_sponsored, has_dine_in,
            delivery_base_fee, delivery_per_km_fee, max_delivery_radius_km
        `)
        .eq("is_published", true);

    if (cuisine) {
        query = query.eq("cuisine_type", cuisine);
    }
    if (city) {
        query = query.ilike("city", `%${city}%`);
    }
    if (q) {
        query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,cuisine_type.ilike.%${q}%`);
    }

    const { data: rows, error } = await query
        .order("rating", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Stores listing error:", error);
        return c.json({ error: "Erreur lors de la récupération des restaurants" }, 500);
    }

    let results = (rows as any[]) || [];

    // Client-side sort overrides to match legacy behavior
    if (sort === "rating") {
        results = results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === "orders") {
        results = results.sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0));
    } else {
        // "recommended": sponsored first, then premium, then by rating
        results = results.sort((a, b) => {
            if (a.is_sponsored && !b.is_sponsored) return -1;
            if (!a.is_sponsored && b.is_sponsored) return 1;
            if (a.is_premium && !b.is_premium) return -1;
            if (!a.is_premium && b.is_premium) return 1;
            return (b.rating ?? 0) - (a.rating ?? 0);
        });
    }

    // Cache publicly: 1 min browser, 5 mins edge limit
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");

    const mappedResults = results.map(r => ({
        ...r,
        logoUrl: r.logo_url || "https://pub-1729b536b57c42c9a54d530432764964.r2.dev/defaults/restaurant-logo.png",
        coverUrl: r.banner_url || "https://pub-1729b536b57c42c9a54d530432764964.r2.dev/defaults/restaurant-banner.png",
        cuisineType: r.cuisine_type,
        priceRange: r.price_range,
        reviewCount: r.review_count,
        orderCount: r.order_count,
        isVerified: r.is_verified,
        isPremium: r.is_premium,
        isSponsored: r.is_sponsored,
        hasDineIn: r.has_dine_in,
        deliveryBaseFee: r.delivery_base_fee,
        deliveryPerKmFee: r.delivery_per_km_fee,
        maxDeliveryRadiusKm: r.max_delivery_radius_km,
    }));

    return c.json({ restaurants: mappedResults, total: results.length });
});

/**
 * GET /stores/:slug — Single restaurant public profile
 */
storesRoutes.get("/:slug", async (c) => {
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    const slug = c.req.param("slug");
    const supabase = c.get("supabase");

    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

    if (error || !restaurant) {
        return c.json({ error: "Restaurant non trouvé" }, 404);
    }

    const res = {
        ...restaurant,
        logoUrl: restaurant.logo_url || "https://pub-1729b536b57c42c9a54d530432764964.r2.dev/defaults/restaurant-logo.png",
        coverUrl: restaurant.banner_url || "https://pub-1729b536b57c42c9a54d530432764964.r2.dev/defaults/restaurant-banner.png",
        cuisineType: restaurant.cuisine_type,
        priceRange: restaurant.price_range,
        reviewCount: restaurant.review_count,
        orderCount: restaurant.order_count,
        isVerified: restaurant.is_verified,
        isPremium: restaurant.is_premium,
        isSponsored: restaurant.is_sponsored,
        hasDineIn: restaurant.has_dine_in,
        deliveryBaseFee: restaurant.delivery_base_fee,
        deliveryPerKmFee: restaurant.delivery_per_km_fee,
        maxDeliveryRadiusKm: restaurant.max_delivery_radius_km,
    };

    return c.json({ restaurant: res });
});

/**
 * Merchant-facing routes (Private)
 */

/** GET /restaurant — Get the merchant's restaurant */
storesRoutes.get("/me/info", async (c) => {
    const supabase = c.get("supabase");
    const restaurantId = c.get("restaurantId");

    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .maybeSingle();

    if (error) {
        console.error("Me info error:", error);
        return c.json({ error: "Erreur lors de la récupération des infos" }, 500);
    }

    return c.json({ success: true, restaurant });
});

const fieldMapping: Record<string, string> = {
    logoUrl: "logo_url",
    coverUrl: "banner_url",
    postalCode: "postal_code",
    cuisineType: "cuisine_type",
    priceRange: "price_range",
    isActive: "is_published",
    minOrderAmount: "min_order_amount",
    deliveryFee: "delivery_fee",
    deliveryBaseFee: "delivery_base_fee",
    deliveryPerKmFee: "delivery_per_km_fee",
    maxDeliveryRadiusKm: "max_delivery_radius_km",
    openingHours: "opening_hours",
    hasDineIn: "has_dine_in",
    hasReservations: "has_reservations",
    corkageFeeAmount: "corkage_fee_amount",
    dineInServiceFee: "dine_in_service_fee",
    totalTables: "total_tables",
    reservationCancelPolicy: "reservation_cancel_policy",
    reservationCancelNoticeMinutes: "reservation_cancel_notice_minutes",
    reservationCancellationFeeAmount: "reservation_cancellation_fee_amount",
    orderCancelPolicy: "order_cancel_policy",
    orderCancelNoticeMinutes: "order_cancel_notice_minutes",
    orderCancellationFeeAmount: "order_cancellation_fee_amount",
};

/** PATCH /restaurant — Update the merchant's restaurant */
storesRoutes.patch("/me/info", async (c) => {
    const supabase = c.get("supabase");
    const restaurantId = c.get("restaurantId");
    const body = await c.req.json();

    const allowedFields = [
        "name", "description", "logoUrl", "coverUrl",
        "address", "city", "postalCode", "cuisineType", "priceRange",
        "isActive", "slug", "phone", "email",
        "lat", "lng", "minOrderAmount", "deliveryFee",
        "deliveryBaseFee", "deliveryPerKmFee", "maxDeliveryRadiusKm",
        "openingHours", "hasDineIn", "hasReservations",
        "corkageFeeAmount", "dineInServiceFee", "totalTables",
        "reservationCancelPolicy", "reservationCancelNoticeMinutes",
        "reservationCancellationFeeAmount",
        "orderCancelPolicy", "orderCancelNoticeMinutes",
        "orderCancellationFeeAmount",
    ];

    const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const mappedField = fieldMapping[field] || field;
            updateData[mappedField] = body[field];
        }
    }

    const { data: updatedRestaurant, error } = await supabase
        .from("restaurants")
        .update(updateData)
        .eq("id", restaurantId)
        .select()
        .single();

    if (error) {
        console.error("Update restaurant error:", error);
        return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    }

    return c.json({ success: true, restaurant: updatedRestaurant });
});

/** GET /dashboard/stats */
storesRoutes.get("/me/dashboard-stats", async (c) => {
    const period = c.req.query("period") ?? "7d";
    const chartDays = period === "3m" ? 90 : period === "30d" ? 30 : 7;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const fetchDays = Math.max(chartDays, 30);
    const fetchSince = new Date(now.getFullYear(), now.getMonth(), now.getDate() - fetchDays).toISOString();

    const { data: ordersRaw, error } = await c.get("supabase")
        .from("orders")
        .select("id, total, status, payment_status, customer_id, created_at")
        .eq("restaurant_id", c.get("restaurantId"))
        .gte("created_at", fetchSince)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Stats query error:", error);
        return c.json({ error: "Erreur lors de la calcul des statistiques" }, 500);
    }

    const orders = (ordersRaw as unknown as any[]) ?? [];
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

