import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * GET /api/gallery/pack
 * Returns the current gallery pack for the authenticated merchant
 */
export async function GET() {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    // Fetch restaurant's gallery config with pack info
    const { data: gallery, error: galleryError } = await (ctx.supabase as any)
      .from("restaurant_galleries")
      .select(`
        max_photos,
        is_pack_active,
        pack_id,
        pack:pack_id (
          id,
          name,
          slug,
          description,
          price,
          duration_days,
          features
        )
      `)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (galleryError) {
      console.error("Error fetching gallery pack:", galleryError);
      return apiError("Erreur lors de la récupération du pack galerie");
    }

    // Check if restaurant has an active pack purchase
    const { data: purchase } = await (ctx.supabase as any)
      .from("marketplace_purchases")
      .select("id, status, expires_at")
      .eq("restaurant_id", ctx.restaurantId)
      .eq("service_id", gallery?.pack_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      gallery: {
        max_photos: gallery?.max_photos ?? 5,
        is_pack_active: gallery?.is_pack_active ?? false,
        current_pack: gallery?.pack ?? null,
        active_purchase: purchase ?? null,
      },
    });
  } catch (err) {
    console.error("GET /api/gallery/pack error:", err);
    return apiError("Erreur interne");
  }
}
