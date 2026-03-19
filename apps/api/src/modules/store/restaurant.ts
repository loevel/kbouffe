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
