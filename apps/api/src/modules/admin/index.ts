import { Hono } from "hono";
import type { Env, Variables } from "../../types";
import { requireDomain } from "../../lib/admin-rbac";

import { adminUsersRoutes } from "./users";
import { adminRestaurantsRoutes } from "./restaurants";
import { adminSupportRoutes } from "./support";
import { adminBillingRoutes } from "./billing";
import { adminModerationRoutes } from "./moderation";
import { adminMarketingRoutes } from "./marketing";
import { adminSystemRoutes } from "./system";
import { adminOrdersRoutes } from "./orders";
import { adminCatalogRoutes } from "./catalog";
import { adminMarketplaceRoutes } from "./marketplace";
import { adminBackupRoutes } from "./backup";
import { adminAiUsageRoutes } from "./ai-usage";
import { adminSubscriptionsRoutes } from "./subscriptions";
import { adminOnboardingRoutes } from "./onboarding";
import { adminSocialMonitorRoutes } from "./social-monitor";
import { adminCopilotRoutes } from "./copilot";
import { createClient } from "@supabase/supabase-js";

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const CANCELLED_ORDER_STATUSES = new Set(["cancelled", "refunded"]);

type ChartPeriod = "7d" | "30d" | "90d";

function parseChartPeriod(raw: string | undefined): ChartPeriod {
    if (raw === "7d" || raw === "90d") return raw;
    return "30d";
}

function startOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function toUtcDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function toLabel(date: Date): string {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
    }).format(date);
}

adminRoutes.get("/profile", async (c) => {
    return c.json({
        userId: c.get("userId"),
        adminRole: c.get("adminRole"),
    });
});

// Provide the general /admin/stats overview that was at the top-level of original admin.ts
adminRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [
        { data: globalMetrics },
        { count: totalUsers },
        { count: countClients },
        { count: countMerchants },
        { count: countLivreurs },
        { data: newSupabaseRestaurants },
        { data: activeSubscriptions },
        { count: aiCallsToday },
        { count: aiCallsMonth },
        { count: newRestaurantsThisMonth },
    ] = await Promise.all([
        supabase.from("platform_global_metrics").select("*").single(),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "merchant"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "driver"),
        supabase.from("restaurants")
            .select("id, name, is_published, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        // MRR: active marketplace purchases
        supabase.from("marketplace_purchases")
            .select("amount_paid, restaurant_id")
            .eq("status", "active")
            .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`),
        // AI calls today
        supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        // AI calls this month
        supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        // New restaurants this month
        supabase.from("restaurants").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
    ]);

    const newRestaurants = (newSupabaseRestaurants || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        isActive: r.is_published,
        createdAt: r.created_at,
    }));

    const metrics = globalMetrics || {
        total_restaurants: 0,
        active_restaurants: 0,
        total_gmv: 0,
        total_orders: 0,
        total_unique_customers: 0,
    };

    // MRR = sum of active subscription amounts
    const mrr = (activeSubscriptions ?? []).reduce((sum: number, p: any) => sum + (p.amount_paid ?? 0), 0);
    const restaurantsWithPacks = new Set((activeSubscriptions ?? []).map((p: any) => p.restaurant_id)).size;
    const packAdoptionRate = metrics.total_restaurants > 0
        ? Math.round((restaurantsWithPacks / metrics.total_restaurants) * 100)
        : 0;

    return c.json({
        restaurants: {
            total: metrics.total_restaurants,
            active: metrics.active_restaurants,
            pending: metrics.total_restaurants - metrics.active_restaurants,
            newThisMonth: newRestaurantsThisMonth ?? 0,
        },
        users: {
            total: totalUsers || 0,
            customers: countClients || 0,
            merchants: countMerchants || 0,
            drivers: countLivreurs || 0,
        },
        metrics: {
            gmv: metrics.total_gmv,
            totalOrders: metrics.total_orders,
            totalCustomers: metrics.total_unique_customers,
            avgOrderValue: metrics.total_orders > 0 ? Math.round(metrics.total_gmv / metrics.total_orders) : 0,
        },
        saas: {
            mrr,
            restaurantsWithPacks,
            packAdoptionRate,
            activeSubscriptions: (activeSubscriptions ?? []).length,
        },
        aiUsage: {
            todayCalls: aiCallsToday ?? 0,
            monthCalls: aiCallsMonth ?? 0,
        },
        recentActivity: { newRestaurants },
    });
});

adminRoutes.get("/stats/segments", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();

    const [currentOrdersRes, prevOrdersRes, packsRes] = await Promise.all([
        supabase.from("orders").select("restaurant_id, total").not("status", "eq", "cancelled").gte("created_at", monthStart).limit(10000),
        supabase.from("orders").select("restaurant_id, total").not("status", "eq", "cancelled").gte("created_at", prevMonthStart).lt("created_at", monthStart).limit(10000),
        supabase.from("marketplace_purchases").select("restaurant_id, amount_paid").eq("status", "active").limit(5000),
    ]);

    // Aggregate GMV per restaurant for current month
    const currentGmv: Record<string, number> = {};
    for (const o of currentOrdersRes.data ?? []) {
        currentGmv[(o as any).restaurant_id] = (currentGmv[(o as any).restaurant_id] ?? 0) + ((o as any).total ?? 0);
    }
    // Aggregate GMV per restaurant for previous month
    const prevGmv: Record<string, number> = {};
    for (const o of prevOrdersRes.data ?? []) {
        prevGmv[(o as any).restaurant_id] = (prevGmv[(o as any).restaurant_id] ?? 0) + ((o as any).total ?? 0);
    }
    // Active pack revenue per restaurant
    const packRevenue: Record<string, number> = {};
    for (const p of packsRes.data ?? []) {
        packRevenue[(p as any).restaurant_id] = (packRevenue[(p as any).restaurant_id] ?? 0) + ((p as any).amount_paid ?? 0);
    }

    // Classify restaurants into segments by current-month GMV
    type SegmentKey = "Casual (Segment A)" | "Croissance (Segment B)" | "Établis (Segment C)" | "Débutants (Segment D)";
    const classifySegment = (gmv: number): SegmentKey => {
        if (gmv >= 20_000_000) return "Établis (Segment C)";
        if (gmv >= 5_000_000) return "Croissance (Segment B)";
        if (gmv >= 100_000) return "Casual (Segment A)";
        return "Débutants (Segment D)";
    };

    type SegmentAccumulator = { gmvValues: number[]; prevGmvValues: number[]; packRevenues: number[] };
    const segmentData: Record<SegmentKey, SegmentAccumulator> = {
        "Établis (Segment C)": { gmvValues: [], prevGmvValues: [], packRevenues: [] },
        "Croissance (Segment B)": { gmvValues: [], prevGmvValues: [], packRevenues: [] },
        "Casual (Segment A)": { gmvValues: [], prevGmvValues: [], packRevenues: [] },
        "Débutants (Segment D)": { gmvValues: [], prevGmvValues: [], packRevenues: [] },
    };

    for (const [restaurantId, gmv] of Object.entries(currentGmv)) {
        const seg = classifySegment(gmv);
        segmentData[seg].gmvValues.push(gmv);
        segmentData[seg].prevGmvValues.push(prevGmv[restaurantId] ?? 0);
        segmentData[seg].packRevenues.push(packRevenue[restaurantId] ?? 0);
    }

    const segments = (Object.entries(segmentData) as [SegmentKey, SegmentAccumulator][])
        .map(([name, data]) => {
            const count = data.gmvValues.length;
            if (count === 0) return null;
            const avgGmv = Math.round(data.gmvValues.reduce((s, v) => s + v, 0) / count);
            const avgPrevGmv = Math.round(data.prevGmvValues.reduce((s, v) => s + v, 0) / count);
            const avgCommission = Math.round(avgGmv * 0.05);
            const ltv = avgGmv * 12;
            const growthRate = avgPrevGmv > 0
                ? Math.round(((avgGmv - avgPrevGmv) / avgPrevGmv) * 100)
                : 0;
            const boostingCount = data.packRevenues.filter(r => r > 0).length;
            const boostAdoptionRate = Math.round((boostingCount / count) * 100);
            // Churn proxy: restaurants whose GMV dropped >80% vs previous month
            const churningCount = data.gmvValues.filter((gmv, i) => {
                const prev = data.prevGmvValues[i];
                return prev > 0 && gmv < prev * 0.2;
            }).length;
            const churnRate = Math.round((churningCount / count) * 100);
            return { name, count, avgGmv, avgCommission, churnRate, ltv, growthRate, boostAdoptionRate };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.avgGmv - a.avgGmv);

    return c.json({ data: segments });
});

adminRoutes.get("/stats/charts", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const period = parseChartPeriod(c.req.query("period"));
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

    const now = new Date();
    const currentStart = addUtcDays(startOfUtcDay(now), -(days - 1));
    const previousStart = addUtcDays(currentStart, -days);

    const [
        ordersRes,
        restaurantsRes,
        aiUsageRes,
        subscriptionsRes,
    ] = await Promise.all([
        supabase.from("orders")
            .select("created_at, total, status")
            .gte("created_at", previousStart.toISOString())
            .order("created_at", { ascending: true })
            .limit(50_000),
        supabase.from("restaurants")
            .select("created_at")
            .gte("created_at", previousStart.toISOString())
            .order("created_at", { ascending: true })
            .limit(20_000),
        supabase.from("ai_usage_logs")
            .select("created_at")
            .gte("created_at", previousStart.toISOString())
            .order("created_at", { ascending: true })
            .limit(50_000),
        supabase.from("marketplace_purchases")
            .select("created_at, amount_paid, status")
            .gte("created_at", previousStart.toISOString())
            .order("created_at", { ascending: true })
            .limit(20_000),
    ]);

    if (ordersRes.error || restaurantsRes.error || aiUsageRes.error || subscriptionsRes.error) {
        console.error("Admin charts query error:", {
            orders: ordersRes.error,
            restaurants: restaurantsRes.error,
            aiUsage: aiUsageRes.error,
            subscriptions: subscriptionsRes.error,
        });
        return c.json({ error: "Erreur lors du chargement des graphiques" }, 500);
    }

    const bucketMap = new Map<string, {
        date: string;
        label: string;
        gmv: number;
        orders: number;
        newRestaurants: number;
        aiCalls: number;
        subscriptionRevenue: number;
    }>();

    for (let index = 0; index < days; index += 1) {
        const day = addUtcDays(currentStart, index);
        const key = toUtcDayKey(day);
        bucketMap.set(key, {
            date: key,
            label: toLabel(day),
            gmv: 0,
            orders: 0,
            newRestaurants: 0,
            aiCalls: 0,
            subscriptionRevenue: 0,
        });
    }

    const currentTotals = {
        gmv: 0,
        orders: 0,
        newRestaurants: 0,
        aiCalls: 0,
        subscriptionRevenue: 0,
    };
    const previousTotals = {
        gmv: 0,
        orders: 0,
        newRestaurants: 0,
        aiCalls: 0,
        subscriptionRevenue: 0,
    };

    for (const order of ordersRes.data ?? []) {
        const createdAt = new Date((order as { created_at: string }).created_at);
        const total = Number((order as { total?: number | null }).total ?? 0);
        const status = (order as { status?: string | null }).status ?? "";
        const isCancelled = CANCELLED_ORDER_STATUSES.has(status);
        const bucketKey = toUtcDayKey(startOfUtcDay(createdAt));
        const isCurrent = createdAt >= currentStart;

        if (isCurrent) {
            const bucket = bucketMap.get(bucketKey);
            if (bucket) {
                bucket.orders += 1;
                if (!isCancelled) bucket.gmv += total;
            }
            currentTotals.orders += 1;
            if (!isCancelled) currentTotals.gmv += total;
        } else {
            previousTotals.orders += 1;
            if (!isCancelled) previousTotals.gmv += total;
        }
    }

    for (const restaurant of restaurantsRes.data ?? []) {
        const createdAt = new Date((restaurant as { created_at: string }).created_at);
        const bucketKey = toUtcDayKey(startOfUtcDay(createdAt));
        if (createdAt >= currentStart) {
            const bucket = bucketMap.get(bucketKey);
            if (bucket) bucket.newRestaurants += 1;
            currentTotals.newRestaurants += 1;
        } else {
            previousTotals.newRestaurants += 1;
        }
    }

    for (const usage of aiUsageRes.data ?? []) {
        const createdAt = new Date((usage as { created_at: string }).created_at);
        const bucketKey = toUtcDayKey(startOfUtcDay(createdAt));
        if (createdAt >= currentStart) {
            const bucket = bucketMap.get(bucketKey);
            if (bucket) bucket.aiCalls += 1;
            currentTotals.aiCalls += 1;
        } else {
            previousTotals.aiCalls += 1;
        }
    }

    for (const subscription of subscriptionsRes.data ?? []) {
        const createdAt = new Date((subscription as { created_at: string }).created_at);
        const amount = Number((subscription as { amount_paid?: number | null }).amount_paid ?? 0);
        const status = (subscription as { status?: string | null }).status ?? "";
        if (status !== "active") continue;

        const bucketKey = toUtcDayKey(startOfUtcDay(createdAt));
        if (createdAt >= currentStart) {
            const bucket = bucketMap.get(bucketKey);
            if (bucket) bucket.subscriptionRevenue += amount;
            currentTotals.subscriptionRevenue += amount;
        } else {
            previousTotals.subscriptionRevenue += amount;
        }
    }

    const growth = (current: number, previous: number) => {
        if (previous <= 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    return c.json({
        period,
        generatedAt: now.toISOString(),
        series: Array.from(bucketMap.values()),
        summary: {
            gmv: {
                current: Math.round(currentTotals.gmv),
                previous: Math.round(previousTotals.gmv),
                growthRate: growth(currentTotals.gmv, previousTotals.gmv),
            },
            orders: {
                current: currentTotals.orders,
                previous: previousTotals.orders,
                growthRate: growth(currentTotals.orders, previousTotals.orders),
            },
            newRestaurants: {
                current: currentTotals.newRestaurants,
                previous: previousTotals.newRestaurants,
                growthRate: growth(currentTotals.newRestaurants, previousTotals.newRestaurants),
            },
            aiCalls: {
                current: currentTotals.aiCalls,
                previous: previousTotals.aiCalls,
                growthRate: growth(currentTotals.aiCalls, previousTotals.aiCalls),
            },
            subscriptionRevenue: {
                current: Math.round(currentTotals.subscriptionRevenue),
                previous: Math.round(previousTotals.subscriptionRevenue),
                growthRate: growth(currentTotals.subscriptionRevenue, previousTotals.subscriptionRevenue),
            },
        },
    });
});

// Mount the sub-routes
adminRoutes.route("/users", adminUsersRoutes);
adminRoutes.route("/restaurants", adminRestaurantsRoutes);
// adminRoutes.route("/drivers", adminDriversRoutes); // Decommissioned legacy global drivers
adminRoutes.route("/support", adminSupportRoutes);
adminRoutes.route("/billing", adminBillingRoutes);
adminRoutes.route("/moderation", adminModerationRoutes);
adminRoutes.route("/marketing", adminMarketingRoutes);
adminRoutes.route("/system", adminSystemRoutes);
adminRoutes.route("/backup", adminBackupRoutes);
adminRoutes.route("/orders", adminOrdersRoutes);
adminRoutes.route("/catalog", adminCatalogRoutes);
adminRoutes.route("/marketplace", adminMarketplaceRoutes);
adminRoutes.route("/ai-usage", adminAiUsageRoutes);
adminRoutes.route("/subscriptions", adminSubscriptionsRoutes);
adminRoutes.route("/onboarding", adminOnboardingRoutes);
adminRoutes.route("/social-monitor", adminSocialMonitorRoutes);
adminRoutes.route("/copilot", adminCopilotRoutes);
// For backward compatibility on /admin/audit
adminRoutes.route("/audit", adminSystemRoutes);
