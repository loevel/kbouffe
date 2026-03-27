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

        // If marking as default, unset others first
        if (is_default) {
            const { error: unsetError } = await supabase
                .from("addresses")
                .update({ is_default: false })
                .eq("user_id", user.id);

            if (unsetError) {
                console.error("Erreur unsetting default addresses:", unsetError);
                return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
            }
        }

        const updates: any = {};
        if (label !== undefined) updates.label = label;
        if (addressLine !== undefined) updates.address = addressLine;
        if (city !== undefined) updates.city = city;
        if (instructions !== undefined) updates.instructions = instructions;
        if (is_default !== undefined) updates.is_default = !!is_default;

        // RLS policies will ensure user can only update their own addresses
        const { data: result, error: updateError } = await supabase
            .from("addresses")
            .update(updates)
            .eq("id", id)
            .select();

        if (updateError) {
            console.error("Erreur update Supabase address:", updateError);
            return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
        }

        if (!result || result.length === 0) {
            return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 });
        }

        return NextResponse.json(result[0]);
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

        // Récupérer l'adresse avant suppression
        const { data: addressToDelete, error: selectError } = await supabase
            .from("addresses")
            .select("id, is_default")
            .eq("id", id);

        if (selectError || !addressToDelete || addressToDelete.length === 0) {
            return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 });
        }

        // Si c'est l'adresse par défaut, d'abord la désactiver
        if (addressToDelete[0].is_default) {
            const { error: unsetError } = await supabase
                .from("addresses")
                .update({ is_default: false })
                .eq("id", id);

            if (unsetError) {
                console.error("Erreur unsetting default flag:", unsetError);
                return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
            }
        }

        // Supprimer l'adresse (RLS policies ensure user can only delete their own)
        const { error: deleteError } = await supabase
            .from("addresses")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("Erreur delete address:", deleteError);
            return NextResponse.json({
                error: "Erreur lors de la suppression",
                details: deleteError.message
            }, { status: 500 });
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