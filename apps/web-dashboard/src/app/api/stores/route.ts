import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { termeDeRecherche } from "@/lib/search/normalize";

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
                is_verified, is_premium, is_sponsored, has_dine_in, has_reservations,
                delivery_fee, estimated_delivery_time
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
        // La recherche se fait sur les colonnes `recherche_normalisee`, générées
        // en base sans accents ni majuscules. Avant, le `ilike` portait sur les
        // colonnes brutes : « ndolé » remontait 58 restaurants, « ndole » un
        // seul — or c'est la seconde forme qu'on tape sur un clavier de
        // téléphone. Le terme est normalisé ici avec les mêmes règles.
        const terme = termeDeRecherche(q);

        if (terme) {
            // Les restaurants dont un plat correspond. La limite est là pour
            // borner la requête, mais elle tronquait en silence : avec plus de
            // mille produits, un terme courant la dépasse et des restaurants
            // disparaissaient des résultats sans que rien ne le signale.
            const PLAFOND_PRODUITS = 2000;
            const { data: prodRows } = await supabase
                .from("products")
                .select("restaurant_id")
                .ilike("recherche_normalisee", `%${terme}%`)
                .eq("is_available", true)
                .limit(PLAFOND_PRODUITS);

            if ((prodRows?.length ?? 0) >= PLAFOND_PRODUITS) {
                console.warn(
                    `[GET /api/stores] « ${terme} » atteint le plafond de ${PLAFOND_PRODUITS} produits : des restaurants peuvent manquer.`,
                );
            }

            const productRestaurantIds = [
                ...new Set((prodRows ?? []).map((p: any) => p.restaurant_id).filter(Boolean))
            ];

            query = productRestaurantIds.length > 0
                ? query.or(
                    `recherche_normalisee.ilike.%${terme}%,id.in.(${productRestaurantIds.join(",")})`
                  )
                : query.ilike("recherche_normalisee", `%${terme}%`);
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
        if (terme && results.length > 0) {
            const restaurantIds = results.map((r: any) => r.id);
            // Même colonne normalisée que la recherche principale : sinon la
            // carte d'un restaurant trouvé par « ndole » n'affichait aucun plat
            // correspondant, le second filtre étant resté sensible aux accents.
            const { data: matchedProds } = await supabase
                .from("products")
                .select("id, name, price, image_url, restaurant_id")
                .ilike("recherche_normalisee", `%${terme}%`)
                .eq("is_available", true)
                .in("restaurant_id", restaurantIds)
                .limit(200);

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
            // Tarif et délai réels du restaurant : les cartes qui consomment
            // cette route annonçaient « Livraison dès 1 500 FCFA » et un délai
            // deviné à partir du nombre de commandes, deux chiffres inventés.
            deliveryFee: row.delivery_fee ?? null,
            estimatedDeliveryMinutes: row.estimated_delivery_time ?? null,
            matchedProducts: matchedProductsByRestaurant[row.id] ?? [],
        }));

        return NextResponse.json({ restaurants: mappedResults, total: mappedResults.length });
    } catch (error) {
        console.error("[GET /api/stores]", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

