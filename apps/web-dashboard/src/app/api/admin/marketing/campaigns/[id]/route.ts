/**
 * GET  /api/admin/marketing/campaigns/[id]/stats — Get campaign stats
 * POST /api/admin/marketing/campaigns/[id]/status — Update campaign status
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

function serviceDb() {
    return require("@supabase/supabase-js").createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const db = serviceDb() as any;
    const { id } = params;

    // Get campaign details
    const { data: campaign, error: campaignError } = await db
        .from("marketing_campaigns")
        .select("*")
        .eq("id", id)
        .single();

    if (campaignError || !campaign) {
        return apiError("Campagne non trouvée", 404);
    }

    // Return stats
    return NextResponse.json({
        campaign: {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            startsAt: campaign.starts_at,
            endsAt: campaign.ends_at,
        },
        stats: {
            impressions: campaign.impressions ?? 0,
            clicks: campaign.clicks ?? 0,
            ctr: campaign.ctr ?? 0,
            reach: campaign.reach ?? 0,
            spend: campaign.spend ?? 0,
            budget: campaign.budget,
            budgetUsedPct: campaign.budget > 0 ? Math.round((campaign.spend / campaign.budget) * 100) : 0,
            conversions: campaign.conversions ?? 0,
            roi: campaign.spend > 0 ? Math.round((campaign.conversions / campaign.spend) * 100) : 0,
        },
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const db = serviceDb() as any;
    const { id } = params;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Body JSON invalide", 400);
    }

    const { status } = body;

    if (!["pending", "active", "paused", "ended"].includes(status)) {
        return apiError("Statut invalide", 400);
    }

    // Update campaign status
    const { error } = await db
        .from("marketing_campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error("[POST /api/admin/marketing/campaigns/[id]/status]", error);
        return apiError("Erreur lors de la mise à jour du statut");
    }

    return NextResponse.json({ success: true });
}
