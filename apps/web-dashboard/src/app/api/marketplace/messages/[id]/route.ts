import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/marketplace/messages/[id]
 * Fournisseur : marquer comme lu ou répondre
 * Restaurant  : archiver
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

        const body = await request.json();
        const { status, reply_body } = body;

        const ALLOWED = ["read", "replied", "archived"];
        if (!status || !ALLOWED.includes(status)) {
            return NextResponse.json(
                { error: `Statut invalide. Valeurs: ${ALLOWED.join(", ")}` },
                { status: 400 }
            );
        }

        // Vérifier si c'est le fournisseur ou le restaurant
        const [{ data: supplier }, { data: restaurant }] = await Promise.all([
            supabase.from("suppliers").select("id").eq("user_id", user.id).single(),
            supabase.from("restaurants").select("id").eq("owner_id", user.id).single(),
        ]);

        const updates: Record<string, unknown> = { status };
        if (reply_body && status === "replied") {
            updates.reply_body  = reply_body;
            updates.replied_at  = new Date().toISOString();
        }

        let query = (supabase as any)
            .from("supplier_messages")
            .update(updates)
            .eq("id", id);

        // Filtrer selon le rôle
        if (supplier) {
            query = query.eq("supplier_id", supplier.id);
        } else if (restaurant) {
            query = query.eq("restaurant_id", restaurant.id);
        } else {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const { data, error } = await query.select().single();

        if (error) {
            console.error("PATCH /api/marketplace/messages/[id] error:", error);
            return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: data });
    } catch (err) {
        console.error("PATCH /api/marketplace/messages/[id] error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
