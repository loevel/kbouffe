import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { pushOrderStatusChange } from "@/lib/firebase/order-push";

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
            .select("id, status, customer_id, restaurant_id, total")
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

        // Push restaurant + client (fire-and-forget)
        const adminDb = await createAdminClient();
        const { data: restInfo } = await adminDb
            .from("restaurants")
            .select("name")
            .eq("id", typedOrder.restaurant_id)
            .maybeSingle();

        pushOrderStatusChange(adminDb, "cancelled", {
            orderId: id,
            orderRef: "",
            restaurantId: typedOrder.restaurant_id,
            restaurantName: String((restInfo as any)?.name ?? "Restaurant"),
            customerId: user.id,
            total: Number(typedOrder.total ?? 0),
        }).catch(() => {});

        return NextResponse.json({ success: true, message: "Commande annulée" });
    } catch (error) {
        console.error("Erreur API cancel order:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de l'annulation" },
            { status: 500 }
        );
    }
}
