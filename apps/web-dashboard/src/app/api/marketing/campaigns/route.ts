/**
 * GET  /api/marketing/campaigns — List ad campaigns for the restaurant
 * POST /api/marketing/campaigns — Submit a new ad campaign
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import type { AdCampaign } from "@/lib/supabase/types";

// Package prices in FCFA
const PACKAGE_PRICES = { basic: 15000, premium: 35000, elite: 75000 };
const PACKAGE_DAYS = { basic: 7, premium: 14, elite: 30 };

export async function GET(_request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const { data, error } = await (ctx.supabase as any)
            .from("ad_campaigns")
            .select("*")
            .eq("restaurant_id", ctx.restaurantId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Campaigns query error:", error);
            return apiError("Erreur lors de la récupération des campagnes");
        }

        // Check if there is an active campaign
        const campaigns = (data ?? []) as AdCampaign[];
        const now = new Date().toISOString();
        const activeCampaign = campaigns.find(
            (c) => c.status === "active" && c.starts_at <= now && c.ends_at >= now
        ) ?? null;

        return NextResponse.json({
            campaigns,
            activeCampaign,
            total: campaigns.length,
        });
    } catch (error) {
        console.error("GET /api/marketing/campaigns error:", error);
        return apiError("Erreur serveur");
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const body = await request.json();

        if (!["basic", "premium", "elite"].includes(body.package)) {
            return apiError("Forfait invalide", 400);
        }

        const pkg = body.package as keyof typeof PACKAGE_PRICES;
        const durationDays = PACKAGE_DAYS[pkg];
        const budget = PACKAGE_PRICES[pkg];

        const startsAt = body.starts_at ? new Date(body.starts_at) : new Date();
        const endsAt = new Date(startsAt);
        endsAt.setDate(endsAt.getDate() + durationDays);

        // Validate push message if push is requested
        const includePush = Boolean(body.include_push);
        if (includePush && !body.push_message?.trim()) {
            return apiError("Le message de la notification push est requis", 400);
        }

        const campaignData = {
            id: crypto.randomUUID(),
            restaurant_id: ctx.restaurantId,
            package: pkg,
            status: "pending" as const,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            budget,
            include_push: includePush,
            push_sent: false,
            push_message: includePush ? body.push_message.trim() : null,
            impressions: 0,
            clicks: 0,
            notes: body.notes ?? null,
            created_at: new Date().toISOString(),
        };

        const { data, error } = await (ctx.supabase as any)
            .from("ad_campaigns")
            .insert(campaignData as any)
            .select()
            .single();

        if (error) {
            console.error("Campaign create error:", error);
            return apiError("Erreur lors de la création de la campagne");
        }

        return NextResponse.json({ campaign: data }, { status: 201 });
    } catch (error) {
        console.error("POST /api/marketing/campaigns error:", error);
        return apiError("Erreur serveur");
    }
}
