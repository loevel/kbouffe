/**
 * GET /api/store/orders/[id]
 * Récupère le statut et le détail d'une commande par son ID.
 * Route PUBLIQUE — pas d'auth requise.
 * L'ID est traité comme un jeton opaque : seul le client qui connaît l'UUID
 * peut consulter sa commande.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        if (!id || id.length < 10) {
            return NextResponse.json({ error: "ID de commande invalide" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        const { data: order, error } = await supabase
            .from("orders")
            .select(
                "id, status, payment_status, delivery_type, delivery_address, customer_name, customer_phone, items, subtotal, delivery_fee, service_fee, total, created_at, updated_at, notes, table_number, restaurant_id, preparation_time_minutes, scheduled_for, delivered_at, delivery_note",
            )
            .eq("id", id)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (err) {
        console.error("[GET /api/store/orders/[id]] error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
