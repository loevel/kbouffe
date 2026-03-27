import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Daily AI call limits per feature.
 * These can be adjusted per plan in the future.
 */
const DAILY_LIMITS: Record<string, number> = {
    ai_photo: 10,       // 10 photo generations per day
    ai_analytics: 20,   // 20 AI advisor queries per day
    ai_social: 30,      // 30 social content generations per day
    ai_calendar: 5,     // 5 calendar generations per day
    ai_ocr: 15,         // 15 OCR scans per day
    ai_copywriter: 50,  // 50 copywriting calls per day
};

/**
 * Returns the start of today in UTC as an ISO string.
 */
function todayMidnightUTC(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

/**
 * Checks whether a restaurant is allowed to make another AI call for a given feature today.
 */
export async function checkAiRateLimit(
    supabase: SupabaseClient,
    restaurantId: string,
    feature: string,
): Promise<{ allowed: boolean; remaining: number; limit: number; used: number }> {
    const limit = DAILY_LIMITS[feature] ?? 10;
    const midnight = todayMidnightUTC();

    const { count, error } = await supabase
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .eq("feature", feature)
        .gte("created_at", midnight);

    if (error) {
        console.error("[ai-rate-limiter] Error checking usage:", error);
        // Fail open: allow the call but log the error
        return { allowed: true, remaining: limit, limit, used: 0 };
    }

    const used = count ?? 0;
    const remaining = Math.max(0, limit - used);

    return {
        allowed: used < limit,
        remaining,
        limit,
        used,
    };
}

/**
 * Logs a successful AI call for a restaurant + feature.
 */
export async function logAiUsage(
    supabase: SupabaseClient,
    restaurantId: string,
    feature: string,
    tokensUsed?: number,
): Promise<void> {
    const { error } = await supabase.from("ai_usage_logs").insert({
        restaurant_id: restaurantId,
        feature,
        tokens_used: tokensUsed ?? 0,
    });

    if (error) {
        console.error("[ai-rate-limiter] Error logging usage:", error);
    }
}

/**
 * Returns a usage summary for all AI features for today.
 * Used by the dashboard to display current consumption.
 */
export async function getAiUsageSummary(
    supabase: SupabaseClient,
    restaurantId: string,
): Promise<Record<string, { used: number; limit: number; remaining: number }>> {
    const midnight = todayMidnightUTC();

    const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("feature")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", midnight);

    if (error) {
        console.error("[ai-rate-limiter] Error fetching summary:", error);
    }

    // Count usage per feature from the returned rows
    const usageCounts: Record<string, number> = {};
    for (const row of data ?? []) {
        const f = (row as any).feature as string;
        usageCounts[f] = (usageCounts[f] || 0) + 1;
    }

    // Build summary for all features
    const summary: Record<string, { used: number; limit: number; remaining: number }> = {};
    for (const [feature, limit] of Object.entries(DAILY_LIMITS)) {
        const used = usageCounts[feature] || 0;
        summary[feature] = {
            used,
            limit,
            remaining: Math.max(0, limit - used),
        };
    }

    return summary;
}
