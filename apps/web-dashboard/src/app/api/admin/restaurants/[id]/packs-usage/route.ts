/**
 * GET /api/admin/restaurants/[id]/packs-usage
 * Returns marketplace packs purchased + AI usage for a given restaurant.
 * Admin-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";

function adminDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

const DAILY_LIMITS: Record<string, number> = {
    ai_photo: 10,
    ai_analytics: 20,
    ai_social: 30,
    ai_calendar: 5,
    ai_ocr: 15,
    ai_copywriter: 50,
};

const FEATURE_LABELS: Record<string, string> = {
    ai_photo:      "Photos IA",
    ai_analytics:  "Conseiller IA",
    ai_social:     "Social Publisher",
    ai_calendar:   "Calendrier Contenu",
    ai_ocr:        "Scanner Menu",
    ai_copywriter: "Copywriter IA",
};

const COST_PER_CALL: Record<string, number> = {
    ai_photo: 0.04,
    ai_analytics: 0.002,
    ai_social: 0.002,
    ai_calendar: 0.003,
    ai_ocr: 0.003,
    ai_copywriter: 0.001,
};
const USD_TO_FCFA = 620;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error: authError } = await withAdmin();
    if (authError) return authError;

    const { id: restaurantId } = await params;
    const db = adminDb() as any;
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [
        { data: purchases, error: purchasesError },
        { data: todayLogs },
        { data: monthLogs },
    ] = await Promise.all([
        db.from("marketplace_purchases")
            .select(`
                id, status, amount_paid, starts_at, expires_at, notes, created_at,
                service:service_id (id, name, slug, category, icon, price)
            `)
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false }),
        db.from("ai_usage_logs")
            .select("feature")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", todayStart),
        db.from("ai_usage_logs")
            .select("feature")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", monthStart),
    ]);

    if (purchasesError) {
        console.error("[packs-usage]", purchasesError);
        return apiError("Erreur lors de la récupération des packs");
    }

    // Build AI usage by feature
    const todayByFeature: Record<string, number> = {};
    const monthByFeature: Record<string, number> = {};

    for (const log of todayLogs ?? []) {
        const f = (log as any).feature as string;
        todayByFeature[f] = (todayByFeature[f] ?? 0) + 1;
    }
    for (const log of monthLogs ?? []) {
        const f = (log as any).feature as string;
        monthByFeature[f] = (monthByFeature[f] ?? 0) + 1;
    }

    const aiUsage = Object.entries(DAILY_LIMITS).map(([feature, limit]) => ({
        feature,
        label: FEATURE_LABELS[feature] ?? feature,
        limit,
        today: todayByFeature[feature] ?? 0,
        month: monthByFeature[feature] ?? 0,
        quotaPct: Math.min(100, Math.round(((todayByFeature[feature] ?? 0) / limit) * 100)),
        estimatedCostFCFA: Math.round((COST_PER_CALL[feature] ?? 0.002) * (monthByFeature[feature] ?? 0) * USD_TO_FCFA),
    }));

    const totalMonthCalls = Object.values(monthByFeature).reduce((s, v) => s + v, 0);
    const totalCostFCFA = aiUsage.reduce((s, u) => s + u.estimatedCostFCFA, 0);

    return NextResponse.json({
        packs: purchases ?? [],
        aiUsage,
        summary: {
            activePacks: (purchases ?? []).filter((p: any) => p.status === "active").length,
            totalPacks: (purchases ?? []).length,
            todayCalls: (todayLogs ?? []).length,
            monthCalls: totalMonthCalls,
            totalCostFCFA,
        },
    });
}
