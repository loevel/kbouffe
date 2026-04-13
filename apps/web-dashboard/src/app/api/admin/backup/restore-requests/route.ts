/**
 * GET  /api/admin/backup/restore-requests
 * POST /api/admin/backup/restore-requests
 * Lists and creates restore requests for the admin backup page.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, apiError } from "@/lib/api/helpers";

const MAX_HISTORY_LIMIT = 50;

const restoreRequestSchema = z.object({
    backup_job_id: z.string().uuid().optional(),
    restore_scope: z.enum(["full", "orders", "catalog", "users", "other"]),
    source_reference: z.string().trim().max(255).optional(),
    reason: z.string().trim().min(10, "La raison doit contenir au moins 10 caractères").max(2000),
});

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
        MAX_HISTORY_LIMIT,
        Math.max(1, Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10),
    );

    try {
        const { data, error } = await db
            .from("admin_restore_requests")
            .select("id, backup_job_id, restore_scope, source_reference, reason, status, review_notes, created_at, updated_at, reviewed_at")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("[GET /api/admin/backup/restore-requests]", error);
            return apiError("Impossible de récupérer les demandes de restauration");
        }

        return NextResponse.json({
            requests: (data ?? []).map((request: any) => ({
                id: request.id as string,
                backupJobId: (request.backup_job_id as string | null) ?? null,
                restoreScope: request.restore_scope as string,
                sourceReference: (request.source_reference as string | null) ?? null,
                reason: request.reason as string,
                status: request.status as string,
                reviewNotes: (request.review_notes as string | null) ?? null,
                createdAt: request.created_at as string,
                updatedAt: request.updated_at as string,
                reviewedAt: (request.reviewed_at as string | null) ?? null,
            })),
        });
    } catch (err) {
        console.error("[GET /api/admin/backup/restore-requests] unexpected:", err);
        return apiError("Impossible de récupérer les demandes de restauration");
    }
}

export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { userId, supabase } = auth.ctx;
    const db = supabase as any;

    try {
        const body = await request.json();
        const parsed = restoreRequestSchema.safeParse(body);

        if (!parsed.success) {
            return apiError(parsed.error.issues[0]?.message ?? "Données invalides", 400);
        }

        const { data, error } = await db
            .from("admin_restore_requests")
            .insert({
                backup_job_id: parsed.data.backup_job_id ?? null,
                requested_by: userId,
                restore_scope: parsed.data.restore_scope,
                source_reference: parsed.data.source_reference?.trim() || null,
                reason: parsed.data.reason,
                status: "requested",
            })
            .select("id, status, created_at")
            .single();

        if (error || !data) {
            console.error("[POST /api/admin/backup/restore-requests]", error);
            return apiError("Impossible de créer la demande de restauration");
        }

        return NextResponse.json({
            success: true,
            request: {
                id: data.id as string,
                status: data.status as string,
                createdAt: data.created_at as string,
            },
        });
    } catch (err) {
        console.error("[POST /api/admin/backup/restore-requests] unexpected:", err);
        return apiError("Impossible de créer la demande de restauration");
    }
}
