import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/homepage-sections
 * Retourne les sections actives de la page d'accueil avec les restaurants résolus.
 * Query params:
 *   ?cuisine — filtre cuisine (passé aux sections auto uniquement)
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
    cuisine: string
): Promise<any[]> {
    try {
        if (section.type === "manual" && section.restaurant_ids?.length) {
            const { data } = await supabase
                .from("restaurants")
                .select(RESTAURANT_SELECT)
                .eq("is_published", true)
                .in("id", section.restaurant_ids)
                .limit(20);

            if (!data) return [];
            // Preserve manual order
            const byId = Object.fromEntries(data.map((r: any) => [r.id, r]));
            return section.restaurant_ids
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
        return (data ?? []).map(mapRestaurant);
    } catch {
        return [];
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cuisine = searchParams.get("cuisine")?.trim() ?? "";

        const supabase = await createClient();

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
                restaurants: await resolveSection(supabase, section, cuisine),
            }))
        );

        return NextResponse.json({ sections });
    } catch (e) {
        console.error("[homepage-sections] GET error:", e);
        return NextResponse.json({ sections: [] }, { status: 500 });
    }
}
