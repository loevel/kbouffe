/**
 * Restaurant routes — migrated from web-dashboard/src/app/api/restaurant/
 *
 * GET   /restaurant   — Get authenticated merchant's restaurant
 * PATCH /restaurant   — Update restaurant info
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const restaurantRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /restaurant — Get the merchant's restaurant */
restaurantRoutes.get("/", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data: supabaseResto, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .maybeSingle();

    if (error || !supabaseResto) {
        return c.json({ success: false, error: "Restaurant introuvable" }, 404);
    }

    const restaurant = {
        id: supabaseResto.id,
        name: supabaseResto.name,
        slug: supabaseResto.slug,
        description: supabaseResto.description,
        logoUrl: supabaseResto.logo_url,
        coverUrl: supabaseResto.banner_url || supabaseResto.cover_url,
        address: supabaseResto.address,
        city: supabaseResto.city,
        postalCode: supabaseResto.postal_code,
        cuisineType: supabaseResto.cuisine_type,
        cuisineTypes: supabaseResto.cuisine_types,
        priceRange: supabaseResto.price_range,
        isActive: supabaseResto.is_published,
        phone: supabaseResto.phone,
        email: supabaseResto.email,
        socialLinks: supabaseResto.social_links,
        lat: supabaseResto.lat,
        lng: supabaseResto.lng,
        minOrderAmount: supabaseResto.min_order_amount,
        deliveryFee: supabaseResto.delivery_fee,
        freeDeliveryThreshold: supabaseResto.free_delivery_threshold,
        estimatedDeliveryTime: supabaseResto.estimated_delivery_time,
        openingHours: supabaseResto.opening_hours,
        hasDineIn: supabaseResto.has_dine_in,
        hasReservations: supabaseResto.has_reservations,
        corkageFeeAmount: supabaseResto.corkage_fee_amount,
        dineInServiceFee: supabaseResto.dine_in_service_fee,
        totalTables: supabaseResto.total_tables,
        reservationSlotDuration: supabaseResto.reservation_slot_duration ?? 90,
        reservationOpenTime: supabaseResto.reservation_open_time ?? "10:00",
        reservationCloseTime: supabaseResto.reservation_close_time ?? "22:00",
        reservationSlotInterval: supabaseResto.reservation_slot_interval ?? 30,
        reservationCancelPolicy: supabaseResto.reservation_cancel_policy,
        reservationCancelNoticeMinutes: supabaseResto.reservation_cancel_notice_minutes,
        reservationCancellationFeeAmount: supabaseResto.reservation_cancellation_fee_amount,
        orderCancelPolicy: supabaseResto.order_cancel_policy,
        orderCancelNoticeMinutes: supabaseResto.order_cancel_notice_minutes,
        orderCancellationFeeAmount: supabaseResto.order_cancellation_fee_amount,
        // Menu customization
        primaryColor: supabaseResto.primary_color,
        welcomeMessage: supabaseResto.welcome_message,
        reviewsEnabled: supabaseResto.reviews_enabled,
        // Notifications
        dailyReportEnabled: supabaseResto.daily_report_enabled,
        waitAlertThresholdMinutes: supabaseResto.wait_alert_threshold_minutes,
        smsNotificationsEnabled: supabaseResto.sms_notifications_enabled,
        notificationChannels: supabaseResto.notification_channels,
        // Loyalty fields
        loyaltyEnabled: supabaseResto.loyalty_enabled,
        loyaltyPointsPerOrder: supabaseResto.loyalty_points_per_order,
        loyaltyPointValue: supabaseResto.loyalty_point_value,
        loyaltyMinRedeemPoints: supabaseResto.loyalty_min_redeem_points,
        loyaltyRewardTiers: supabaseResto.loyalty_reward_tiers,
    };

    return c.json({ success: true, restaurant });
});

/** PATCH /restaurant — Update the merchant's restaurant */
restaurantRoutes.patch("/", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;
    const body = await c.req.json();

    const fieldMapping: Record<string, string> = {
        logoUrl: "logo_url",
        coverUrl: "banner_url",
        postalCode: "postal_code",
        cuisineType: "cuisine_type",
        cuisineTypes: "cuisine_types",
        priceRange: "price_range",
        isActive: "is_published",
        minOrderAmount: "min_order_amount",
        deliveryFee: "delivery_fee",
        freeDeliveryThreshold: "free_delivery_threshold",
        estimatedDeliveryTime: "estimated_delivery_time",
        openingHours: "opening_hours",
        hasDineIn: "has_dine_in",
        hasReservations: "has_reservations",
        corkageFeeAmount: "corkage_fee_amount",
        dineInServiceFee: "dine_in_service_fee",
        totalTables: "total_tables",
        reservationSlotDuration: "reservation_slot_duration",
        reservationOpenTime: "reservation_open_time",
        reservationCloseTime: "reservation_close_time",
        reservationSlotInterval: "reservation_slot_interval",
        reservationCancelPolicy: "reservation_cancel_policy",
        reservationCancelNoticeMinutes: "reservation_cancel_notice_minutes",
        reservationCancellationFeeAmount: "reservation_cancellation_fee_amount",
        orderCancelPolicy: "order_cancel_policy",
        orderCancelNoticeMinutes: "order_cancel_notice_minutes",
        orderCancellationFeeAmount: "order_cancellation_fee_amount",
        // Menu customization
        primaryColor: "primary_color",
        welcomeMessage: "welcome_message",
        reviewsEnabled: "reviews_enabled",
        // Notifications
        dailyReportEnabled: "daily_report_enabled",
        waitAlertThresholdMinutes: "wait_alert_threshold_minutes",
        smsNotificationsEnabled: "sms_notifications_enabled",
        notificationChannels: "notification_channels",
        socialLinks: "social_links",
        // Loyalty mapping
        loyaltyEnabled: "loyalty_enabled",
        loyaltyPointsPerOrder: "loyalty_points_per_order",
        loyaltyPointValue: "loyalty_point_value",
        loyaltyMinRedeemPoints: "loyalty_min_redeem_points",
        loyaltyRewardTiers: "loyalty_reward_tiers",
    };

    const allowedFields = [
        "name", "description", "logoUrl", "coverUrl",
        "address", "city", "postalCode", "cuisineType", "cuisineTypes", "priceRange",
        "isActive", "slug", "phone", "email", "socialLinks",
        "lat", "lng", "minOrderAmount", "deliveryFee", "freeDeliveryThreshold", "estimatedDeliveryTime",
        "openingHours", "hasDineIn", "hasReservations",
        "corkageFeeAmount", "dineInServiceFee", "totalTables",
        "reservationSlotDuration", "reservationOpenTime", "reservationCloseTime", "reservationSlotInterval",
        "reservationCancelPolicy", "reservationCancelNoticeMinutes",
        "reservationCancellationFeeAmount",
        "orderCancelPolicy", "orderCancelNoticeMinutes",
        "orderCancellationFeeAmount",
        // Menu customization
        "primaryColor", "welcomeMessage", "reviewsEnabled",
        // Notifications
        "dailyReportEnabled", "waitAlertThresholdMinutes", "smsNotificationsEnabled", "notificationChannels",
        // Allowed loyalty fields
        "loyaltyEnabled", "loyaltyPointsPerOrder", "loyaltyPointValue", 
        "loyaltyMinRedeemPoints", "loyaltyRewardTiers",
    ];

    const supabaseUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const mappedField = fieldMapping[field] || field;
            supabaseUpdate[mappedField] = body[field];
        }
    }

    const { data: updatedSupabase, error } = await supabase
        .from("restaurants")
        .update(supabaseUpdate)
        .eq("id", restaurantId)
        .select()
        .single();

    if (error) {
        console.error("Supabase update error:", error);
        return c.json({ error: `Erreur lors de la mise à jour: ${error.message}` }, 500);
    }

    return c.json({ success: true, restaurant: updatedSupabase });
});

/** GET /restaurant/alerts — Fetch operational alerts (negative reviews, technical issues) */
restaurantRoutes.get("/alerts", async (c) => {
    const restaurantId = c.var.restaurantId;
    const { data, error } = await c.var.supabase
        .from("technical_logs")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .in("level", ["warn", "error"])
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ alerts: data });
});

/** GET /restaurant/activity — Last 10 activity events (orders + reviews + messages) */
restaurantRoutes.get("/activity", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, reviewsRes, messagesRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id, status, total, customer_name, created_at")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase
            .from("reviews")
            .select("id, rating, comment, customer_name, created_at")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("conversations")
            .select("id, type, subject, updated_at")
            .eq("restaurant_id", restaurantId)
            .gte("updated_at", since)
            .order("updated_at", { ascending: false })
            .limit(5),
    ]);

    type ActivityEvent = {
        id: string;
        type: "order_new" | "order_completed" | "review_new" | "message_new" | "payment_received" | "customer_new";
        title: string;
        description: string;
        created_at: string;
        meta?: { amount?: number; rating?: number };
    };

    const events: ActivityEvent[] = [];

    for (const order of ordersRes.data ?? []) {
        const shortId = (order.id as string).slice(-6).toUpperCase();
        events.push({
            id: `order-${order.id}`,
            type: order.status === "delivered" || order.status === "completed" ? "order_completed" : "order_new",
            title: order.status === "delivered" || order.status === "completed"
                ? `Commande #${shortId} livrée`
                : `Nouvelle commande #${shortId}`,
            description: order.customer_name
                ? `${order.customer_name} — ${order.total?.toLocaleString("fr-FR")} FCFA`
                : `${order.total?.toLocaleString("fr-FR")} FCFA`,
            created_at: order.created_at as string,
            meta: { amount: order.total },
        });
    }

    for (const review of reviewsRes.data ?? []) {
        const stars = "⭐".repeat(Math.max(1, Math.min(5, review.rating ?? 0)));
        events.push({
            id: `review-${review.id}`,
            type: "review_new",
            title: `Nouvel avis ${stars}`,
            description: review.comment?.slice(0, 60) ?? (review.customer_name ?? ""),
            created_at: review.created_at as string,
            meta: { rating: review.rating },
        });
    }

    for (const msg of messagesRes.data ?? []) {
        events.push({
            id: `msg-${msg.id}`,
            type: "message_new",
            title: "Nouveau message",
            description: msg.subject ?? (msg.type === "support" ? "Ticket support" : "Message client"),
            created_at: msg.updated_at as string,
        });
    }

    // Sort by date desc and cap at 15
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ events: events.slice(0, 15) });
});

/** GET /restaurant/badges — Unread counts for nav badges */
restaurantRoutes.get("/badges", async (c) => {
    const restaurantId = c.var.restaurantId;
    const userId = c.var.userId;
    const supabase = c.var.supabase;

    const [ordersRes, msgsRes, reviewsRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId)
            .in("status", ["pending", "confirmed"]),
        // Count messages sent by customers (not the merchant) that are unread
        supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false)
            .neq("sender_id", userId)
            .in(
                "conversation_id",
                supabase
                    .from("conversations")
                    .select("id")
                    .eq("restaurant_id", restaurantId)
            ),
        supabase
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId)
            .is("reply", null),
    ]);

    return c.json({
        orders: ordersRes.count ?? 0,
        messages: msgsRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
    });
});

/** GET /restaurant/search?q=... — Global quick search across orders, products, customers */
restaurantRoutes.get("/search", async (c) => {
    const restaurantId = c.var.restaurantId;
    const q = (c.req.query("q") ?? "").trim();
    const supabase = c.var.supabase;

    if (q.length < 2) return c.json({ results: [] });

    const [ordersRes, productsRes, customersRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id, status, total, customer_name, created_at")
            .eq("restaurant_id", restaurantId)
            .or(`id.ilike.%${q}%,customer_name.ilike.%${q}%`)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("products")
            .select("id, name, price, category_id")
            .eq("restaurant_id", restaurantId)
            .ilike("name", `%${q}%`)
            .limit(5),
        supabase
            .from("users")
            .select("id, full_name, phone, email")
            .ilike("full_name", `%${q}%`)
            .limit(3),
    ]);

    type SearchResult = { type: "order" | "product" | "customer"; id: string; title: string; subtitle?: string; href: string };
    const results: SearchResult[] = [];

    for (const o of ordersRes.data ?? []) {
        const shortId = (o.id as string).slice(-6).toUpperCase();
        results.push({
            type: "order",
            id: o.id as string,
            title: `Commande #${shortId}`,
            subtitle: `${o.customer_name ?? "Client"} — ${(o.total as number)?.toLocaleString("fr-FR")} FCFA`,
            href: `/dashboard/orders`,
        });
    }
    for (const p of productsRes.data ?? []) {
        results.push({
            type: "product",
            id: p.id as string,
            title: p.name as string,
            subtitle: `${(p.price as number)?.toLocaleString("fr-FR")} FCFA`,
            href: `/dashboard/menu`,
        });
    }
    for (const u of customersRes.data ?? []) {
        results.push({
            type: "customer",
            id: u.id as string,
            title: u.full_name as string,
            subtitle: (u.phone ?? u.email) as string | undefined,
            href: `/dashboard/customers`,
        });
    }

    return c.json({ results: results.slice(0, 10) });
});
