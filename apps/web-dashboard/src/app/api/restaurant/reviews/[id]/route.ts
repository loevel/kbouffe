// @ts-nocheck
/**
 * PATCH /api/restaurant/reviews/[id]
 * Permet au commerçant de répondre à un avis restaurant.
 * Body: { response: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { restaurantId } = auth.ctx;

    const { id } = await params;

    let body: { response?: string };
    try {
        body = await request.json();
    } catch {
        return apiError("Corps de requête invalide", 400);
    }

    if (!body.response?.trim()) {
        return apiError("La réponse ne peut pas être vide", 400);
    }

    try {
        const adminDb = await createAdminClient();

        // Vérifier que l'avis appartient bien à ce restaurant
        const { data: review } = await adminDb
            .from("reviews")
            .select("id, restaurant_id")
            .eq("id", id)
            .single();

        if (!review) return apiError("Avis introuvable", 404);
        if (review.restaurant_id !== restaurantId) return apiError("Accès refusé", 403);

        const { error } = await adminDb
            .from("reviews")
            .update({ response: body.response.trim(), updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("[PATCH /api/restaurant/reviews/:id]", error);
            return apiError("Erreur lors de la mise à jour");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PATCH /api/restaurant/reviews/:id] unexpected", err);
        return apiError("Erreur serveur");
    }
}
