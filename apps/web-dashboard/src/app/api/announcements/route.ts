/**
 * GET  /api/announcements  — liste les annonces du restaurant du marchand
 * POST /api/announcements  — cree une nouvelle annonce
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getRestaurantId(supabase: any) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: dbUser } = await supabase
        .from("users")
        .select("restaurant_id")
        .eq("id", user.id)
        .single();

    return dbUser?.restaurant_id ?? null;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const restaurantId = await getRestaurantId(supabase);
        if (!restaurantId) {
            return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("store_announcements")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ announcements: data ?? [] });
    } catch (error: any) {
        console.error("[GET /api/announcements] error:", error);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const restaurantId = await getRestaurantId(supabase);
        if (!restaurantId) {
            return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
        }

        const body = await request.json();
        const { message, type, color, starts_at, ends_at } = body;

        if (!message?.trim()) {
            return NextResponse.json({ error: "Le message est requis" }, { status: 400 });
        }

        if (type && !["info", "warning", "urgent"].includes(type)) {
            return NextResponse.json({ error: "Type invalide" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("store_announcements")
            .insert({
                restaurant_id: restaurantId,
                message: message.trim(),
                type: type ?? "info",
                color: color || null,
                starts_at: starts_at || null,
                ends_at: ends_at || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ announcement: data }, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/announcements] error:", error);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}
