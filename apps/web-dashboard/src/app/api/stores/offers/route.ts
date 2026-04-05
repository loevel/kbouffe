import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stores/offers
 * Returns discounted products (compare_at_price > price) grouped by restaurant.
 *
 * Response shape:
 * {
 *   groups: {
 *     restaurantId: string
 *     restaurantName: string
 *     restaurantSlug: string
 *     logoUrl: string | null
 *     bannerUrl: string | null
 *     city: string
 *     rating: number | null
 *     deliveryFee: number | null
 *     products: {
 *       id: string
 *       name: string
 *       price: number
 *       compareAtPrice: number
 *       discountPct: number
 *       imageUrl: string | null
 *       description: string | null
 *     }[]
 *   }[]
 *   totalProducts: number
 * }
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch discounted products with their restaurant info
        const { data: rows, error } = await supabase
            .from("products")
            .select(`
                id, name, price, compare_at_price, image_url, description, restaurant_id,
                restaurants!inner(id, name, slug, logo_url, banner_url, city, rating, delivery_fee, is_published)
            `)
            .not("compare_at_price", "is", null)
            .filter("compare_at_price", "gt", 0)
            .eq("is_available", true)
            .order("compare_at_price", { ascending: false })
            .limit(200);

        if (error) {
            console.error("[GET /api/stores/offers] Supabase error:", error);
            return NextResponse.json({ error: "Erreur lors de la récupération des offres" }, { status: 500 });
        }

        // Filter: only published restaurants + genuine discount (compare_at_price > price)
        const validRows = (rows as any[]).filter(
            (r) =>
                r.restaurants?.is_published === true &&
                r.compare_at_price > r.price &&
                r.price > 0
        );

        // Group by restaurant (max 8 products each)
        const restaurantMap: Record<
            string,
            {
                restaurantId: string;
                restaurantName: string;
                restaurantSlug: string;
                logoUrl: string | null;
                bannerUrl: string | null;
                city: string;
                rating: number | null;
                deliveryFee: number | null;
                products: {
                    id: string;
                    name: string;
                    price: number;
                    compareAtPrice: number;
                    discountPct: number;
                    imageUrl: string | null;
                    description: string | null;
                }[];
                totalDiscount: number;
            }
        > = {};

        for (const row of validRows) {
            const rid = row.restaurant_id;
            if (!rid) continue;

            if (!restaurantMap[rid]) {
                const r = row.restaurants;
                restaurantMap[rid] = {
                    restaurantId: rid,
                    restaurantName: r.name,
                    restaurantSlug: r.slug,
                    logoUrl: r.logo_url,
                    bannerUrl: r.banner_url,
                    city: r.city,
                    rating: r.rating,
                    deliveryFee: r.delivery_fee,
                    products: [],
                    totalDiscount: 0,
                };
            }

            const group = restaurantMap[rid];
            if (group.products.length >= 8) continue;

            const discountPct = Math.round(
                ((row.compare_at_price - row.price) / row.compare_at_price) * 100
            );

            group.products.push({
                id: row.id,
                name: row.name,
                price: row.price,
                compareAtPrice: row.compare_at_price,
                discountPct,
                imageUrl: row.image_url,
                description: row.description,
            });

            group.totalDiscount += discountPct;
        }

        // Sort groups by avg discount descending
        const groups = Object.values(restaurantMap)
            .filter((g) => g.products.length > 0)
            .sort((a, b) => {
                const avgA = a.totalDiscount / a.products.length;
                const avgB = b.totalDiscount / b.products.length;
                return avgB - avgA;
            })
            .map(({ totalDiscount: _td, ...rest }) => rest);

        const totalProducts = groups.reduce((acc, g) => acc + g.products.length, 0);

        return NextResponse.json({ groups, totalProducts });
    } catch (err) {
        console.error("[GET /api/stores/offers]", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
