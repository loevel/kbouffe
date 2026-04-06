/**
 * GET /api/admin/email-templates/[id]/sends  — Historique d'envoi d'un modèle
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

export async function GET(
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

    const { id: templateId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

    const { data: sends, error, count } = await db
        .from("email_sends")
        .select(
            "id, recipient_email, recipient_name, sent_at, opened_at, clicked_at, bounced_at",
            { count: "exact" }
        )
        .eq("template_id", templateId)
        .order("sent_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("[GET /api/admin/email-templates/[id]/sends]", error);
        return apiError("Erreur lors de la récupération des envois");
    }

    return NextResponse.json({ sends: sends ?? [], total: count ?? 0, limit, offset });
}
