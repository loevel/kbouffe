/**
 * Register Restaurant route — migrated from web-dashboard
 *
 * POST /register-restaurant — Create a new restaurant + merchant user in Supabase
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const registerRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** Slugify a restaurant name */
function slugify(text: string): string {
    let slug = text.toLowerCase().trim();
    slug = slug.replace(/[àáâãäå]/g, "a");
    slug = slug.replace(/[èéêë]/g, "e");
    slug = slug.replace(/[ìíîï]/g, "i");
    slug = slug.replace(/[òóôõö]/g, "o");
    slug = slug.replace(/[ùúûü]/g, "u");
    slug = slug.replace(/[ç]/g, "c");
    slug = slug.replace(/[^a-z0-9\s-]/g, "");
    slug = slug.replace(/[\s-]+/g, "-");
    slug = slug.replace(/^-+|-+$/g, "");
    return slug;
}

/** Simple geohash encoder (precision ~1.2km) */
function encodeGeohash(lat: number, lng: number, precision = 6): string {
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;
    let hash = "";
    let bit = 0;
    let ch = 0;
    let isLng = true;

    while (hash.length < precision) {
        if (isLng) {
            const mid = (minLng + maxLng) / 2;
            if (lng >= mid) { ch |= 1 << (4 - bit); minLng = mid; } else { maxLng = mid; }
        } else {
            const mid = (minLat + maxLat) / 2;
            if (lat >= mid) { ch |= 1 << (4 - bit); minLat = mid; } else { maxLat = mid; }
        }
        isLng = !isLng;
        if (bit < 4) { bit++; } else { hash += BASE32[ch]; bit = 0; ch = 0; }
    }
    return hash;
}

/** POST /register-restaurant */
registerRoutes.post("/", async (c) => {
    const body = await c.req.json();
    const { restaurantName, fullName, phone, address, city, postalCode, lat, lng, cuisineType } = body;

    if (!restaurantName?.trim()) return c.json({ error: "Nom du restaurant requis" }, 400);

    const baseSlug = slugify(restaurantName);
    const timestamp = Date.now().toString(36);
    const slug = `${baseSlug}-${timestamp}`;

    const latitude = lat ?? 4.0511;
    const longitude = lng ?? 9.7679;
    const geohash = encodeGeohash(latitude, longitude);

    const restaurantId = crypto.randomUUID();

    // 1. Create the restaurant
    const { error: restError } = await c.var.supabase
        .from("restaurants")
        .insert({
            id: restaurantId,
            name: restaurantName.trim(),
            slug,
            lat: latitude,
            lng: longitude,
            geohash,
            address: address?.trim() || "À définir",
            city: city?.trim() || "Douala",
            postal_code: postalCode || null,
            country: "CM",
            cuisine_type: cuisineType || "african",
            price_range: 2,
            is_published: true,
            is_verified: false,
            is_premium: false,
        });

    if (restError) {
        console.error("Restaurant insertion error:", restError);
        return c.json({ error: "Erreur lors de la création du restaurant" }, 500);
    }

    // 2. Get user info from Supabase Auth
    const { data: { user } } = await c.var.supabase.auth.getUser();

    // 3. Link user to restaurant and set role to merchant
    const { error: userError } = await c.var.supabase
        .from("users")
        .upsert({
            id: c.var.userId,
            email: user?.email ?? "",
            full_name: fullName || user?.user_metadata?.full_name || null,
            phone: phone || user?.user_metadata?.phone || null,
            role: "merchant",
            restaurant_id: restaurantId,
            preferred_lang: "fr",
            notifications_enabled: true,
            updated_at: new Date().toISOString()
        });

    if (userError) {
        console.error("User update error:", userError);
        return c.json({ error: "Erreur lors de la mise à jour de l'utilisateur" }, 500);
    }

    return c.json({
        success: true,
        restaurant: { id: restaurantId, name: restaurantName, slug },
    });
});
