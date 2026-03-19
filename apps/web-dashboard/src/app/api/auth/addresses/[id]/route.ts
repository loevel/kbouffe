import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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
        const body = await request.json();
        const { label, address: addressLine, city, instructions, is_default } = body;

        // Security check: ensure address belongs to user
        const { data: existing, error: fetchError } = await supabase
            .from("addresses")
            .select("id")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 });
        }

        // If marking as default, unset others first in Supabase
        if (is_default) {
            await supabase
                .from("addresses")
                .update({ is_default: false })
                .eq("user_id", user.id);
        }

        const updates: any = {
            updated_at: new Date().toISOString()
        };
        if (label !== undefined) updates.label = label;
        if (addressLine !== undefined) updates.address = addressLine;
        if (city !== undefined) updates.city = city;
        if (instructions !== undefined) updates.instructions = instructions;
        if (is_default !== undefined) updates.is_default = !!is_default;

        const { data: result, error: updateError } = await supabase
            .from("addresses")
            .update(updates)
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (updateError) {
            console.error("Erreur update Supabase address:", updateError);
            return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Erreur API update address:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la mise à jour de l'adresse" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
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

        const { error: deleteError } = await supabase
            .from("addresses")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("Erreur delete Supabase address:", deleteError);
            return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Adresse supprimée" });
    } catch (error) {
        console.error("Erreur API delete address:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la suppression de l'adresse" },
            { status: 500 }
        );
    }
}