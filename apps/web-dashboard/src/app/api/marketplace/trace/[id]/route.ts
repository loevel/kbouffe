import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/marketplace/trace/[id]/status
 * Permet au restaurant de mettre à jour le statut d'une trace
 * (ex : marquer comme livrée après réception physique)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("id")
            .eq("owner_id", user.id)
            .single();

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
        }

        const body = await request.json();
        const { delivery_status, actual_delivery_date, notes } = body;

        const ALLOWED_STATUSES = ["confirmed", "delivered", "cancelled", "disputed"];
        if (!delivery_status || !ALLOWED_STATUSES.includes(delivery_status)) {
            return NextResponse.json(
                { error: `Statut invalide. Valeurs acceptées : ${ALLOWED_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }

        const updates: Record<string, unknown> = { delivery_status };
        if (actual_delivery_date) updates.actual_delivery_date = actual_delivery_date;
        if (notes !== undefined) updates.notes = notes;

        const { data, error } = await (supabase as any)
            .from("supplier_order_traces")
            .update(updates)
            .eq("id", id)
            .eq("restaurant_id", restaurant.id)
            .select()
            .single();

        if (error) {
            console.error("PATCH /api/marketplace/trace/[id] error:", error);
            return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
        }

        return NextResponse.json({ success: true, trace: data });
    } catch (err) {
        console.error("PATCH /api/marketplace/trace/[id] error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
