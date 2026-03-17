import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
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

        const id = (await params).id;

        const { error: deleteError } = await supabase
            .from("restaurant_favorites")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

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
