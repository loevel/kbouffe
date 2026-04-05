/**
 * GET /api/admin/ai-usage
 * Returns platform-wide Gemini AI usage stats for the admin dashboard.
 *
 * Response shape (matches AiUsageData interface in the page):
 * {
 *   summary: { totalTodayCalls, totalMonthCalls, totalCostFCFA, activeRestaurants }
 *   globalByFeature: Record<string, number>          — month calls per feature
 *   dailyTrend: { date, calls }[]                    — last 14 days
 *   topRestaurants: { restaurantId, name, slug, todayCalls, monthCalls, byFeature, estimatedCostFCFA }[]
 * }
 */
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

// Rough cost estimate per Gemini call (FCFA).
// Gemini 2.5 Flash Lite: ~$0.00025/call avg → ~0.15 FCFA. We round up to 5 FCFA
// to account for heavier calls (photo, OCR) and provide a meaningful number.
const COST_PER_CALL_FCFA = 5;

export async function GET() {
    const { ctx, error } = await withAdmin();
    if (error) return error;

    const db = ctx.supabase as any;

    const now = new Date();
    const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    ).toISOString();
    const monthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    ).toISOString();
    const fourteenDaysAgo = new Date(
        now.getTime() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    // ── Fetch all logs for this month (with restaurant join) ──────────────────
    const { data: monthLogs, error: logsErr } = await db
        .from("ai_usage_logs")
        .select("id, restaurant_id, feature, created_at, restaurants(id, name, slug)")
        .gte("created_at", monthStart)
        .order("created_at", { ascending: false });

    if (logsErr) {
        return NextResponse.json({ error: logsErr.message }, { status: 500 });
    }

    const logs: {
        id: string;
        restaurant_id: string | null;
        feature: string;
        created_at: string;
        restaurants: { id: string; name: string; slug: string } | null;
    }[] = monthLogs ?? [];

    // ── Today subset ──────────────────────────────────────────────────────────
    const todayLogs = logs.filter((l) => l.created_at >= todayStart);

    // ── Summary ───────────────────────────────────────────────────────────────
    const totalTodayCalls = todayLogs.length;
    const totalMonthCalls = logs.length;
    const totalCostFCFA = totalMonthCalls * COST_PER_CALL_FCFA;

    // Count distinct restaurant_ids that actually have a restaurant linked
    const activeRestaurantsSet = new Set(
        logs
            .filter((l) => l.restaurant_id && l.restaurants)
            .map((l) => l.restaurant_id)
    );
    const activeRestaurants = activeRestaurantsSet.size;

    // ── Global by feature (month) ─────────────────────────────────────────────
    const globalByFeature: Record<string, number> = {};
    for (const l of logs) {
        globalByFeature[l.feature] = (globalByFeature[l.feature] ?? 0) + 1;
    }

    // ── Daily trend (last 14 days) ────────────────────────────────────────────
    const trendLogs = logs.filter((l) => l.created_at >= fourteenDaysAgo);
    const trendMap: Record<string, number> = {};
    for (const l of trendLogs) {
        const day = l.created_at.slice(0, 10); // YYYY-MM-DD
        trendMap[day] = (trendMap[day] ?? 0) + 1;
    }

    // Fill all 14 days (even empty ones)
    const dailyTrend: { date: string; calls: number }[] = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        dailyTrend.push({ date: key, calls: trendMap[key] ?? 0 });
    }

    // ── Top restaurants ───────────────────────────────────────────────────────
    // Aggregate per restaurant
    const restaurantMap: Record<
        string,
        {
            restaurantId: string;
            name: string;
            slug: string;
            todayCalls: number;
            monthCalls: number;
            byFeature: Record<string, number>;
        }
    > = {};

    for (const l of logs) {
        if (!l.restaurant_id || !l.restaurants) continue;
        const rid = l.restaurant_id;
        if (!restaurantMap[rid]) {
            restaurantMap[rid] = {
                restaurantId: rid,
                name: l.restaurants.name,
                slug: l.restaurants.slug,
                todayCalls: 0,
                monthCalls: 0,
                byFeature: {},
            };
        }
        restaurantMap[rid].monthCalls += 1;
        restaurantMap[rid].byFeature[l.feature] =
            (restaurantMap[rid].byFeature[l.feature] ?? 0) + 1;
        if (l.created_at >= todayStart) {
            restaurantMap[rid].todayCalls += 1;
        }
    }

    const topRestaurants = Object.values(restaurantMap)
        .sort((a, b) => b.monthCalls - a.monthCalls)
        .slice(0, 10)
        .map((r) => ({
            ...r,
            estimatedCostFCFA: r.monthCalls * COST_PER_CALL_FCFA,
        }));

    return NextResponse.json({
        summary: {
            totalTodayCalls,
            totalMonthCalls,
            totalCostFCFA,
            activeRestaurants,
        },
        globalByFeature,
        dailyTrend,
        topRestaurants,
    });
}
