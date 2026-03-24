/**
 * GET /api/restaurant/badges — Restaurant badges
 */
import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const { data: badges, error } = await ctx.supabase
            .from("restaurant_badges")
            .select("id, badge_type, badge_name, earned_at, metadata")
            .eq("restaurant_id", ctx.restaurantId)
            .order("earned_at", { ascending: true });

        if (error) {
            console.error("Badges query error:", error);
            return apiError("Erreur lors du chargement des badges");
        }

        return NextResponse.json({ badges: badges ?? [] });
    } catch (error) {
        console.error("GET /api/restaurant/badges error:", error);
        return apiError("Erreur serveur");
    }
}
