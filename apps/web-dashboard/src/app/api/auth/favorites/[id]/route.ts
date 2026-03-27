import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { id } = await params;

        // Support deletion by favorite ID OR by restaurantId
        // If id looks like a UUID, delete by favorite id
        // Otherwise, treat it as restaurantId
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const query = supabase
            .from("restaurant_favorites")
            .delete()
            .eq("user_id", user.id);

        if (isUUID) {
            // Delete by favorite record ID
            query.eq("id", id);
        } else {
            // Delete by restaurantId (for convenience)
            query.eq("restaurant_id", id);
        }

        const { error: deleteError } = await query;

        if (deleteError) {
            console.error("Erreur delete Supabase favorite:", deleteError);
            return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Retiré des favoris" });
    } catch (error) {
        console.error("Erreur API delete favorite:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la suppression du favori" },
            { status: 500 }
        );
    }
}
