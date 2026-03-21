import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * DELETE /api/gallery/photos/[id]
 * Deletes a photo from the gallery
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    const { id } = await params;

    // Verify the photo belongs to the restaurant
    const { data: photo, error: fetchError } = await (ctx.supabase as any)
      .from("restaurant_photos")
      .select("restaurant_id")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return apiError("Photo non trouvée", 404);
    }

    if (photo.restaurant_id !== ctx.restaurantId) {
      return apiError("Accès refusé", 403);
    }

    // Delete the photo
    const { error: deleteError } = await (ctx.supabase as any)
      .from("restaurant_photos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting photo:", deleteError);
      return apiError("Erreur lors de la suppression");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/gallery/photos/[id] error:", err);
    return apiError("Erreur interne");
  }
}

/**
 * PATCH /api/gallery/photos/[id]
 * Updates a photo (alt_text, display_order, is_featured)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify the photo belongs to the restaurant
    const { data: photo, error: fetchError } = await (ctx.supabase as any)
      .from("restaurant_photos")
      .select("restaurant_id")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return apiError("Photo non trouvée", 404);
    }

    if (photo.restaurant_id !== ctx.restaurantId) {
      return apiError("Accès refusé", 403);
    }

    // Build update data (only allow certain fields)
    const updateData: Record<string, any> = {};
    if (body.alt_text !== undefined) updateData.alt_text = body.alt_text;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;

    if (Object.keys(updateData).length === 0) {
      return apiError("Aucun champ à mettre à jour", 400);
    }

    // Update the photo
    const { data: updated, error: updateError } = await (ctx.supabase as any)
      .from("restaurant_photos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating photo:", updateError);
      return apiError("Erreur lors de la mise à jour");
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/gallery/photos/[id] error:", err);
    return apiError("Erreur interne");
  }
}
