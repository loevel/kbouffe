import { NextResponse } from "next/server";

/**
 * GET /api/gallery/packs
 * Returns all available gallery packs from marketplace
 * Public endpoint - no auth required
 */
export async function GET() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: packs, error: packsError } = await (supabase as any)
      .from("marketplace_services")
      .select("id, name, slug, description, price, duration_days, features, icon")
      .in("slug", [
        "gallery_basic",
        "gallery_extended",
        "gallery_premium",
      ])
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (packsError) {
      console.error("Error fetching gallery packs:", packsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des packs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      packs: packs || [],
    });
  } catch (err) {
    console.error("GET /api/gallery/packs error:", err);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
