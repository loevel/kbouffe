/**
 * GET /api/ai/usage
 * Returns AI usage summary for the authenticated restaurant (today's consumption).
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { getAiUsageSummary } from "@/lib/ai-rate-limiter";

export async function GET() {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    try {
        const summary = await getAiUsageSummary(supabase, restaurantId);
        return NextResponse.json({ usage: summary });
    } catch (error) {
        console.error("[api/ai/usage] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
