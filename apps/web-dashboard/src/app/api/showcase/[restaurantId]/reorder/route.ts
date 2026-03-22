import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/helpers";

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
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        if (ctx.restaurantId !== restaurantId) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const admin = await createAdminClient();

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
