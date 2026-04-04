import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

/**
 * GET  /api/admin/homepage-sections  — list all sections (including inactive)
 * POST /api/admin/homepage-sections  — create a section
 * PATCH /api/admin/homepage-sections — bulk update sort_order
 */

export async function GET() {
    const { ctx, error } = await withAdmin();
    if (error) return error;

    const { data, error: dbErr } = await ctx.supabase
        .from("homepage_sections")
        .select("*")
        .order("sort_order", { ascending: true });

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ sections: data ?? [] });
}

export async function POST(request: NextRequest) {
    const { ctx, error } = await withAdmin();
    if (error) return error;

    const body = await request.json();
    const { title, subtitle, type, auto_rule, restaurant_ids, display_style, sort_order, is_active, starts_at, ends_at } = body;

    if (!title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    if (!["auto", "manual", "seasonal"].includes(type)) return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    // auto type requires an auto_rule; manual & seasonal are more flexible
    if (type === "auto" && !auto_rule) return NextResponse.json({ error: "Règle automatique requise pour le type Auto" }, { status: 400 });

    const { data, error: dbErr } = await ctx.supabase
        .from("homepage_sections")
        .insert({
            title: title.trim(),
            subtitle: subtitle?.trim() || null,
            type,
            // auto sections always use auto_rule; seasonal can use either; manual uses neither
            auto_rule: type === "manual" ? null : (auto_rule || null),
            // manual sections use restaurant_ids; seasonal can optionally use them too
            restaurant_ids: (type === "manual" || type === "seasonal") ? (restaurant_ids?.length ? restaurant_ids : null) : null,
            display_style: display_style ?? "cards",
            sort_order: sort_order ?? 99,
            is_active: is_active ?? true,
            starts_at: starts_at || null,
            ends_at: ends_at || null,
        })
        .select()
        .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ section: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
    const { ctx, error } = await withAdmin();
    if (error) return error;

    // Bulk sort_order update: [{ id, sort_order }]
    const body = await request.json();
    const updates: { id: string; sort_order: number }[] = body.updates ?? [];

    const results = await Promise.all(
        updates.map(({ id, sort_order }) =>
            ctx.supabase
                .from("homepage_sections")
                .update({ sort_order })
                .eq("id", id)
        )
    );

    const hasError = results.some((r) => r.error);
    if (hasError) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });

    return NextResponse.json({ ok: true });
}
