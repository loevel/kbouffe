import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const fieldMapping: Record<string, string> = {
  logoUrl: "logo_url",
  coverUrl: "banner_url",
  primaryColor: "primary_color",
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
  paymentMethods: "payment_methods",
  paymentCredentials: "payment_credentials",
  smsNotificationsEnabled: "sms_notifications_enabled",
  notificationChannels: "notification_channels",
  deliveryZones: "delivery_zones",
  deliveryBaseFee: "delivery_base_fee",
  deliveryPerKmFee: "delivery_per_km_fee",
  maxDeliveryRadiusKm: "max_delivery_radius_km",
  notificationInfo: "notification_info",
  metaPixelId: "meta_pixel_id",
  googleAnalyticsId: "google_analytics_id",
  themeLayout: "theme_layout",
  onboardingCompleted: "onboarding_completed",
  descriptionI18n: "description_i18n",
};

/**
 * PATCH /api/restaurant
 * Met à jour le restaurant du marchand authentifié
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Trouver le restaurant de l'utilisateur dans Supabase
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("restaurant_id")
      .eq("id", user.id)
      .single();

    if (userError || !dbUser || !dbUser.restaurant_id) {
      return NextResponse.json(
        { error: "Restaurant non trouvé" },
        { status: 404 }
      );
    }

    const restaurantId = dbUser.restaurant_id;

    // Champs autorisés à mettre à jour
    const allowedFields = [
      "name", "description", "logoUrl", "coverUrl", "primaryColor", "address", "city", "postalCode", "country",
      "cuisineType", "priceRange", "isActive", "slug", "phone", "email", "lat", "lng",
      "minOrderAmount", "deliveryFee", "openingHours", "hasDineIn", "hasReservations",
      "corkageFeeAmount", "dineInServiceFee", "totalTables", "reservationCancelPolicy",
      "reservationCancelNoticeMinutes", "reservationCancellationFeeAmount",
      "orderCancelPolicy", "orderCancelNoticeMinutes", "orderCancellationFeeAmount",
      "payment_methods", "payment_credentials", "paymentMethods", "paymentCredentials",
      "sms_notifications_enabled", "smsNotificationsEnabled",
      "notification_channels", "notificationChannels",
      "notification_info", "notificationInfo",
      "delivery_zones", "deliveryZones",
      "delivery_base_fee", "deliveryBaseFee",
      "delivery_per_km_fee", "deliveryPerKmFee",
      "max_delivery_radius_km", "maxDeliveryRadiusKm",
      "metaPixelId", "meta_pixel_id",
      "googleAnalyticsId", "google_analytics_id",
      "themeLayout", "theme_layout",
      "onboardingCompleted", "onboarding_completed",
      // i18n bilingual support
      "descriptionI18n", "description_i18n",
    ];

    // Mapper les champs pour Supabase
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const mappedField = fieldMapping[field] || field;
        updateData[mappedField] = body[field];
      }
    }

    // Mettre à jour dans Supabase
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("id", restaurantId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur Supabase update restaurant:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
    });
  } catch (error: any) {
    console.error("Erreur update restaurant:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/restaurant
 * Récupère le restaurant du marchand authentifié
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Trouver le restaurant de l'utilisateur
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("restaurant_id")
      .eq("id", user.id)
      .single();

    if (userError || !dbUser || !dbUser.restaurant_id) {
      return NextResponse.json(
        { error: "Restaurant non trouvé" },
        { status: 404 }
      );
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", dbUser.restaurant_id)
      .single();

    if (restaurantError) {
      console.error("Erreur Supabase get restaurant:", restaurantError);
      throw restaurantError;
    }

    return NextResponse.json({
      success: true,
      restaurant: restaurant,
    });
  } catch (error: any) {
    console.error("Erreur get restaurant:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

