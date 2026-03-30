import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { CoreEnv, CoreVariables } from "./types";

export const authRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

// ── Helpers ──────────────────────────────────────────────────────────

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

// Cameroon MSISDN validation — mobile (6[5-9]x) and fixed (2[23]x), E.164 format
const CAMEROON_PHONE_REGEX = /^\+237(6[56789]\d{7}|2[23]\d{7})$/;

function normalizeAuthPhone(phone: string): string | null {
    const trimmed = phone.trim();
    if (!trimmed) return null;

    // Strip all non-digits to get a clean digit string
    const digits = trimmed.replace(/\D/g, "");

    let normalized: string;
    if (digits.startsWith("237")) {
        // Already has country code: "237677..." or "00237677..."
        normalized = `+${digits.startsWith("00") ? digits.slice(2) : digits}`;
    } else if (digits.length >= 8) {
        // Local format "677123456" or "22312345" — prepend +237
        normalized = `+237${digits}`;
    } else {
        return null;
    }

    return CAMEROON_PHONE_REGEX.test(normalized) ? normalized : null;
}

function phoneToAuthEmail(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    return `mobile-${digits}@auth.kbouffe.app`;
}

// ── KYC Helpers ──────────────────────────────────────────────

async function checkMsisdnActive(env: CoreEnv, phone: string): Promise<{ active: boolean }> {
    const baseUrl = env.KYC_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const subKey = env.KYC_SUBSCRIPTION_KEY;
    if (!subKey) return { active: false };

    try {
        const res = await fetch(`${baseUrl}/collection/v1_0/accountholder/msisdn/${phone}/active`, {
            headers: {
                "Ocp-Apim-Subscription-Key": subKey,
                "X-Target-Environment": "sandbox", // TODO: Make configurable
            },
        });
        if (!res.ok) return { active: false };
        const data = (await res.json()) as { result: boolean };
        return { active: data.result ?? false };
    } catch {
        return { active: false };
    }
}

// ── Restaurant Registration ─────────────────────────────────────

authRoutes.post("/", async (c) => {
    try {
        const supabase = c.var.supabase;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return c.json({ error: "Non authentifié" }, 401);

        const body = await c.req.json();
        const {
            restaurantName,
            phone,
            address,
            city,
            cuisineType,
            description,
            openingHours,
            saasPlanId,
            paymentProvider,
            paymentMomoNumber,
            paymentMomoName,
            isPremium,
            lat,
            lng
        } = body;

        if (!restaurantName?.trim()) return c.json({ error: "Nom du restaurant requis" }, 400);
        if (!phone?.trim()) return c.json({ error: "Téléphone requis" }, 400);

        const slug = `${slugify(restaurantName)}-${Date.now().toString(36)}`;
        
        const latitude = lat || 4.0511;
        const longitude = lng || 9.7679;

        // 1. Create Restaurant
        const { data: restaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .insert({
                owner_id: user.id,
                name: restaurantName.trim(),
                slug,
                phone: phone.trim(),
                address: address || "À définir",
                city: city || "Douala",
                country: "CM",
                cuisine_type: cuisineType || "Autre",
                description: description || null,
                opening_hours: openingHours || null,
                payment_config: {
                    provider: paymentProvider,
                    momo_number: paymentMomoNumber,
                    momo_name: paymentMomoName
                },
                saas_plan: saasPlanId || "starter",
                is_premium: !!isPremium,
                is_published: false, // Publié après approbation KYC admin (Arrêté MINSANTE n°0007/A)
                is_verified: false,
                lat: latitude,
                lng: longitude,
                geohash: encodeGeohash(latitude, longitude),
            })
            .select()
            .single();

        if (restaurantError) throw restaurantError;

        // 2. Update User
        const { error: userError } = await supabase
            .from("users")
            .update({ restaurant_id: restaurant.id, role: "merchant" })
            .eq("id", user.id);

        if (userError) throw userError;

        // 3. Add as member
        await supabase.from("restaurant_members").insert({
            restaurant_id: restaurant.id,
            user_id: user.id,
            role: "owner",
            status: "active"
        });

        return c.json({ success: true, restaurantId: restaurant.id });
    } catch (error: any) {
        console.error("Register restaurant error:", error);
        return c.json({ error: error.message || "Erreur lors de la création" }, 500);
    }
});

// ── Generic register (email-based) — used by fournisseur & merchant onboarding ──

authRoutes.post("/register", async (c) => {
    try {
        if (!c.env.SUPABASE_SERVICE_ROLE_KEY) {
            return c.json({ error: "Configuration d'inscription manquante" }, 500);
        }

        const body = await c.req.json();
        const fullName = String(body.full_name ?? body.fullName ?? "").trim();
        const email = String(body.email ?? "").trim().toLowerCase();
        const phone = String(body.phone ?? "").trim() || null;
        const password = String(body.password ?? "");
        const role = String(body.role ?? "customer");

        if (!fullName) return c.json({ error: "Nom complet requis" }, 400);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return c.json({ error: "Adresse email invalide" }, 400);
        if (password.length < 8) return c.json({ error: "Mot de passe trop court (min. 8 caractères)" }, 400);

        const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role,
                auth_method: "email",
            },
        });

        if (authError) {
            const status = /already|exists|registered/i.test(authError.message) ? 409 : 400;
            return c.json({ error: authError.message }, status);
        }

        const newUser = {
            id: authUser.user.id,
            email,
            full_name: fullName,
            ...(phone ? { phone } : {}),
            role,
            preferred_lang: "fr",
            notifications_enabled: false,      // Opt-in requis — Loi 2010/012 Art.62
            sms_notifications_enabled: false,   // SMS campagnes : opt-in explicite uniquement
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabaseAdmin
            .from("users")
            .upsert(newUser, { onConflict: "id" });

        if (dbError) {
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return c.json({ error: dbError.message || "Erreur lors de la création du profil" }, 500);
        }

        return c.json({ success: true, userId: authUser.user.id, email });
    } catch (error: any) {
        console.error("Register error:", error);
        return c.json({ error: error.message || "Erreur lors de l'inscription" }, 500);
    }
});

// ── Customer register (phone-alias) — legacy mobile flow ──────────────────

authRoutes.post("/customer-register", async (c) => {
    try {
        if (!c.env.SUPABASE_SERVICE_ROLE_KEY) {
            return c.json({ error: "Configuration d'inscription manquante" }, 500);
        }

        const body = await c.req.json();
        const fullName = String(body.fullName ?? "").trim();
        const normalizedPhone = normalizeAuthPhone(String(body.phone ?? ""));
        const password = String(body.password ?? "");

        if (!fullName) return c.json({ error: "Nom complet requis" }, 400);
        if (!normalizedPhone) return c.json({ error: "Numéro de téléphone invalide — format attendu : +237 6X XXX XXXX" }, 400);
        if (password.length < 8) return c.json({ error: "Mot de passe trop court (min. 8 caractères)" }, 400);

        const email = phoneToAuthEmail(normalizedPhone);
        const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                phone: normalizedPhone,
                role: "customer",
                auth_method: "phone_alias",
            },
        });

        if (authError) {
            const status = /already|exists|registered/i.test(authError.message) ? 409 : 400;
            return c.json({ error: authError.message }, status);
        }

        const newUser = {
            id: authUser.user.id,
            email,
            full_name: fullName,
            phone: normalizedPhone,
            role: "customer",
            preferred_lang: "fr",
            notifications_enabled: false,      // Opt-in requis — Loi 2010/012 Art.62
            sms_notifications_enabled: false,   // SMS campagnes : opt-in explicite uniquement
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabaseAdmin
            .from("users")
            .upsert(newUser, { onConflict: "id" });

        if (dbError) {
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return c.json({ error: dbError.message || "Erreur lors de la creation du profil" }, 500);
        }

        return c.json({ success: true, userId: authUser.user.id, email });
    } catch (error: any) {
        console.error("Customer register error:", error);
        return c.json({ error: error.message || "Erreur lors de l'inscription" }, 500);
    }
});

// ── Sync User ──────────────────────────────────────────────────────────

authRoutes.post("/sync", async (c) => {
    try {
        const supabase = c.var.supabase;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return c.json({ error: "Non authentifié" }, 401);

        const metadata = user.user_metadata || {};
        const role = metadata.role || "client";
        const restaurantName = metadata.restaurant_name;

        // Check in Supabase
        const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (existingUser) {
            return c.json({ success: true, synced: false, user: existingUser });
        }

        let restaurantId: string | null = null;
        
        // If merchant, create restaurant in Supabase
        if (role === "merchant" && restaurantName) {
            const slug = `${slugify(restaurantName)}-${Date.now().toString(36)}`;
            
            // 1. Insert into Supabase
            const { data: newRestaurant, error: restaurantError } = await supabase
                .from("restaurants")
                .insert({
                    owner_id: user.id,
                    name: restaurantName.trim(),
                    slug,
                    lat: metadata.lat || 4.0511,
                    lng: metadata.lng || 9.7679,
                    geohash: encodeGeohash(metadata.lat || 4.0511, metadata.lng || 9.7679),
                    address: "À définir",
                    city: "Douala",
                    country: "CM",
                    is_published: false, // Publié après approbation KYC admin (Arrêté MINSANTE n°0007/A)
                    is_verified: false,
                    is_premium: false,
                    cuisine_type: "Autre",
                })
                .select()
                .single();

            if (restaurantError) throw restaurantError;
            restaurantId = newRestaurant.id;
        }

        const newUser = {
            id: user.id,
            email: user.email!,
            full_name: metadata.full_name || null,
            phone: metadata.phone || null,
            role,
            restaurant_id: restaurantId,
            preferred_lang: "fr",
            notifications_enabled: false,      // Opt-in requis — Loi 2010/012 Art.62
            sms_notifications_enabled: false,   // SMS campagnes : opt-in explicite uniquement
        };

        // Insert into Supabase
        const { error: insertError } = await supabase.from("users").insert(newUser);
        if (insertError) throw insertError;

        return c.json({ success: true, synced: true, user: newUser, restaurantId });
    } catch (error: any) {
        console.error("Sync user error:", error);
        return c.json({ error: error.message || "Erreur lors de la synchronisation" }, 500);
    }
});

authRoutes.get("/me", async (c) => {
    try {
        const supabase = c.var.supabase;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return c.json({ error: "Non authentifié" }, 401);

        // Fetch user from Supabase
        const { data: dbUser, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (!dbUser) return c.json({ error: "Utilisateur non trouvé", needsSync: true }, 404);

        let restaurant = null;
        let teamRole = "client";

        // Handle restaurant details and membership in Supabase
        if (dbUser.restaurant_id) {
            teamRole = "owner";
            const { data: dbRestaurant } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", dbUser.restaurant_id)
                .maybeSingle();
            restaurant = dbRestaurant;
        } else {
            const { data: memberList } = await supabase
                .from("restaurant_members")
                .select("role, restaurant_id")
                .eq("user_id", user.id)
                .eq("status", "active")
                .limit(1)
                .maybeSingle();

            if (memberList) {
                teamRole = memberList.role;
                const { data: dbRestaurant } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", memberList.restaurant_id)
                    .maybeSingle();
                restaurant = dbRestaurant;
            }
        }

        let activeModules: string[] = [];
        if (restaurant) {
            const { data: modules } = await supabase
                .from("store_modules")
                .select("module_id")
                .eq("restaurant_id", restaurant.id)
                .eq("is_active", true);
            
            if (modules) {
                activeModules = modules.map((m) => m.module_id);
            }
        }

        return c.json({ success: true, user: dbUser, restaurant, teamRole, activeModules });
    } catch (error: any) {
        console.error("Get /me error:", error);
        return c.json({ error: error.message || "Erreur lors de la récupération" }, 500);
    }
});

// ── KYC ──────────────────────────────────────────────────────────

authRoutes.get("/check-phone", async (c) => {
    const phone = c.req.query("phone");
    if (!phone?.trim()) return c.json({ error: "Le parametre phone est requis" }, 400);
    const normalized = normalizeAuthPhone(phone);
    if (!normalized) return c.json({ error: "Numéro de téléphone invalide — format attendu : +237 6X XXX XXXX" }, 400);
    const result = await checkMsisdnActive(c.env, normalized);
    return c.json({ success: true, phone: normalized, active: result.active });
});

// ── Turnstile ───────────────────────────────────────────────────

authRoutes.post("/verify-turnstile", async (c) => {
    const { token } = await c.req.json();
    if (!token) return c.json({ success: false }, 400);

    const secretKey = c.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) return c.json({ success: true });

    try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: secretKey, response: token }),
        });
        const data = await res.json() as { success: boolean };
        return c.json({ success: data.success });
    } catch (e) {
        return c.json({ success: false }, 500);
    }
});
