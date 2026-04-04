import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stores
 * Liste publique des restaurants actifs (page explore / annuaire)
 * Query params:
 *   ?q       — search name ou city (optionnel)
 *   ?cuisine — filtre par cuisine type (optionnel)
 *   ?city    — filtre par ville (optionnel)
 *   ?sort    — "rating" | "orders" | "newest" (défaut: sponsored d'abord puis rating)
 *   ?limit   — max résultats (défaut: 60)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim() ?? "";
        const cuisine = searchParams.get("cuisine")?.trim() ?? "";
        const city = searchParams.get("city")?.trim() ?? "";
        const mode = searchParams.get("mode")?.trim() ?? "delivery";
        const sort = searchParams.get("sort") ?? "recommended";
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "60"), 100);

        const supabase = await createClient();

        // Build Supabase query
        let query = supabase
            .from("restaurants")
            .select(`
                id, name, slug, description, logo_url, banner_url, address, city,
                cuisine_type, price_range, rating, review_count, order_count,
                is_verified, is_premium, is_sponsored, has_dine_in, has_reservations
            `)
            .eq("is_published", true);

        if (cuisine) {
            query = query.eq("cuisine_type", cuisine);
        }
        if (city) {
            query = query.ilike("city", `%${city}%`);
        }
        if (mode === "reservation") {
            query = query.eq("has_reservations", true);
        }
        if (q) {
            // Search products (name + description) to find matching restaurants
            const { data: prodRows } = await supabase
                .from("products")
                .select("restaurant_id")
                .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
                .eq("is_available", true)
                .limit(100);

            const productRestaurantIds = [
                ...new Set((prodRows ?? []).map((p: any) => p.restaurant_id).filter(Boolean))
            ];

            if (productRestaurantIds.length > 0) {
                // Restaurants matching by name/city/cuisine OR that contain a matching product
                query = query.or(
                    `name.ilike.%${q}%,city.ilike.%${q}%,cuisine_type.ilike.%${q}%,id.in.(${productRestaurantIds.join(",")})`
                );
            } else {
                query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,cuisine_type.ilike.%${q}%`);
            }
        }

        const { data: rows, error } = await query
            .order("rating", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("[GET /api/stores] Supabase error:", error);
            return NextResponse.json({ error: "Erreur lors de la récupération des restaurants" }, { status: 500 });
        }

        let results = (rows as any[]) || [];

        // Client-side sort overrides
        if (sort === "rating") {
            results = results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        } else if (sort === "orders") {
            results = results.sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0));
        } else {
            // "recommended": sponsored first, then premium, then by rating
            results = results.sort((a, b) => {
                if (a.is_sponsored && !b.is_sponsored) return -1;
                if (!a.is_sponsored && b.is_sponsored) return 1;
                if (a.is_premium && !b.is_premium) return -1;
                if (!a.is_premium && b.is_premium) return 1;
                return (b.rating ?? 0) - (a.rating ?? 0);
            });
        }

        // When searching by keyword, fetch matching products for each restaurant in results
        let matchedProductsByRestaurant: Record<string, { id: string; name: string; price: number; image_url: string | null }[]> = {};
        if (q && results.length > 0) {
            const restaurantIds = results.map((r: any) => r.id);
            const { data: matchedProds } = await supabase
                .from("products")
                .select("id, name, price, image_url, restaurant_id")
                .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
                .eq("is_available", true)
                .in("restaurant_id", restaurantIds)
                .limit(50);

            for (const p of (matchedProds ?? [])) {
                if (!matchedProductsByRestaurant[p.restaurant_id]) {
                    matchedProductsByRestaurant[p.restaurant_id] = [];
                }
                matchedProductsByRestaurant[p.restaurant_id].push({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    image_url: p.image_url,
                });
            }
        }

        // Map back to expected PascalCase/CamelCase fields if needed (optional but good for compatibility)
        const mappedResults = results.map(row => ({
            ...row,
            logoUrl: row.logo_url,
            coverUrl: row.banner_url,
            cuisineType: row.cuisine_type,
            priceRange: row.price_range,
            reviewCount: row.review_count,
            orderCount: row.order_count,
            isVerified: row.is_verified,
            isPremium: row.is_premium,
            isSponsored: row.is_sponsored,
            hasDineIn: row.has_dine_in,
            hasReservations: row.has_reservations,
            matchedProducts: matchedProductsByRestaurant[row.id] ?? [],
        }));

        return NextResponse.json({ restaurants: mappedResults, total: mappedResults.length });
    } catch (error) {
        console.error("[GET /api/stores]", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

