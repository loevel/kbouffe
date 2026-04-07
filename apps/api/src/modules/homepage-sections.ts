import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../types";

/**
 * Public route: GET /api/homepage-sections
 * Returns active homepage sections with resolved restaurants.
 * Query param: ?cuisine — filters auto/seasonal sections by cuisine_type.
 */
export const homepageSectionsPublicRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const RESTAURANT_SELECT = `
    id, name, slug, logo_url, banner_url, cuisine_type,
    rating, review_count, is_verified, is_premium, is_sponsored
`;

function mapRestaurant(row: any) {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        logoUrl: row.logo_url,
        coverUrl: row.banner_url,
        cuisineType: row.cuisine_type,
        rating: row.rating,
        reviewCount: row.review_count,
        isVerified: row.is_verified,
        isPremium: row.is_premium,
        isSponsored: row.is_sponsored,
    };
}

async function resolveSection(supabase: any, section: any, cuisine: string): Promise<any[]> {
    try {
        if (section.type === "manual" && section.restaurant_ids?.length) {
            const { data } = await supabase
                .from("restaurants")
                .select(RESTAURANT_SELECT)
                .eq("is_published", true)
                .in("id", section.restaurant_ids)
                .limit(20);

            if (!data) return [];
            const byId = Object.fromEntries(data.map((r: any) => [r.id, r]));
            return section.restaurant_ids
                .map((id: string) => byId[id])
                .filter(Boolean)
                .map(mapRestaurant);
        }

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

homepageSectionsPublicRoutes.get("/", async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
    const cuisine = (c.req.query("cuisine") ?? "").trim();
    const now = new Date().toISOString();

    const { data: rows, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order", { ascending: true });

    if (error) return c.json({ sections: [] }, 500);

    const sections = await Promise.all(
        (rows ?? []).map(async (section: any) => ({
            id: section.id,
            title: section.title,
            subtitle: section.subtitle ?? null,
            type: section.type,
            display_style: section.display_style ?? "cards",
            sort_order: section.sort_order,
            restaurants: await resolveSection(supabase, section, cuisine),
        }))
    );

    return c.json({ sections });
});
