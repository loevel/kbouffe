/**
 * GET /api/dashboard/menu
 *
 * Returns the full menu (categories + available products) for the
 * authenticated merchant's restaurant. Used by the server POS panel
 * to browse and select items when taking an order.
 *
 * Response: { categories: Category[], products: Product[] }
 */
import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

interface Category {
  id: string;
  name: string;
  sort_order: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_available: boolean;
  category_id: string | null;
  sort_order: number | null;
}

export async function GET() {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    // Fetch categories and products in parallel — both scoped to this restaurant
    const [categoriesResult, productsResult] = await Promise.all([
      ctx.supabase
        .from("categories")
        .select("id, name, sort_order")
        .eq("restaurant_id", ctx.restaurantId)
        .order("sort_order"),
      ctx.supabase
        .from("products")
        .select(
          "id, name, description, price, compare_at_price, image_url, is_available, category_id, sort_order"
        )
        .eq("restaurant_id", ctx.restaurantId)
        .order("sort_order"),
    ]);

    if (categoriesResult.error) {
      console.error("Menu categories query error:", categoriesResult.error);
      return apiError("Erreur lors de la récupération des catégories du menu");
    }

    if (productsResult.error) {
      console.error("Menu products query error:", productsResult.error);
      return apiError("Erreur lors de la récupération des produits du menu");
    }

    const categories = (categoriesResult.data as unknown as Category[]) ?? [];
    const products = (productsResult.data as unknown as Product[]) ?? [];

    return NextResponse.json({ categories, products });
  } catch (err) {
    console.error("GET /api/dashboard/menu error:", err);
    return apiError("Erreur serveur");
  }
}
