import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * POST /api/gallery/photos
 * Adds a new photo to the gallery
 */
export async function POST(request: NextRequest) {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { photo_url, alt_text, display_order } = body;

    if (!photo_url) {
      return apiError("photo_url est requis", 400);
    }

    // Get current gallery config
    const { data: gallery, error: galleryError } = await (ctx.supabase as any)
      .from("restaurant_galleries")
      .select("max_photos")
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (galleryError || !gallery) {
      console.error("Error fetching gallery config:", galleryError);
      return apiError("Configuration de galerie non trouvée");
    }

    // Count current photos
    const { count, error: countError } = await (ctx.supabase as any)
      .from("restaurant_photos")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", ctx.restaurantId);

    if (countError) {
      console.error("Error counting photos:", countError);
      return apiError("Erreur lors de la vérification du quota");
    }

    // Check if quota is reached
    if ((count || 0) >= gallery.max_photos) {
      return apiError("Quota de photos atteint", 400);
    }

    // Calculate display_order if not provided
    let finalDisplayOrder = display_order;
    if (finalDisplayOrder === undefined) {
      const { data: photos } = await (ctx.supabase as any)
        .from("restaurant_photos")
        .select("display_order")
        .eq("restaurant_id", ctx.restaurantId)
        .order("display_order", { ascending: false })
        .limit(1);

      finalDisplayOrder = (photos?.[0]?.display_order ?? -1) + 1;
    }

    // Insert photo
    const { data: photo, error: insertError } = await (ctx.supabase as any)
      .from("restaurant_photos")
      .insert({
        restaurant_id: ctx.restaurantId,
        photo_url,
        alt_text: alt_text || "",
        display_order: finalDisplayOrder,
        is_featured: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting photo:", insertError);
      return apiError("Erreur lors de l'ajout de la photo");
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error("POST /api/gallery/photos error:", err);
    return apiError("Erreur interne");
  }
}
