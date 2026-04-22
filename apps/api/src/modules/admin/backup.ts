import { Hono } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

const MAX_EXPORT_ROWS_PER_TABLE = 50_000;
const MAX_HISTORY_LIMIT = 50;

const EXPORTABLE_TABLES = {
    restaurants: { dateColumn: "created_at" },
    users: { dateColumn: "created_at" },
    orders: { dateColumn: "created_at" },
    order_items: { dateColumn: "created_at" },
    products: { dateColumn: "created_at" },
    categories: { dateColumn: "created_at" },
    reviews: { dateColumn: "created_at" },
    marketplace_purchases: { dateColumn: "created_at" },
    marketplace_services: { dateColumn: "created_at" },
    platform_integrations: { dateColumn: "created_at" },
    social_accounts: { dateColumn: "created_at" },
    social_posts: { dateColumn: "created_at" },
} as const;

type ExportableTable = keyof typeof EXPORTABLE_TABLES;
type ExportFormat = "json" | "csv";

const restoreRequestSchema = z.object({
    backup_job_id: z.string().uuid().optional(),
    restore_scope: z.enum(["full", "orders", "catalog", "users", "other"]),
    source_reference: z.string().trim().max(255).optional(),
    reason: z.string().trim().min(10, "La raison doit contenir au moins 10 caractères").max(2_000),
});

const updateRestoreRequestSchema = z.object({
    status: z.enum(["approved", "rejected", "completed", "cancelled"]),
    review_notes: z.string().trim().min(3, "Ajoutez une note de revue").max(2_000),
});

function isValidDateInput(value: string | undefined): value is string {
    if (!value) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    return Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
}

function toStartOfDayIso(value: string): string {
    return `${value}T00:00:00.000Z`;
}

function toEndOfDayIso(value: string): string {
    return `${value}T23:59:59.999Z`;
}

function getRequestedTables(raw: string | undefined): ExportableTable[] {
    if (!raw || raw === "all") {
        return Object.keys(EXPORTABLE_TABLES) as ExportableTable[];
    }

    const requested = raw
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is ExportableTable => value in EXPORTABLE_TABLES);

    return Array.from(new Set(requested));
}

function serializeCsv(rows: Array<Record<string, unknown>>): string {
    const headers = Array.from(
        rows.reduce((set, row) => {
            Object.keys(row).forEach((key) => set.add(key));
            return set;
        }, new Set<string>()),
    );

    const escapeCell = (value: unknown): string => {
        if (value === null || value === undefined) return "";
        const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
        return `"${stringValue.replace(/"/g, "\"\"")}"`;
    };

    const lines = [
        headers.join(","),
        ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
    ];

    return lines.join("\n");
}

async function updateBackupJob(
    supabase: SupabaseClient,
    jobId: string | null,
    updates: Record<string, unknown>,
): Promise<void> {
    if (!jobId) return;

    await (supabase.from("admin_backup_jobs" as never) as any)
        .update(updates)
        .eq("id", jobId);
}

export const adminBackupRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminBackupRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const supabase = c.var.supabase;

    const tableCounts = await Promise.all(
        (Object.keys(EXPORTABLE_TABLES) as ExportableTable[]).map(async (table) => {
            const { count, error } = await (supabase.from(table as never) as any)
                .select("*", { count: "exact", head: true });

            return {
                table,
                count: error ? null : (count ?? 0),
            };
        }),
    );

    const totalRows = tableCounts.reduce((sum, item) => sum + (item.count ?? 0), 0);

    const { data: recentJobs, error: jobsError } = await (supabase.from("admin_backup_jobs" as never) as any)
        .select("id, status, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(10);

    if (jobsError) {
        return c.json({ error: "Impossible de récupérer l'historique des sauvegardes" }, 500);
    }

    const recentCompletedAt = (recentJobs ?? []).find((job: { status: string }) => job.status === "completed")?.completed_at ?? null;
    const runningJobs = (recentJobs ?? []).filter((job: { status: string }) => job.status === "running").length;

    return c.json({
        tables: tableCounts,
        total_rows: totalRows,
        checked_at: new Date().toISOString(),
        jobs: {
            running: runningJobs,
            last_completed_at: recentCompletedAt,
        },
    });
});

adminBackupRoutes.get("/history", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const limit = Math.min(
        MAX_HISTORY_LIMIT,
        Math.max(1, Number.parseInt(c.req.query("limit") ?? "10", 10) || 10),
    );

    const supabase = c.var.supabase;
    const { data, error } = await (supabase.from("admin_backup_jobs" as never) as any)
        .select("id, tables, format, status, date_from, date_to, row_count, file_name, file_size_bytes, error_message, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        return c.json({ error: "Impossible de récupérer l'historique des exports" }, 500);
    }

    return c.json({
        jobs: (data ?? []).map((job: any) => ({
            id: job.id as string,
            tables: Array.isArray(job.tables) ? job.tables as string[] : [],
            format: job.format as ExportFormat,
            status: job.status as string,
            dateFrom: job.date_from as string | null,
            dateTo: job.date_to as string | null,
            rowCount: typeof job.row_count === "number" ? job.row_count : 0,
            fileName: (job.file_name as string | null) ?? null,
            fileSizeBytes: typeof job.file_size_bytes === "number" ? job.file_size_bytes : 0,
            errorMessage: (job.error_message as string | null) ?? null,
            createdAt: job.created_at as string,
            completedAt: (job.completed_at as string | null) ?? null,
        })),
    });
});

adminBackupRoutes.get("/restore-requests", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const limit = Math.min(
        MAX_HISTORY_LIMIT,
        Math.max(1, Number.parseInt(c.req.query("limit") ?? "10", 10) || 10),
    );

    const supabase = c.var.supabase;
    const { data, error } = await (supabase.from("admin_restore_requests" as never) as any)
        .select("id, backup_job_id, restore_scope, source_reference, reason, status, review_notes, created_at, updated_at, reviewed_at")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        return c.json({ error: "Impossible de récupérer les demandes de restauration" }, 500);
    }

    return c.json({
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
});

adminBackupRoutes.post("/restore-requests", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const raw = await parseBody(c);
    if (!raw) return c.json({ error: "Corps de la requête invalide" }, 400);
    const payload = restoreRequestSchema.safeParse(raw);
    if (!payload.success) {
        return c.json({ error: payload.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const supabase = c.var.supabase;
    const { data, error } = await (supabase.from("admin_restore_requests" as never) as any)
        .insert({
            backup_job_id: payload.data.backup_job_id ?? null,
            requested_by: c.get("userId"),
            restore_scope: payload.data.restore_scope,
            source_reference: payload.data.source_reference?.trim() || null,
            reason: payload.data.reason,
            status: "requested",
        })
        .select("id, status, created_at")
        .single();

    if (error) {
        return c.json({ error: "Impossible de créer la demande de restauration" }, 500);
    }

    await logAdminAction(c, {
        action: "create_restore_request",
        targetType: "admin_restore_request",
        targetId: data.id as string,
        details: {
            restore_scope: payload.data.restore_scope,
            backup_job_id: payload.data.backup_job_id ?? null,
        },
    });

    return c.json({
        success: true,
        request: {
            id: data.id as string,
            status: data.status as string,
            createdAt: data.created_at as string,
        },
    }, 201);
});

adminBackupRoutes.patch("/restore-requests/:id", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const raw = await parseBody(c);
    if (!raw) return c.json({ error: "Corps de la requête invalide" }, 400);
    const payload = updateRestoreRequestSchema.safeParse(raw);
    if (!payload.success) {
        return c.json({ error: payload.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const requestId = c.req.param("id");
    const supabase = c.var.supabase;

    const { data, error } = await (supabase.from("admin_restore_requests" as never) as any)
        .update({
            status: payload.data.status,
            review_notes: payload.data.review_notes,
            reviewed_by: c.get("userId"),
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("id, status, reviewed_at")
        .single();

    if (error) {
        return c.json({ error: "Impossible de mettre à jour la demande de restauration" }, 500);
    }

    await logAdminAction(c, {
        action: "update_restore_request",
        targetType: "admin_restore_request",
        targetId: requestId,
        details: payload.data,
    });

    return c.json({
        success: true,
        request: {
            id: data.id as string,
            status: data.status as string,
            reviewedAt: data.reviewed_at as string,
        },
    });
});

adminBackupRoutes.get("/export", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const requestedTables = getRequestedTables(c.req.query("tables"));
    const requestedFormat = c.req.query("format");
    const format: ExportFormat = requestedFormat === "csv" ? "csv" : "json";
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (requestedTables.length === 0) {
        return c.json({ error: "Aucune table valide demandée pour l'export" }, 400);
    }

    if (format === "csv" && requestedTables.length !== 1) {
        return c.json({ error: "Le format CSV nécessite une seule table" }, 400);
    }

    if (from && !isValidDateInput(from)) {
        return c.json({ error: "Le paramètre from doit être au format YYYY-MM-DD" }, 400);
    }

    if (to && !isValidDateInput(to)) {
        return c.json({ error: "Le paramètre to doit être au format YYYY-MM-DD" }, 400);
    }

    if (from && to && Date.parse(toStartOfDayIso(from)) > Date.parse(toEndOfDayIso(to))) {
        return c.json({ error: "La date de début doit être antérieure à la date de fin" }, 400);
    }

    const supabase = c.var.supabase;
    const startedAt = new Date().toISOString();

    const { data: backupJob, error: backupJobError } = await (supabase.from("admin_backup_jobs" as never) as any)
        .insert({
            requested_by: c.get("userId"),
            tables: requestedTables,
            format,
            status: "running",
            date_from: from ?? null,
            date_to: to ?? null,
        })
        .select("id")
        .single();

    if (backupJobError) {
        return c.json({ error: "Impossible d'initialiser la sauvegarde" }, 500);
    }

    const backupJobId = backupJob.id as string;
    let exportedRowCount = 0;

    const exportedTables: Partial<Record<ExportableTable, Array<Record<string, unknown>>>> = {};

    for (const table of requestedTables) {
        const config = EXPORTABLE_TABLES[table];
        let query = (supabase.from(table as never) as any)
            .select("*")
            .limit(MAX_EXPORT_ROWS_PER_TABLE);

        if (config.dateColumn && from) {
            query = query.gte(config.dateColumn, toStartOfDayIso(from));
        }
        if (config.dateColumn && to) {
            query = query.lte(config.dateColumn, toEndOfDayIso(to));
        }
        if (config.dateColumn) {
            query = query.order(config.dateColumn, { ascending: false });
        }

        const { data, error } = await query;
        if (error) {
            await updateBackupJob(c.var.supabase, backupJobId, {
                status: "failed",
                error_message: `Échec export table ${table}: ${error.message}`,
                completed_at: new Date().toISOString(),
            });
            return c.json({ error: `Impossible d'exporter la table ${table}` }, 500);
        }

        const rows = (data ?? []) as Array<Record<string, unknown>>;
        exportedTables[table] = rows;
        exportedRowCount += rows.length;
    }

    const fileDate = startedAt.slice(0, 10);
    const tableSuffix = requestedTables.length === 1 ? requestedTables[0] : "all";
    const fileName = `kbouffe-backup-${tableSuffix}-${fileDate}.${format}`;

    const body = format === "csv"
        ? serializeCsv(exportedTables[requestedTables[0]] ?? [])
        : JSON.stringify({
            exportedAt: startedAt,
            filters: { from: from ?? null, to: to ?? null },
            limitPerTable: MAX_EXPORT_ROWS_PER_TABLE,
            tables: exportedTables,
        }, null, 2);

    const fileSizeBytes = new TextEncoder().encode(body).byteLength;

    await updateBackupJob(c.var.supabase, backupJobId, {
        status: "completed",
        row_count: exportedRowCount,
        file_name: fileName,
        file_size_bytes: fileSizeBytes,
        completed_at: new Date().toISOString(),
    });

    await logAdminAction(c, {
        action: "export_backup",
        targetType: "admin_backup_job",
        targetId: backupJobId,
        details: {
            format,
            tables: requestedTables,
            row_count: exportedRowCount,
            file_name: fileName,
        },
    });

    return new Response(body, {
        headers: {
            "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${fileName}"`,
        },
    });
});
