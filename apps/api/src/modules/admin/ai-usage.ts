import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminAiUsageRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Estimated cost per Gemini Flash 2.0 call in USD (approx)
const COST_PER_CALL_USD: Record<string, number> = {
    ai_photo:      0.04,  // Imagen 3 generate
    ai_analytics:  0.002, // Flash text
    ai_social:     0.002,
    ai_calendar:   0.003,
    ai_ocr:        0.003,
    ai_copywriter: 0.001,
};

const USD_TO_FCFA = 620;

function estimateCost(feature: string, calls: number): number {
    return Math.round((COST_PER_CALL_USD[feature] ?? 0.002) * calls * USD_TO_FCFA);
}

// ── GET /admin/ai-usage — dashboard global ──────────────────────────────────
adminAiUsageRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [
        { data: todayLogs },
        { data: monthLogs },
        { data: restaurants },
    ] = await Promise.all([
        supabase.from("ai_usage_logs").select("restaurant_id, feature").gte("created_at", todayStart),
        supabase.from("ai_usage_logs").select("restaurant_id, feature, created_at").gte("created_at", monthStart),
        supabase.from("restaurants").select("id, name, slug"),
    ]);

    const restaurantMap = new Map<string, { name: string; slug: string }>(
        (restaurants ?? []).map((r: any) => [r.id, { name: r.name, slug: r.slug }])
    );

    // Aggregate by restaurant
    type RestaurantUsage = {
        restaurantId: string;
        name: string;
        slug: string;
        todayCalls: number;
        monthCalls: number;
        byFeature: Record<string, number>;
        estimatedCostFCFA: number;
    };

    const byRestaurant = new Map<string, RestaurantUsage>();

    for (const log of monthLogs ?? []) {
        const rid = (log as any).restaurant_id;
        const feature = (log as any).feature as string;
        if (!byRestaurant.has(rid)) {
            const info = restaurantMap.get(rid);
            byRestaurant.set(rid, {
                restaurantId: rid,
                name: info?.name ?? "Inconnu",
                slug: info?.slug ?? rid,
                todayCalls: 0,
                monthCalls: 0,
                byFeature: {},
                estimatedCostFCFA: 0,
            });
        }
        const entry = byRestaurant.get(rid)!;
        entry.monthCalls++;
        entry.byFeature[feature] = (entry.byFeature[feature] ?? 0) + 1;
        entry.estimatedCostFCFA += estimateCost(feature, 1);
    }

    // Today counts
    for (const log of todayLogs ?? []) {
        const rid = (log as any).restaurant_id;
        const entry = byRestaurant.get(rid);
        if (entry) entry.todayCalls++;
    }

    // Global feature breakdown (month)
    const globalByFeature: Record<string, number> = {};
    for (const log of monthLogs ?? []) {
        const f = (log as any).feature as string;
        globalByFeature[f] = (globalByFeature[f] ?? 0) + 1;
    }

    // Daily trend for last 14 days
    const dailyMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        dailyMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const log of monthLogs ?? []) {
        const day = new Date((log as any).created_at).toISOString().slice(0, 10);
        if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }
    const dailyTrend = Array.from(dailyMap.entries()).map(([date, calls]) => ({ date, calls }));

    const sorted = Array.from(byRestaurant.values())
        .sort((a, b) => b.monthCalls - a.monthCalls);

    const totalTodayCalls = (todayLogs ?? []).length;
    const totalMonthCalls = (monthLogs ?? []).length;
    const totalCostFCFA = sorted.reduce((s, r) => s + r.estimatedCostFCFA, 0);

    return c.json({
        summary: {
            totalTodayCalls,
            totalMonthCalls,
            totalCostFCFA,
            activeRestaurants: sorted.filter(r => r.monthCalls > 0).length,
        },
        globalByFeature,
        dailyTrend,
        topRestaurants: sorted.slice(0, 20),
    });
});

// ── GET /admin/ai-usage/restaurant/:id — détail par resto ────────────────────
adminAiUsageRoutes.get("/restaurant/:id", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const restaurantId = c.req.param("id");
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

    const [{ data: monthLogs }, { data: todayLogs }] = await Promise.all([
        supabase.from("ai_usage_logs").select("feature, created_at").eq("restaurant_id", restaurantId).gte("created_at", monthStart),
        supabase.from("ai_usage_logs").select("feature").eq("restaurant_id", restaurantId).gte("created_at", todayStart),
    ]);

    const byFeature: Record<string, { month: number; today: number; costFCFA: number }> = {};
    for (const log of monthLogs ?? []) {
        const f = (log as any).feature as string;
        if (!byFeature[f]) byFeature[f] = { month: 0, today: 0, costFCFA: 0 };
        byFeature[f].month++;
        byFeature[f].costFCFA += estimateCost(f, 1);
    }
    for (const log of todayLogs ?? []) {
        const f = (log as any).feature as string;
        if (!byFeature[f]) byFeature[f] = { month: 0, today: 0, costFCFA: 0 };
        byFeature[f].today++;
    }

    return c.json({
        restaurantId,
        todayCalls: (todayLogs ?? []).length,
        monthCalls: (monthLogs ?? []).length,
        totalCostFCFA: Object.values(byFeature).reduce((s, v) => s + v.costFCFA, 0),
        byFeature,
    });
});
