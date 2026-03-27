import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
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
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: "Le nouveau mot de passe est requis" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            console.error("Erreur update password:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
        console.error("Erreur API password update:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la mise à jour du mot de passe" },
            { status: 500 }
        );
    }
}
