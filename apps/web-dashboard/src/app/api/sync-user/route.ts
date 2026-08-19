import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sync-user
 * Récupère les données de l'utilisateur et du restaurant connecté
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            console.warn("[sync-user] No authenticated user");
            return NextResponse.json(
                { error: "Non authentifié", needsSync: false },
                { status: 401 }
            );
        }

        // Récupérer le profil utilisateur
        const { data: userProfile, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single();

        if (userError || !userProfile) {
            console.warn("[sync-user] User profile not found, needs sync", {
                userId: authUser.id,
                error: userError?.message,
            });
            return NextResponse.json({
                user: null,
                restaurant: null,
                needsSync: true,
            });
        }

        // Résoudre le restaurant: d'abord via users.restaurant_id (propriétaire),
        // puis repli sur restaurant_members (membre d'équipe invité). Doit rester
        // cohérent avec apps/api/src/middleware/auth.ts, qui utilise cette même
        // résolution pour toutes les autres routes (orders, reports, menu...).
        // Chercher par restaurants.owner_id ratait ce cas et laissait
        // `restaurant` bloqué à null pour ces comptes (page /dashboard/store
        // coincée en chargement infini).
        let restaurantId: string | null = (userProfile as any).restaurant_id ?? null;
        let teamRole: string = "owner";

        if (!restaurantId) {
            const { data: memberData } = await supabase
                .from("restaurant_members" as any)
                .select("restaurant_id, role")
                .eq("user_id", authUser.id)
                .eq("status", "active")
                .limit(1)
                .maybeSingle();

            restaurantId = (memberData as any)?.restaurant_id ?? null;
            teamRole = (memberData as any)?.role ?? "owner";
        }

        // Dernier recours : la propriété. L'inscription pose users.restaurant_id
        // et la ligne d'équipe en deux écritures séparées, sans transaction ; si
        // elles échouent, le restaurant existe et reste publié pendant que son
        // propriétaire est traité comme n'en ayant aucun. Même repli que
        // apps/api/src/middleware/auth.ts, avec lequel cette résolution doit
        // rester cohérente.
        if (!restaurantId) {
            const { data: owned } = await supabase
                .from("restaurants")
                .select("id")
                .eq("owner_id", authUser.id)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();

            restaurantId = (owned as any)?.id ?? null;
            if (restaurantId) teamRole = "owner";
        }

        if (!restaurantId) {
            console.warn("[sync-user] No restaurant found for user", { userId: authUser.id });
            return NextResponse.json({
                user: userProfile,
                restaurant: null,
                teamRole: "owner",
                activeModules: [],
            });
        }

        const { data: restaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("id", restaurantId)
            .single();

        if (restaurantError || !restaurant) {
            console.warn("[sync-user] Restaurant id resolved but row not found", {
                userId: authUser.id,
                restaurantId,
                error: restaurantError?.message,
            });
            return NextResponse.json({
                user: userProfile,
                restaurant: null,
                teamRole,
                activeModules: [],
            });
        }

        // Récupérer les modules actifs du restaurant
        const { data: moduleData } = (await supabase
            .from("restaurant_modules" as any)
            .select("module_id")
            .eq("restaurant_id", restaurant.id)
            .eq("is_active", true)) as any;

        const activeModules = moduleData?.map((m: any) => m.module_id) || [];

        return NextResponse.json({
            user: userProfile,
            restaurant,
            teamRole,
            activeModules,
        });
    } catch (error) {
        console.error("[sync-user] Exception:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sync-user
 * Synchronise les données de l'utilisateur avec la base de données
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        // Créer le profil utilisateur s'il n'existe pas
        const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single();

        let user = existingUser;
        if (!user) {
            const { data: newUser } = await supabase
                .from("users")
                .insert({
                    id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
                    phone: authUser.phone || null,
                    role: "merchant",
                    avatar_url: authUser.user_metadata?.avatar_url || null,
                })
                .select()
                .single();

            user = newUser;
        }

        // Récupérer le restaurant existant: via users.restaurant_id, puis repli
        // restaurant_members (voir même logique que le GET ci-dessus) — avant de
        // conclure qu'il n'y en a pas et d'en créer un nouveau. Sans ce repli, un
        // membre d'équipe invité avant sa toute première connexion se voyait
        // attribuer un second restaurant en doublon plutôt que rejoindre celui
        // auquel il a été invité.
        let restaurant: any = null;
        let restaurantId: string | undefined = (user as any)?.restaurant_id ?? undefined;

        if (restaurantId) {
            const { data } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", restaurantId)
                .single();
            restaurant = data;
        } else {
            const { data: memberData } = await supabase
                .from("restaurant_members" as any)
                .select("restaurant_id")
                .eq("user_id", authUser.id)
                .eq("status", "active")
                .limit(1)
                .maybeSingle();

            restaurantId = (memberData as any)?.restaurant_id ?? undefined;
            if (restaurantId) {
                const { data } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", restaurantId)
                    .single();
                restaurant = data;
            }
        }

        // Repli sur la propriété avant d'en créer un : sans lui, un propriétaire
        // dont le rattachement a échoué se voyait créer un second restaurant
        // « Mon Restaurant » à côté du sien, déjà publié.
        if (!restaurant) {
            const { data: owned } = await supabase
                .from("restaurants")
                .select("*")
                .eq("owner_id", authUser.id)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();

            if (owned) {
                restaurant = owned;
                restaurantId = (owned as any).id;
            }
        }

        if (!restaurant) {
            const { data: newRestaurant } = await supabase
                .from("restaurants")
                .insert({
                    owner_id: authUser.id,
                    name: user?.full_name || "Mon Restaurant",
                    slug: `restaurant-${authUser.id.slice(0, 8)}`,
                    description: null,
                    logo_url: null,
                    banner_url: null,
                    city: null,
                    state: null,
                    country: null,
                    is_active: true,
                })
                .select()
                .single();

            restaurant = newRestaurant;
            restaurantId = newRestaurant?.id;
        }

        // Poser le rattachement : c'est users.restaurant_id que lit le middleware
        // de l'API. Sans cette écriture, la réponse contenait un restaurant que
        // toutes les autres routes déclaraient ensuite introuvable.
        if (restaurantId && (user as any)?.restaurant_id !== restaurantId) {
            await supabase
                .from("users")
                .update({ restaurant_id: restaurantId, role: "merchant" })
                .eq("id", authUser.id);
        }

        // Récupérer les modules actifs
        if (restaurantId) {
            const { data: moduleData } = (await supabase
                .from("restaurant_modules" as any)
                .select("module_id")
                .eq("restaurant_id", restaurantId)
                .eq("is_active", true)) as any;

            const activeModules = moduleData?.map((m: any) => m.module_id) || [];

            return NextResponse.json({
                user,
                restaurant,
                restaurantId,
                teamRole: "owner",
                activeModules,
            });
        }

        return NextResponse.json({
            user,
            restaurant,
            restaurantId,
            teamRole: "owner",
            activeModules: [],
        });
    } catch (error) {
        console.error("[sync-user] POST Exception:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
