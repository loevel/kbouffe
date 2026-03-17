import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Check if order exists, belongs to user, and is cancellable
        const { data: order, error: fetchError } = await supabase
            .from("orders")
            .select("id, status, customer_id")
            .eq("id", id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        const typedOrder = order as any;

        if (typedOrder.customer_id !== user.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        if (typedOrder.status !== "pending") {
            return NextResponse.json(
                { error: "Seules les commandes en attente peuvent être annulées" },
                { status: 400 }
            );
        }

        // Perform cancellation
        const { error: updateError } = await (supabase as any)
            .from("orders")
            .update({ 
                status: "cancelled", 
                updated_at: new Date().toISOString() 
            })
            .eq("id", id);

        if (updateError) {
            console.error("Erreur annulation commande:", updateError);
            throw updateError;
        }

        return NextResponse.json({ success: true, message: "Commande annulée" });
    } catch (error) {
        console.error("Erreur API cancel order:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de l'annulation" },
            { status: 500 }
        );
    }
}
