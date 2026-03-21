import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/showcase/[restaurantId]/reorder
 * Body: { order: [{ id: string, display_order: number }] }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string }> }
) {
    try {
        const { restaurantId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const admin = await createAdminClient();

        const { data: restaurant } = await admin
            .from("restaurants")
            .select("owner_id")
            .eq("id", restaurantId)
            .single();

        if (!restaurant || restaurant.owner_id !== user.id) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const body = await request.json();
        const items: Array<{ id: string; display_order: number }> = body.order;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "order[] requis" }, { status: 400 });
        }

        // Update each section's display_order
        const promises = items.map(({ id, display_order }) =>
            admin
                .from("showcase_sections")
                .update({ display_order })
                .eq("id", id)
                .eq("restaurant_id", restaurantId)
        );

        await Promise.all(promises);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Showcase Reorder] Unexpected:", error);
        return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
    }
}
