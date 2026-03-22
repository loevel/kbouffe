import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/helpers";

/**
 * GET /api/showcase/[restaurantId]
 * Public — returns visible showcase sections for a restaurant.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string }> }
) {
    try {
        const { restaurantId } = await params;
        const admin = await createAdminClient();

        const { data, error } = await admin
            .from("showcase_sections")
            .select("id, section_type, title, subtitle, content, display_order, is_visible, settings")
            .eq("restaurant_id", restaurantId)
            .eq("is_visible", true)
            .order("display_order");

        if (error) {
            console.error("[Showcase GET] Error:", error);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }

        return NextResponse.json(data ?? []);
    } catch (error) {
        console.error("[Showcase GET] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * POST /api/showcase/[restaurantId]
 * Auth required — add a new section.
 */
export async function POST(
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
        const { section_type, title, subtitle, content, display_order, settings } = body;

        if (!section_type) {
            return NextResponse.json({ error: "Le type de section est requis" }, { status: 400 });
        }

        // Get next display_order if not provided
        let order = display_order;
        if (order == null) {
            const { data: last } = await admin
                .from("showcase_sections")
                .select("display_order")
                .eq("restaurant_id", restaurantId)
                .order("display_order", { ascending: false })
                .limit(1)
                .maybeSingle();
            order = (last?.display_order ?? -1) + 1;
        }

        const { data, error } = await admin
            .from("showcase_sections")
            .insert({
                restaurant_id: restaurantId,
                section_type,
                title: title ?? null,
                subtitle: subtitle ?? null,
                content: content ?? {},
                display_order: order,
                is_visible: true,
                settings: settings ?? {},
            })
            .select()
            .single();

        if (error) {
            console.error("[Showcase POST] Error:", error);
            return NextResponse.json({ error: `Erreur: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error("[Showcase POST] Unexpected:", error);
        return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
    }
}
