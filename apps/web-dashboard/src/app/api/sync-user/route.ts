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

        // Récupérer le restaurant de l'utilisateur
        const { data: restaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("owner_id", authUser.id)
            .single();

        if (restaurantError) {
            console.warn("[sync-user] No restaurant found for user", {
                userId: authUser.id,
                error: restaurantError.message,
            });
            return NextResponse.json({
                user: userProfile,
                restaurant: null,
                teamRole: "owner",
                activeModules: [],
            });
        }

        // Récupérer les modules actifs du restaurant
        const { data: moduleData } = await supabase
            .from("restaurant_modules" as any)
            .select("module_id")
            .eq("restaurant_id", restaurant.id)
            .eq("is_active", true);

        const activeModules = moduleData?.map(m => m.module_id) || [];

        return NextResponse.json({
            user: userProfile,
            restaurant,
            teamRole: "owner",
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

        // Créer le restaurant s'il n'existe pas
        const { data: existingRestaurant } = await supabase
            .from("restaurants")
            .select("*")
            .eq("owner_id", authUser.id)
            .single();

        let restaurant = existingRestaurant;
        let restaurantId = existingRestaurant?.id;

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

        // Récupérer les modules actifs
        if (restaurantId) {
            const { data: moduleData } = await supabase
                .from("restaurant_modules" as any)
                .select("module_id")
                .eq("restaurant_id", restaurantId)
                .eq("is_active", true);

            const activeModules = moduleData?.map(m => m.module_id) || [];

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
