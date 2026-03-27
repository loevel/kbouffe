/**
 * User Sync route
 * Syncs Supabase user to tracking DB/Global Index
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const syncUserRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

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
            if (lng >= mid) {
                ch |= 1 << (4 - bit);
                minLng = mid;
            } else {
                maxLng = mid;
            }
        } else {
            const mid = (minLat + maxLat) / 2;
            if (lat >= mid) {
                ch |= 1 << (4 - bit);
                minLat = mid;
            } else {
                maxLat = mid;
            }
        }
        isLng = !isLng;
        if (bit < 4) {
            bit++;
        } else {
            hash += BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }
    return hash;
}

syncUserRoutes.post("/", async (c) => {
    try {
        const { data: { user }, error: authError } = await c.var.supabase.auth.getUser();

        if (authError || !user) {
            return c.json({ error: "Non authentifié" }, 401);
        }

        const metadata = user.user_metadata || {};
        const role = metadata.role || "client";
        const restaurantName = metadata.restaurant_name;

        // Check if user exists in public.users
        const { data: existingUser } = await c.var.supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (existingUser) {
            return c.json({
                success: true,
                synced: false,
                message: "Utilisateur déjà synchronisé",
                user: existingUser,
            });
        }

        let restaurantId: string | null = null;

        if (role === "merchant" && restaurantName) {
            const baseSlug = slugify(restaurantName);
            const timestamp = Date.now().toString(36);
            const slug = `${baseSlug}-${timestamp}`;

            const lat = 4.0511;
            const lng = 9.7679;
            const geohash = encodeGeohash(lat, lng);

            restaurantId = crypto.randomUUID();

            const { error: restError } = await c.var.supabase
                .from("restaurants")
                .insert({
                    id: restaurantId,
                    name: restaurantName.trim(),
                    slug,
                    lat,
                    lng,
                    geohash,
                    address: "À définir",
                    city: "Douala",
                    country: "CM",
                    cuisine_type: "african",
                    price_range: 2,
                    is_published: true,
                    is_verified: false,
                    is_premium: false,
                });
            
            if (restError) {
                console.error("Sync restaurant creation error:", restError);
            }
        }

        const newUser = {
            id: user.id,
            email: user.email!,
            full_name: metadata.full_name || null,
            phone: metadata.phone || null,
            role,
            restaurant_id: restaurantId,
            preferred_lang: "fr",
            notifications_enabled: true,
        };

        const { error: userError } = await c.var.supabase
            .from("users")
            .insert(newUser);

        if (userError) {
            console.error("Sync user creation error:", userError);
            return c.json({ error: "Erreur lors de la synchronisation" }, 500);
        }

        return c.json({
            success: true,
            synced: true,
            message: "Utilisateur synchronisé vers Supabase",
            user: newUser,
            restaurantId,
        });
    } catch (error) {
        console.error("Erreur sync user:", error);
        return c.json({ error: "Erreur lors de la synchronisation" }, 500);
    }
});

syncUserRoutes.get("/", async (c) => {
    try {
        const { data: { user }, error: authError } = await c.var.supabase.auth.getUser();

        if (authError || !user) {
            return c.json({ error: "Non authentifié" }, 401);
        }

        const { data: dbUser, error: userError } = await c.var.supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (userError || !dbUser) {
            return c.json({ error: "Utilisateur non trouvé", needsSync: true }, 404);
        }

        let restaurant = null;
        let teamRole = "client";

        if (dbUser.restaurant_id) {
            teamRole = "owner";
            const { data: dbRestaurant } = await c.var.supabase
                .from("restaurants")
                .select("*")
                .eq("id", dbUser.restaurant_id)
                .maybeSingle();

            if (dbRestaurant) {
                restaurant = dbRestaurant;
            }
        } else {
            // Check if user is a member of another restaurant
            const { data: memberList } = await c.var.supabase
                .from("restaurant_members")
                .select("role, restaurant_id")
                .eq("user_id", user.id)
                .eq("status", "active")
                .limit(1);

            if (memberList && memberList.length > 0) {
                teamRole = memberList[0].role;
                const { data: dbRestaurant } = await c.var.supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", memberList[0].restaurant_id)
                    .maybeSingle();

                if (dbRestaurant) {
                    restaurant = dbRestaurant;
                }
            }
        }

        let activeModules: string[] = [];

        if (restaurant) {
            const { data: modules } = await c.var.supabase
                .from("store_modules")
                .select("module_id")
                .eq("restaurant_id", restaurant.id)
                .eq("is_active", true);

            if (modules) {
                activeModules = modules.map((m) => m.module_id);
            }
        }

        return c.json({
            success: true,
            user: dbUser,
            restaurant,
            teamRole,
            activeModules,
        });
    } catch (error) {
        console.error("Erreur get user:", error);
        return c.json({ error: "Erreur lors de la récupération" }, 500);
    }
});
