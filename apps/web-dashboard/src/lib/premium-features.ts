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

/**
 * Checks if a restaurant has an active premium_storefront subscription.
 * Uses the existing `get_active_packs_for_restaurant` RPC.
 */
export async function hasPremiumStorefront(
    supabase: SupabaseClient,
    restaurantId: string,
): Promise<boolean> {
    try {
        const { data } = await supabase.rpc("get_active_packs_for_restaurant", {
            p_restaurant_id: restaurantId,
        });

        if (!data || !Array.isArray(data) || data.length === 0) return false;

        return data.some(
            (pack: any) => pack.pack_type === "premium_storefront",
        );
    } catch {
        return false;
    }
}
