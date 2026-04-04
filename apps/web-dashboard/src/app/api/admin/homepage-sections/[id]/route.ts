import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

/**
 * PATCH  /api/admin/homepage-sections/[id] — update a section
 * DELETE /api/admin/homepage-sections/[id] — delete a section
 */

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { ctx, error } = await withAdmin();
    if (error) return error;

    const body = await request.json();
    const { title, subtitle, type, auto_rule, restaurant_ids, display_style, sort_order, is_active, starts_at, ends_at } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined)          updates.title = title.trim();
    if (subtitle !== undefined)       updates.subtitle = subtitle?.trim() || null;
    if (type !== undefined)           updates.type = type;
    if (auto_rule !== undefined)      updates.auto_rule = auto_rule || null;
    if (restaurant_ids !== undefined) updates.restaurant_ids = restaurant_ids;
    if (display_style !== undefined)  updates.display_style = display_style;
    if (sort_order !== undefined)     updates.sort_order = sort_order;
    if (is_active !== undefined)      updates.is_active = is_active;
    if (starts_at !== undefined)      updates.starts_at = starts_at || null;
    if (ends_at !== undefined)        updates.ends_at = ends_at || null;

    const { data, error: dbErr } = await ctx.supabase
        .from("homepage_sections")
        .update(updates)
        .eq("id", params.id)
        .select()
        .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ section: data });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { ctx, error } = await withAdmin();
    if (error) return error;

    const { error: dbErr } = await ctx.supabase
        .from("homepage_sections")
        .delete()
        .eq("id", params.id);

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}
