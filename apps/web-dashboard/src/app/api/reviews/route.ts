/**
 * POST /api/reviews
 * Soumet un avis client sur un restaurant après livraison.
 * Requiert une session Supabase active (le middleware protège /stores).
 *
 * Body: { orderId?, restaurantId, rating (1-5), comment? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // ── Body ──────────────────────────────────────────────────────────
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
        }

        const { orderId, restaurantId, rating, comment } = body as {
            orderId?: string;
            restaurantId?: string;
            rating?: number;
            comment?: string;
        };

        if (!restaurantId) {
            return NextResponse.json({ error: "restaurantId requis" }, { status: 400 });
        }
        if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "La note doit être un entier entre 1 et 5" }, { status: 400 });
        }

        const adminDb = await createAdminClient();

        // ── Vérification de la commande (si orderId fourni) ───────────────
        if (orderId) {
            const { data: order } = await adminDb
                .from("orders")
                .select("id, customer_id, restaurant_id, status")
                .eq("id", orderId)
                .single();

            if (!order) {
                return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
            }

            // Vérifie que la commande appartient au client connecté
            // (customer_id peut être null si commande passée sans compte)
            if (order.customer_id && order.customer_id !== user.id) {
                return NextResponse.json({ error: "Cette commande ne vous appartient pas" }, { status: 403 });
            }

            if (order.restaurant_id !== restaurantId) {
                return NextResponse.json({ error: "Restaurant incorrect" }, { status: 400 });
            }

            if (!["delivered", "completed", "picked_up"].includes(order.status)) {
                return NextResponse.json({ error: "Vous ne pouvez noter qu'une commande terminée" }, { status: 400 });
            }

            // Doublon ?
            const { data: existing } = await adminDb
                .from("reviews")
                .select("id")
                .eq("order_id", orderId)
                .maybeSingle();

            if (existing) {
                return NextResponse.json({ error: "Vous avez déjà laissé un avis pour cette commande" }, { status: 409 });
            }
        }

        // ── Insertion ─────────────────────────────────────────────────────
        const { data: review, error: insertError } = await adminDb
            .from("reviews")
            .insert({
                order_id: orderId ?? null,
                restaurant_id: restaurantId,
                customer_id: user.id,
                rating,
                comment: comment?.trim() || null,
                is_visible: true,
            } as any)
            .select("id, rating, comment, created_at")
            .single();

        if (insertError) {
            console.error("[POST /api/reviews] Insert error:", insertError);
            // Contrainte d'unicité → avis déjà existant
            if (insertError.code === "23505") {
                return NextResponse.json({ error: "Vous avez déjà laissé un avis pour cette commande" }, { status: 409 });
            }
            return NextResponse.json({ error: "Erreur lors de l'envoi de l'avis" }, { status: 500 });
        }

        // ── Mise à jour note moyenne du restaurant ────────────────────────
        const { data: stats } = await adminDb
            .from("reviews")
            .select("rating")
            .eq("restaurant_id", restaurantId)
            .eq("is_visible", true);

        if (stats && stats.length > 0) {
            const avg = stats.reduce((sum, r) => sum + r.rating, 0) / stats.length;
            await adminDb
                .from("restaurants")
                .update({
                    rating: Math.round(avg * 10) / 10,
                    review_count: stats.length,
                })
                .eq("id", restaurantId);
        }

        return NextResponse.json({ success: true, review }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/reviews] Unexpected error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
