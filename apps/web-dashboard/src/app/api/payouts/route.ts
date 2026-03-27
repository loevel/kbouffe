/**
 * GET /api/payouts — List payouts for the merchant's restaurant
 */
import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const { data, error } = await ctx.supabase
      .from("payouts")
      .select("*")
      .eq("restaurant_id", ctx.restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Payouts query error:", error);
      return apiError("Erreur lors de la récupération des versements");
    }

    return NextResponse.json({ payouts: data ?? [] });
  } catch (error) {
    console.error("GET /api/payouts error:", error);
    return apiError("Erreur serveur");
  }
}
