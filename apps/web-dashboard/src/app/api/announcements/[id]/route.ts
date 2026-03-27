/**
 * PATCH  /api/announcements/[id]  — met a jour une annonce
 * DELETE /api/announcements/[id]  — supprime une annonce
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const restaurantId = await getRestaurantId(supabase);
        if (!restaurantId) {
            return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
        }

        const body = await request.json();
        const allowedFields = ["message", "type", "color", "is_active", "starts_at", "ends_at"];
        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Aucun champ a mettre a jour" }, { status: 400 });
        }

        if (updateData.type && !["info", "warning", "urgent"].includes(updateData.type)) {
            return NextResponse.json({ error: "Type invalide" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("store_announcements")
            .update(updateData)
            .eq("id", id)
            .eq("restaurant_id", restaurantId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ error: "Annonce non trouvee" }, { status: 404 });
        }

        return NextResponse.json({ announcement: data });
    } catch (error: any) {
        console.error("[PATCH /api/announcements/[id]] error:", error);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const restaurantId = await getRestaurantId(supabase);
        if (!restaurantId) {
            return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
        }

        const { error } = await supabase
            .from("store_announcements")
            .delete()
            .eq("id", id)
            .eq("restaurant_id", restaurantId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[DELETE /api/announcements/[id]] error:", error);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}
