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
        const { name, phone, avatarUrl } = body;

        if (!name && !phone && !avatarUrl) {
            return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
        }

        // 1) Update Supabase Auth metadata
        const { error: updateAuthError } = await supabase.auth.updateUser({
            data: { 
                full_name: name || user.user_metadata.full_name,
                name: name || user.user_metadata.name,
                phone: phone || user.user_metadata.phone,
                avatar_url: avatarUrl || user.user_metadata.avatar_url
            }
        });

        if (updateAuthError) {
            console.error("Erreur update Supabase Auth:", updateAuthError);
            return NextResponse.json({ error: "Erreur lors de la mise à jour de l'authentification" }, { status: 500 });
        }

        // 2) Update Public profile in Supabase
        const { error: updateProfileError } = await supabase
            .from("users")
            .update({
                full_name: name || user.user_metadata.full_name,
                phone: phone || user.user_metadata.phone,
                avatar_url: avatarUrl || user.user_metadata.avatar_url,
                updated_at: new Date().toISOString()
            })
            .eq("id", user.id);

        if (updateProfileError) {
            console.error("Erreur update Supabase profile:", updateProfileError);
            return NextResponse.json({ error: "Erreur lors de la mise à jour du profil" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Profil mis à jour" });
    } catch (error) {
        console.error("Erreur API profile update:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la mise à jour du profil" },
            { status: 500 }
        );
    }
}
