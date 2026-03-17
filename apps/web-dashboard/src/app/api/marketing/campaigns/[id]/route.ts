/**
 * PATCH /api/marketing/campaigns/[id] — Cancel a campaign
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import type { AdCampaign } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;
        const { id } = await params;

        const body = await request.json();

        // Only allow cancelling (status → cancelled) for now
        if (body.status !== "cancelled") {
            return apiError("Seule l'annulation est autorisée depuis le dashboard", 400);
        }

        // Ensure the campaign belongs to this restaurant
        const { data: existingRaw } = await ctx.supabase
            .from("ad_campaigns")
            .select("id, status")
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .single();

        const existing = existingRaw as Pick<AdCampaign, "id" | "status"> | null;

        if (!existing) return apiError("Campagne introuvable", 404);
        if (existing.status === "completed") return apiError("Impossible d'annuler une campagne terminée", 400);
        if (existing.status === "cancelled") return apiError("Campagne déjà annulée", 400);

        const { data, error } = await (ctx.supabase.from("ad_campaigns") as any)
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Campaign cancel error:", error);
            return apiError("Erreur lors de l'annulation de la campagne");
        }

        return NextResponse.json({ campaign: data });
    } catch (error) {
        console.error("PATCH /api/marketing/campaigns/[id] error:", error);
        return apiError("Erreur serveur");
    }
}
