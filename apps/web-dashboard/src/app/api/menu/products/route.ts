import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * POST /api/menu/products
 * Create a new product for the authenticated merchant's restaurant.
 */
export async function POST(request: NextRequest) {
  const { ctx, error } = await withAuth();
  if (error) return error;

  const { restaurantId, supabase } = ctx;

  try {
    const body = await request.json();

    const { name, price, category_id, image_url, description } = body;

    if (!name?.trim()) {
      return apiError("Le nom du produit est requis", 400);
    }

    if (typeof price !== "number" || price < 0) {
      return apiError("Le prix doit etre un nombre positif", 400);
    }

    // If category_id is provided, verify it belongs to this restaurant
    if (category_id) {
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", category_id)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (catError || !cat) {
        return apiError("Categorie non trouvee ou non autorisee", 400);
      }
    }

    // Get max sort_order for ordering
    const { data: lastProduct } = await supabase
      .from("products")
      .select("sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = ((lastProduct as any)?.sort_order ?? 0) + 1;

    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        restaurant_id: restaurantId,
        name: name.trim(),
        description: description?.trim() || null,
        price,
        category_id: category_id || null,
        image_url: image_url || null,
        is_available: true,
        sort_order: nextSortOrder,
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting product:", insertError);
      return apiError("Erreur lors de la creation du produit", 500);
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/menu/products error:", err);
    return apiError(err.message || "Erreur serveur", 500);
  }
}

/**
 * GET /api/menu/products
 * List all products for the authenticated merchant's restaurant.
 */
export async function GET() {
  const { ctx, error } = await withAuth();
  if (error) return error;

  const { restaurantId, supabase } = ctx;

  try {
    const { data: products, error: queryError } = await supabase
      .from("products")
      .select("*, categories(id, name)")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true });

    if (queryError) {
      console.error("Error fetching products:", queryError);
      return apiError("Erreur lors de la recuperation des produits", 500);
    }

    return NextResponse.json({ success: true, products: products ?? [] });
  } catch (err: any) {
    console.error("GET /api/menu/products error:", err);
    return apiError(err.message || "Erreur serveur", 500);
  }
}
