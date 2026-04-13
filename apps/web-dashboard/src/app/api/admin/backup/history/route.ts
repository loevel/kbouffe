/**
 * GET /api/admin/backup/history
 * Returns recent admin backup/export jobs for the dashboard history panel.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

const MAX_HISTORY_LIMIT = 50;

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
            .from("admin_backup_jobs")
            .select("id, tables, format, status, date_from, date_to, row_count, file_name, file_size_bytes, error_message, created_at, completed_at")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("[GET /api/admin/backup/history]", error);
            return apiError("Impossible de récupérer l'historique des exports");
        }

        return NextResponse.json({
            jobs: (data ?? []).map((job: any) => ({
                id: job.id as string,
                tables: Array.isArray(job.tables) ? (job.tables as string[]) : [],
                format: job.format as "json" | "csv",
                status: job.status as string,
                dateFrom: (job.date_from as string | null) ?? null,
                dateTo: (job.date_to as string | null) ?? null,
                rowCount: typeof job.row_count === "number" ? job.row_count : 0,
                fileName: (job.file_name as string | null) ?? null,
                fileSizeBytes: typeof job.file_size_bytes === "number" ? job.file_size_bytes : 0,
                errorMessage: (job.error_message as string | null) ?? null,
                createdAt: job.created_at as string,
                completedAt: (job.completed_at as string | null) ?? null,
            })),
        });
    } catch (err) {
        console.error("[GET /api/admin/backup/history] unexpected:", err);
        return apiError("Impossible de récupérer l'historique des exports");
    }
}
