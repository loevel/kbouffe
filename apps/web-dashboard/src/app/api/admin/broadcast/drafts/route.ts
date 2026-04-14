/**
 * GET  /api/admin/broadcast/drafts — List all draft broadcasts
 * POST /api/admin/broadcast/drafts — Save a new draft broadcast
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";

function serviceDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { userId } = auth.ctx;

    const db = serviceDb() as any;

    const { data, error } = await db
        .from("admin_broadcast_drafts")
        .select("id, title, body, template, target_type, target_value, created_at, updated_at")
        .eq("created_by", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[GET /api/admin/broadcast/drafts]", error);
        return apiError("Erreur lors du chargement des brouillons");
    }

    return NextResponse.json({ drafts: data ?? [] });
}

export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { userId } = auth.ctx;

    const db = serviceDb() as any;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Body JSON invalide", 400);
    }

    const { id, title, bodyText, template, targetType, targetValue } = body;

    if (!title?.trim() || !bodyText?.trim()) {
        return apiError("Titre et message requis", 400);
    }

    const validTargets = ["all", "pack", "city", "active"];
    if (!validTargets.includes(targetType)) {
        return apiError("Cible invalide", 400);
    }

    try {
        const now = new Date().toISOString();

        if (id) {
            // Update existing draft
            const { error: updateError } = await db
                .from("admin_broadcast_drafts")
                .update({
                    title: title.trim(),
                    body: bodyText.trim(),
                    template: template ?? "custom",
                    target_type: targetType,
                    target_value: targetValue ?? null,
                    updated_at: now,
                })
                .eq("id", id)
                .eq("created_by", userId);

            if (updateError) throw updateError;

            return NextResponse.json({
                success: true,
                message: "Brouillon mis à jour",
                id,
            });
        } else {
            // Create new draft
            const { data, error: insertError } = await db
                .from("admin_broadcast_drafts")
                .insert({
                    created_by: userId,
                    title: title.trim(),
                    body: bodyText.trim(),
                    template: template ?? "custom",
                    target_type: targetType,
                    target_value: targetValue ?? null,
                    created_at: now,
                    updated_at: now,
                })
                .select("id")
                .single();

            if (insertError) throw insertError;

            return NextResponse.json({
                success: true,
                message: "Brouillon sauvegardé",
                id: data.id,
            }, { status: 201 });
        }
    } catch (err: any) {
        console.error("[POST /api/admin/broadcast/drafts]", err?.message);
        return apiError("Erreur lors de la sauvegarde du brouillon");
    }
}
