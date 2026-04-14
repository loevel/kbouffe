import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * DELETE /api/admin/gift-cards/:id — Deactivate a gift card
 */

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;

        const { id } = params;
        const admin = await createAdminClient();

        // Verify card exists and is admin-issued
        const { data: card, error: cardError } = await admin
            .from("gift_cards")
            .select("id, issued_by_type")
            .eq("id", id)
            .maybeSingle();

        if (cardError || !card) {
            return apiError("Carte cadeaux introuvable", 404);
        }

        if ((card as any).issued_by_type !== "admin") {
            return apiError("Seules les cartes admin peuvent être désactivées par les admins", 403);
        }

        // Deactivate
        const { error } = await admin
            .from("gift_cards")
            .update({ is_active: false, updated_at: new Date().toISOString() } as any)
            .eq("id", id);

        if (error) {
            console.error("DELETE /api/admin/gift-cards/:id error:", error);
            return apiError("Erreur lors de la désactivation", 500);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/gift-cards/:id error:", error);
        return apiError("Erreur serveur");
    }
}
