import { SupabaseClient } from "@supabase/supabase-js";

export type PremiumFeature =
    | "pixel_tracking"
    | "pwa_whitelabel"
    | "theme_engine"
    | "announcements"
    | "product_feed"
    | "social_publisher"
    | "ai_advisor"
    | "content_calendar"
    | "ai_photo"
    | "ocr_menu";

/** Slugs that grant premium storefront access */
const PREMIUM_SLUGS = ["premium_storefront", "ai_complete"];

/** Slugs that grant AI features access */
const AI_SLUGS = ["ai_marketing", "ai_advisor", "ai_complete"];

/**
 * Checks if a restaurant has an active purchase for any of the given service slugs.
 */
async function hasActivePurchase(
    supabase: SupabaseClient,
    restaurantId: string,
    slugs: string[],
): Promise<boolean> {
    try {
        // Get service IDs for the given slugs
        const { data: services } = await (supabase
            .from("marketplace_services" as any)
            .select("id")
            .in("slug", slugs) as any);

        if (!services || services.length === 0) return false;

        const serviceIds = services.map((s: any) => s.id);

        // Check for active, non-expired purchases
        const { data: purchases } = await (supabase
            .from("marketplace_purchases" as any)
            .select("id")
            .eq("restaurant_id", restaurantId)
            .eq("status", "active")
            .in("service_id", serviceIds)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .limit(1) as any);

        return !!purchases && purchases.length > 0;
    } catch {
        return false;
    }
}

/**
 * Checks if a restaurant has an active premium storefront subscription.
 */
export async function hasPremiumStorefront(
    supabase: SupabaseClient,
    restaurantId: string,
): Promise<boolean> {
    return hasActivePurchase(supabase, restaurantId, PREMIUM_SLUGS);
}

/**
 * Checks if a restaurant has an active AI features subscription.
 */
export async function hasAiFeatures(
    supabase: SupabaseClient,
    restaurantId: string,
): Promise<boolean> {
    return hasActivePurchase(supabase, restaurantId, AI_SLUGS);
}
