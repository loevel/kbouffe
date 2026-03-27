import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const prefs = await req.json();
        
        if (!prefs) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        // Update the user record with the new preferences JSON
        // We also sync preferred_lang, notifications_enabled, and theme_preference for compatibility
        const { error: updateError } = await supabase
            .from("users")
            .update({
                preferences: prefs,
                updated_at: new Date().toISOString(),
                preferred_lang: prefs.language ?? "fr",
                notifications_enabled: prefs.notifications?.push ?? true,
                theme_preference: prefs.theme ?? "light"
            })
            .eq("id", user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ 
            success: true,
            message: "Préférences mises à jour avec succès" 
        });
    } catch (error: any) {
        console.error("Error updating preferences:", error);
        return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
    }
}

/**
 * GET could be used to fetch fresh preferences, 
 * but usually they come from the session context initialized at login.
 */
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { data: userData, error: fetchError } = await supabase
            .from("users")
            .select("preferences")
            .eq("id", user.id)
            .single();

        if (fetchError) throw fetchError;

        return NextResponse.json(userData?.preferences || {});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
