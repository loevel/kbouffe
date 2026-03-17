/**
 * GET /menu/:slug — Public menu for a restaurant (categories + products)
 *
 * Returns the full menu grouped by categories for the restaurant matching the slug.
 * This is the primary endpoint the mobile app uses to display a restaurant's menu.
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const menuRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /menu/:slug
 *
 * Returns categories and products for a restaurant.
 * Fetches everything from Supabase.
 */
menuRoutes.get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const supabase = c.var.supabase;

    // Resolve restaurant by slug
    const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select(`
            id,
            name,
            slug,
            logo_url,
            cover_url,
            cuisine_type,
            price_range,
            has_dine_in,
            is_active
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

    if (restaurantError || !restaurant) {
        return c.json({ error: "Restaurant non trouvé" }, 404);
    }

    // Fetch categories and products in parallel from Supabase
    const [catRes, prodRes] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name, description, sort_order")
            .eq("restaurant_id", restaurant.id)
            .order("sort_order"),
        supabase
            .from("products")
            .select("id, name, description, price, compare_at_price, image_url, is_available, category_id, sort_order")
            .eq("restaurant_id", restaurant.id)
            .eq("is_available", true)
            .order("sort_order"),
    ]);

    const categories = catRes.data || [];
    const products = prodRes.data || [];

    // Map keys to match existing frontend expectations if necessary (cameraCase vs snake_case)
    // The mobile client seems to expect camelCase for some fields based on mapRestaurant
    const mappedRestaurant = {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logoUrl: restaurant.logo_url,
        coverUrl: restaurant.cover_url,
        cuisineType: restaurant.cuisine_type,
        priceRange: restaurant.price_range,
        hasDineIn: restaurant.has_dine_in,
    };

    // Cache publicly: 1 min browser, 5 mins edge limit
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");

    return c.json({
        restaurant: mappedRestaurant,
        categories,
        products,
        _note: "Menu data source: Supabase (unified persistence)",
    });
});

