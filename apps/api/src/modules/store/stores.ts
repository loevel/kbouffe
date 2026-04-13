/**
 * GET /stores          — Public restaurant listing (explore / search)
 * GET /stores/:slug    — Single restaurant by slug
 *
 * Migrated from: web-dashboard/src/app/api/stores/route.ts
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env } from "../../types";

export const storesRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /stores
 * Query params:
 *   ?q       — search name or city
 *   ?cuisine — filter by cuisine type
 *   ?city    — filter by city
 *   ?sort    — "rating" | "orders" | "newest" (default: recommended)
 *   ?limit   — max results (default: 60, max: 100)
 */
storesRoutes.get("/", async (c) => {
    const q = c.req.query("q")?.trim() ?? "";
    const cuisine = c.req.query("cuisine")?.trim() ?? "";
    const city = c.req.query("city")?.trim() ?? "";
    const sort = c.req.query("sort") ?? "recommended";
    const limit = Math.min(parseInt(c.req.query("limit") ?? "60"), 100);

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    // Build query
    let query = supabase
        .from("restaurants")
        .select(`
            id, name, slug, description, logo_url, cover_url, 
            address, city, cuisine_type, price_range, rating, 
            review_count, order_count, is_verified, is_premium, 
            is_sponsored, has_dine_in, is_published, compliance_status
        `)
        .eq("is_published", true)
        .eq("compliance_status", "compliant");

    if (cuisine) {
        query = query.eq("cuisine_type", cuisine);
    }
    if (city) {
        query = query.ilike("city", `%${city}%`);
    }
    if (q) {
        query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,cuisine_type.ilike.%${q}%`);
    }

    // Default sorting in DB for base query
    query = query.order("rating", { ascending: false }).limit(limit);

    const { data: rows, error } = await query;

    if (error) {
        console.error("Supabase stores query error:", error);
        return c.json({ restaurants: [], total: 0 });
    }

    let results = (rows || []).map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        logoUrl: r.logo_url,
        coverUrl: r.cover_url,
        address: r.address,
        city: r.city,
        cuisineType: r.cuisine_type,
        priceRange: r.price_range,
        rating: r.rating,
        reviewCount: r.review_count,
        orderCount: r.order_count,
        isVerified: r.is_verified,
        isPremium: r.is_premium,
        isSponsored: r.is_sponsored,
        hasDineIn: r.has_dine_in,
    }));

    // Client-side sort overrides
    if (sort === "rating") {
        results = results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === "orders") {
        results = results.sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
    } else if (sort === "recommended") {
        // "recommended": sponsored first, then premium, then by rating
        results = results.sort((a, b) => {
            if (a.isSponsored && !b.isSponsored) return -1;
            if (!a.isSponsored && b.isSponsored) return 1;
            if (a.isPremium && !b.isPremium) return -1;
            if (!a.isPremium && b.isPremium) return 1;
            return (b.rating ?? 0) - (a.rating ?? 0);
        });
    }

    // Cache publicly: 1 min browser, 5 mins edge limit
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return c.json({ restaurants: results, total: results.length });
});

/**
 * GET /stores/:slug — Single restaurant public profile
 */
storesRoutes.get("/:slug", async (c) => {
    // Cache publicly
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    const slug = c.req.param("slug");
    
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    const { data: results, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("compliance_status", "compliant")
        .limit(1);

    if (error || !results || results.length === 0) {
        return c.json({ error: "Restaurant non trouvé" }, 404);
    }

    // Map result to camelCase for frontend consistency
    const r = results[0];
    const restaurant = {
        ...r,
        logoUrl: r.logo_url,
        coverUrl: r.cover_url,
        cuisineType: r.cuisine_type,
        priceRange: r.price_range,
        reviewCount: r.review_count,
        orderCount: r.order_count,
        isVerified: r.is_verified,
        isPremium: r.is_premium,
        isPublished: r.is_published,
        isSponsored: r.is_sponsored,
        hasDineIn: r.has_dine_in,
    };

    return c.json({ restaurant });
});
