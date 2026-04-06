/**
 * GET    /api/admin/email-templates/[id]  — Récupère un modèle
 * PUT    /api/admin/email-templates/[id]  — Met à jour un modèle (super_admin)
 * DELETE /api/admin/email-templates/[id]  — Supprime un modèle (super_admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { id } = await params;

    const { data, error } = await db
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return NextResponse.json(
            { error: "Modèle de courriel non trouvé" },
            { status: 404 }
        );
    }

    return NextResponse.json({ template: data });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { supabase, adminRole } = ctx;
    const db = supabase as any;

    if (adminRole !== "super_admin") {
        return NextResponse.json(
            { error: "Accès refusé. Super admin uniquement." },
            { status: 403 }
        );
    }

    const { id } = await params;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Corps de requête invalide", 400);
    }

    const { data: existing, error: fetchError } = await db
        .from("email_templates")
        .select("version")
        .eq("id", id)
        .single();

    if (fetchError || !existing) {
        return NextResponse.json(
            { error: "Modèle de courriel non trouvé" },
            { status: 404 }
        );
    }

    if (body.category && !["restaurant", "supplier", "client"].includes(body.category)) {
        return apiError("Catégorie invalide (restaurant, supplier, client)", 400);
    }

    const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
        version: (existing.version ?? 1) + 1,
    };
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.subject !== undefined) updateData.subject = body.subject.trim();
    if (body.body !== undefined) updateData.body = body.body.trim();
    if (body.variables !== undefined) updateData.variables = Array.isArray(body.variables) ? body.variables : [];
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await db
        .from("email_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === "23505")
            return apiError("Ce nom de modèle existe déjà", 409);
        console.error("[PUT /api/admin/email-templates/[id]]", error);
        return apiError("Erreur lors de la mise à jour du modèle de courriel");
    }

    return NextResponse.json({ template: data });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { supabase, adminRole } = ctx;
    const db = supabase as any;

    if (adminRole !== "super_admin") {
        return NextResponse.json(
            { error: "Accès refusé. Super admin uniquement." },
            { status: 403 }
        );
    }

    const { id } = await params;

    const { error } = await db
        .from("email_templates")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[DELETE /api/admin/email-templates/[id]]", error);
        return apiError("Erreur lors de la suppression du modèle de courriel");
    }

    return NextResponse.json({ success: true });
}
