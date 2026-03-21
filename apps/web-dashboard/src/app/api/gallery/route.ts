import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * GET /api/gallery
 * Returns gallery config and photos for the authenticated merchant's restaurant
 */
export async function GET() {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    // Fetch gallery config
    const { data: gallery, error: galleryError } = await (ctx.supabase as any)
      .from("restaurant_galleries")
      .select("max_photos")
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (galleryError) {
      console.error("Error fetching gallery:", galleryError);
      return apiError("Erreur lors de la récupération de la galerie");
    }

    // Fetch photos
    const { data: photos, error: photosError } = await (ctx.supabase as any)
      .from("restaurant_photos")
      .select("id, photo_url, alt_text, display_order, is_featured")
      .eq("restaurant_id", ctx.restaurantId)
      .order("display_order", { ascending: true });

    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return apiError("Erreur lors de la récupération des photos");
    }

    return NextResponse.json({
      gallery: gallery || { max_photos: 5 },
      photos: photos || [],
    });
  } catch (err) {
    console.error("GET /api/gallery error:", err);
    return apiError("Erreur interne");
  }
}
