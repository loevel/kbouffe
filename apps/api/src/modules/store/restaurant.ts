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
        priceRange: supabaseResto.price_range,
        isActive: supabaseResto.is_published,
        phone: supabaseResto.phone,
        email: supabaseResto.email,
        lat: supabaseResto.lat,
        lng: supabaseResto.lng,
        minOrderAmount: supabaseResto.min_order_amount,
        deliveryFee: supabaseResto.delivery_fee,
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
        priceRange: "price_range",
        isActive: "is_published",
        minOrderAmount: "min_order_amount",
        deliveryFee: "delivery_fee",
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

    const allowedFields = [
        "name", "description", "logoUrl", "coverUrl",
        "address", "city", "postalCode", "cuisineType", "priceRange",
        "isActive", "slug", "phone", "email",
        "lat", "lng", "minOrderAmount", "deliveryFee",
        "openingHours", "hasDineIn", "hasReservations",
        "corkageFeeAmount", "dineInServiceFee", "totalTables",
        "reservationCancelPolicy", "reservationCancelNoticeMinutes",
        "reservationCancellationFeeAmount",
        "orderCancelPolicy", "orderCancelNoticeMinutes",
        "orderCancellationFeeAmount",
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
