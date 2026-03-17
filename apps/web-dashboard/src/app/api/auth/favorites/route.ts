import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { data: userFavorites, error: fetchError } = await supabase
            .from("restaurant_favorites")
            .select(`
                id,
                restaurantId:restaurant_id,
                createdAt:created_at,
                restaurants (
                    name,
                    slug,
                    logoUrl:logo_url
                )
            `)
            .eq("user_id", user.id);

        if (fetchError) throw fetchError;

        // Flatten the response to match the expected structure
        const flattenedFavorites = (userFavorites || []).map((fav: any) => ({
            id: fav.id,
            restaurantId: fav.restaurantId,
            createdAt: fav.createdAt,
            restaurantName: fav.restaurants?.name,
            restaurantSlug: fav.restaurants?.slug,
            restaurantLogo: fav.restaurants?.logoUrl,
        }));

        return NextResponse.json(flattenedFavorites);
    } catch (error) {
        console.error("Erreur API fetch favorites:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération des favoris" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const { restaurantId } = body;

        if (!restaurantId) {
            return NextResponse.json({ error: "restaurantId est requis" }, { status: 400 });
        }

        // Check if already exists in Supabase
        const { data: existing, error: checkError } = await supabase
            .from("restaurant_favorites")
            .select("*")
            .eq("user_id", user.id)
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            return NextResponse.json(existing);
        }

        const { data: newFavorite, error: insertError } = await supabase
            .from("restaurant_favorites")
            .insert({
                user_id: user.id,
                restaurant_id: restaurantId,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json(newFavorite);
    } catch (error) {
        console.error("Erreur API create favorite:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de l'ajout en favoris" },
            { status: 500 }
        );
    }
}
