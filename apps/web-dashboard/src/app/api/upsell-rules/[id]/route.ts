/**
 * PATCH  /api/upsell-rules/[id] — update an upsell rule
 * DELETE /api/upsell-rules/[id] — delete an upsell rule
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const { id } = await params;

    try {
        const body = await request.json();

        // Only allow updating specific fields
        const allowedFields = [
            "trigger_type",
            "trigger_product_id",
            "trigger_category_id",
            "trigger_min_cart",
            "suggested_product_id",
            "discount_percent",
            "custom_message",
            "position",
            "priority",
            "max_suggestions",
            "is_active",
        ];

        const updates: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (key in body) updates[key] = body[key];
        }

        if (Object.keys(updates).length === 0) {
            return apiError("Aucune modification fournie", 400);
        }

        const { data, error } = await supabase
            .from("upsell_rules")
            .update(updates as any)
            .eq("id", id)
            .eq("restaurant_id", restaurantId)
            .select()
            .single();

        if (error) {
            console.error("[PATCH /api/upsell-rules/[id]]", error);
            return apiError("Erreur lors de la mise à jour");
        }

        if (!data) {
            return apiError("Règle non trouvée", 404);
        }

        return NextResponse.json({ rule: data });
    } catch (err) {
        console.error("[PATCH /api/upsell-rules/[id]] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const { id } = await params;

    const { error } = await supabase
        .from("upsell_rules")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", restaurantId);

    if (error) {
        console.error("[DELETE /api/upsell-rules/[id]]", error);
        return apiError("Erreur lors de la suppression");
    }

    return NextResponse.json({ success: true });
}
