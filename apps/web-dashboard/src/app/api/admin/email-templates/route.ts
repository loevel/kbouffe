/**
 * GET  /api/admin/email-templates  — Liste les modèles de courriel
 * POST /api/admin/email-templates  — Crée un modèle (super_admin uniquement)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("is_active");

    let query = db.from("email_templates").select("*");

    if (category && ["restaurant", "supplier", "client"].includes(category)) {
        query = query.eq("category", category);
    }
    if (isActive !== null) {
        query = query.eq("is_active", isActive === "true");
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("[GET /api/admin/email-templates]", error);
        return apiError("Erreur lors de la récupération des modèles de courriel");
    }

    return NextResponse.json({ templates: data ?? [], total: data?.length ?? 0 });
}

export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { supabase, userId, adminRole } = ctx;
    const db = supabase as any;

    if (adminRole !== "super_admin") {
        return NextResponse.json(
            { error: "Accès refusé. Super admin uniquement." },
            { status: 403 }
        );
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Corps de requête invalide", 400);
    }

    if (!body.name?.trim())
        return apiError("Le nom du modèle est requis", 400);
    if (!body.category || !["restaurant", "supplier", "client"].includes(body.category))
        return apiError("Catégorie invalide (restaurant, supplier, client)", 400);
    if (!body.subject?.trim())
        return apiError("L'objet du courriel est requis", 400);
    if (!body.body?.trim())
        return apiError("Le corps du courriel est requis", 400);

    const { data, error } = await db
        .from("email_templates")
        .insert({
            id: crypto.randomUUID(),
            name: body.name.trim(),
            category: body.category,
            subject: body.subject.trim(),
            body: body.body.trim(),
            variables: Array.isArray(body.variables) ? body.variables : [],
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: body.is_active ?? true,
            version: 1,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505")
            return apiError("Ce nom de modèle existe déjà", 409);
        console.error("[POST /api/admin/email-templates]", error);
        return apiError("Erreur lors de la création du modèle de courriel");
    }

    return NextResponse.json({ template: data }, { status: 201 });
}
