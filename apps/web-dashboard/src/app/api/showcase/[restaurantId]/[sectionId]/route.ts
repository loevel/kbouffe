import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/helpers";

/**
 * PATCH /api/showcase/[restaurantId]/[sectionId]
 * Update a showcase section (title, content, settings, visibility, order).
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string; sectionId: string }> }
) {
    try {
        const { restaurantId, sectionId } = await params;
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        if (ctx.restaurantId !== restaurantId) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const admin = await createAdminClient();

        const body = await request.json();
        const updates: Record<string, unknown> = {};
        if ("title" in body) updates.title = body.title;
        if ("subtitle" in body) updates.subtitle = body.subtitle;
        if ("content" in body) updates.content = body.content;
        if ("settings" in body) updates.settings = body.settings;
        if ("is_visible" in body) updates.is_visible = body.is_visible;
        if ("display_order" in body) updates.display_order = body.display_order;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
        }

        const { data, error } = await admin
            .from("showcase_sections")
            .update(updates)
            .eq("id", sectionId)
            .eq("restaurant_id", restaurantId)
            .select()
            .single();

        if (error) {
            console.error("[Showcase PATCH] Error:", error);
            return NextResponse.json({ error: `Erreur: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[Showcase PATCH] Unexpected:", error);
        return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
    }
}

/**
 * DELETE /api/showcase/[restaurantId]/[sectionId]
 * Delete a showcase section.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string; sectionId: string }> }
) {
    try {
        const { restaurantId, sectionId } = await params;
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        if (ctx.restaurantId !== restaurantId) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const admin = await createAdminClient();

        const { error } = await admin
            .from("showcase_sections")
            .delete()
            .eq("id", sectionId)
            .eq("restaurant_id", restaurantId);

        if (error) {
            console.error("[Showcase DELETE] Error:", error);
            return NextResponse.json({ error: `Erreur: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Showcase DELETE] Unexpected:", error);
        return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
    }
}
