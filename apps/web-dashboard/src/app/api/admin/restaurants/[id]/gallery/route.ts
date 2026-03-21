import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

/**
 * PATCH /api/admin/restaurants/[id]/gallery
 * Admin endpoint to update max_photos for any restaurant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ctx, error } = await withAdmin();
  if (error) return error;

  try {
    const { id: restaurantId } = await params;
    const body = await request.json();
    const { max_photos } = body;

    if (max_photos === undefined) {
      return apiError("max_photos est requis", 400);
    }

    if (typeof max_photos !== "number" || max_photos < 1) {
      return apiError("max_photos doit être un nombre >= 1", 400);
    }

    // Update gallery config
    const { data: gallery, error: updateError } = await (ctx.supabase as any)
      .from("restaurant_galleries")
      .update({ max_photos })
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating gallery:", updateError);
      return apiError("Erreur lors de la mise à jour de la galerie");
    }

    return NextResponse.json(gallery);
  } catch (err) {
    console.error("PATCH /api/admin/restaurants/[id]/gallery error:", err);
    return apiError("Erreur interne");
  }
}
