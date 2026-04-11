import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/homepage-sections
 * Retourne les sections actives avec les restaurants résolus.
 * Query params:
 *   ?cuisine  — filtre cuisine
 *   ?city     — filtre par ville (ex: "Douala")
 *   ?lat&lng  — filtre par position GPS (en degrés décimaux)
 *   ?radius   — rayon en km pour le filtre GPS (défaut: 15)
 */

const RESTAURANT_SELECT = `
    id, name, slug, logo_url, banner_url, city,
    cuisine_type, price_range, rating, review_count, order_count,
    is_verified, is_premium, is_sponsored, has_dine_in
`;

function mapRestaurant(row: any) {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        logoUrl: row.logo_url,
        coverUrl: row.banner_url,
        city: row.city,
        cuisineType: row.cuisine_type,
        priceRange: row.price_range,
        rating: row.rating,
        reviewCount: row.review_count,
        orderCount: row.order_count,
        isVerified: row.is_verified,
        isPremium: row.is_premium,
        isSponsored: row.is_sponsored,
        hasDineIn: row.has_dine_in,
    };
}

async function resolveSection(
    supabase: any,
    section: any,
    cuisine: string,
    city: string,
    nearbyIds: string[] | null   // null = no GPS filter, [] = GPS active but no results
): Promise<any[]> {
    try {
        if (section.type === "manual" && section.restaurant_ids?.length) {
            let ids = section.restaurant_ids as string[];
            // Intersect with GPS allowed list when active
            if (nearbyIds !== null) ids = ids.filter((id) => nearbyIds.includes(id));
            if (!ids.length) return [];

            const { data } = await supabase
                .from("restaurants")
                .select(RESTAURANT_SELECT)
                .eq("is_published", true)
                .in("id", ids)
                .limit(20);

            if (!data) return [];
            // Preserve manual order
            const byId = Object.fromEntries(data.map((r: any) => [r.id, r]));
            return ids
                .map((id: string) => byId[id])
                .filter(Boolean)
                .map(mapRestaurant);
        }

        // auto or seasonal → apply auto_rule
        let query = supabase
            .from("restaurants")
            .select(RESTAURANT_SELECT)
            .eq("is_published", true);

        if (cuisine) query = query.eq("cuisine_type", cuisine);
        if (city)    query = query.eq("city", city);
        if (nearbyIds !== null && nearbyIds.length > 0) query = query.in("id", nearbyIds);
        if (nearbyIds !== null && nearbyIds.length === 0) return []; // GPS active, nothing nearby

        switch (section.auto_rule) {
            case "featured":
                query = query
                    .order("is_sponsored", { ascending: false })
                    .order("is_premium", { ascending: false })
                    .order("rating", { ascending: false });
                break;
            case "top_rated":
                query = query.order("rating", { ascending: false });
                break;
            case "popular":
                query = query.order("order_count", { ascending: false });
                break;
            case "newest":
                query = query.order("created_at", { ascending: false });
                break;
            case "sponsored":
                query = query
                    .eq("is_sponsored", true)
                    .order("rating", { ascending: false });
                break;
            default:
                query = query.order("rating", { ascending: false });
        }

        const { data } = await query.limit(12);
        let results = (data ?? []).map(mapRestaurant);

        // For GPS mode: re-sort by distance (nearbyIds already ordered by distance_m)
        if (nearbyIds !== null && nearbyIds.length > 0) {
            const order = new Map(nearbyIds.map((id, i) => [id, i]));
            results = results.sort((a: any, b: any) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
        }

        return results;
    } catch {
        return [];
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cuisine = searchParams.get("cuisine")?.trim() ?? "";
        const city    = searchParams.get("city")?.trim() ?? "";
        const latRaw  = searchParams.get("lat");
        const lngRaw  = searchParams.get("lng");
        const radiusKm = parseFloat(searchParams.get("radius") ?? "15");

        const lat = latRaw ? parseFloat(latRaw) : null;
        const lng = lngRaw ? parseFloat(lngRaw) : null;
        const useGps = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

        const supabase = await createClient();

        // Resolve nearby restaurant IDs once (shared across all sections)
        let nearbyIds: string[] | null = null;
        if (useGps) {
            // @ts-expect-error — nearby_restaurant_ids is a custom RPC not yet in generated types
            const { data: nearby } = await supabase.rpc("nearby_restaurant_ids", {
                user_lat: lat,
                user_lng: lng,
                radius_m: radiusKm * 1000,
            });
            nearbyIds = ((nearby as any[]) ?? []).map((r: { id: string }) => r.id);
        }

        const now = new Date().toISOString();

        const { data: rows, error } = await supabase
            .from("homepage_sections")
            .select("*")
            .eq("is_active", true)
            .or(`starts_at.is.null,starts_at.lte.${now}`)
            .or(`ends_at.is.null,ends_at.gte.${now}`)
            .order("sort_order", { ascending: true });

        if (error) throw error;

        // Resolve all sections in parallel
        const sections = await Promise.all(
            (rows ?? []).map(async (section: any) => ({
                id: section.id,
                title: section.title,
                subtitle: section.subtitle,
                type: section.type,
                auto_rule: section.auto_rule,
                display_style: section.display_style ?? "cards",
                sort_order: section.sort_order,
                restaurants: await resolveSection(supabase, section, cuisine, city, nearbyIds),
            }))
        );

        return NextResponse.json({ sections });
    } catch (e) {
        console.error("[homepage-sections] GET error:", e);
        return NextResponse.json({ sections: [] }, { status: 500 });
    }
}
