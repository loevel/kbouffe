import { Hono } from "hono";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";
import { escapeIlike } from "../../lib/search";

export const adminSystemRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const REPORT_TYPES = [
    "platform_overview",
    "revenue_operations",
    "billing_summary",
    "backup_activity",
    "audit_summary",
] as const;

const REPORT_FREQUENCIES = ["daily", "weekly", "monthly"] as const;

const reportScheduleSchema = z.object({
    name: z.string().trim().min(3, "Le nom doit contenir au moins 3 caractères").max(120),
    report_type: z.enum(REPORT_TYPES),
    format: z.enum(["json", "csv"]),
    frequency: z.enum(REPORT_FREQUENCIES),
    timezone: z.string().trim().min(1).max(64).default("Africa/Douala"),
    recipients: z.array(z.string().email("Adresse email invalide")).min(1, "Ajoutez au moins un destinataire").max(10),
    filters: z.record(z.string(), z.unknown()).default({}),
    delivery_hour: z.number().int().min(0).max(23).default(8),
    delivery_minute: z.number().int().min(0).max(59).default(0),
    day_of_week: z.number().int().min(0).max(6).nullable().optional(),
    day_of_month: z.number().int().min(1).max(28).nullable().optional(),
    is_active: z.boolean().optional(),
}).superRefine((value, ctx) => {
    if (value.frequency === "weekly" && value.day_of_week == null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["day_of_week"],
            message: "Le jour de semaine est requis pour une fréquence hebdomadaire",
        });
    }
    if (value.frequency === "monthly" && value.day_of_month == null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["day_of_month"],
            message: "Le jour du mois est requis pour une fréquence mensuelle",
        });
    }
});

adminSystemRoutes.get("/audit", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const search = c.req.query("search") ?? "";
    const adminId = c.req.query("admin_id") ?? "";
    const actionFilter = c.req.query("action") ?? "all";
    const targetFilter = c.req.query("target") ?? "all";
    const dateFrom = c.req.query("date_from") ?? "";
    const dateTo = c.req.query("date_to") ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50")));

    let query = c.var.supabase
        .from("admin_audit_log")
        .select(`
            id, admin_id, action, target_type, target_id, details, ip_address, user_agent, created_at,
            users!admin_audit_log_admin_id_fkey(email, full_name, admin_role)
        `, { count: "exact" });

    if (search) {
        const s = escapeIlike(String(search).slice(0, 100));
        query = query.or([
            `action.ilike.%${s}%`,
            `target_id.ilike.%${s}%`,
            `target_type.ilike.%${s}%`,
            `ip_address.ilike.%${s}%`,
        ].join(","));
    }
    if (adminId) query = query.eq("admin_id", adminId);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (targetFilter !== "all") query = query.eq("target_type", targetFilter);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

    const { data: rawData, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) {
        console.error("Audit query error:", error);
        return c.json({ error: "Erreur lors de la récupération de l'audit" }, 500);
    }

    const logs = rawData?.map(item => {
        const user = Array.isArray(item.users) ? item.users[0] : item.users;
        return {
            id: item.id,
            adminId: item.admin_id,
            adminName: user?.full_name ?? null,
            adminEmail: user?.email ?? null,
            adminRole: user?.admin_role ?? null,
            action: item.action,
            targetType: item.target_type,
            targetId: item.target_id,
            details: item.details ?? null,
            ipAddress: item.ip_address ?? null,
            userAgent: item.user_agent ?? null,
            createdAt: item.created_at,
        };
    }) ?? [];

    return c.json({
        logs,
        total: count ?? 0,
        page,
        totalPages: Math.ceil((count ?? 0) / limit),
    });
});

adminSystemRoutes.get("/audit/stats", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const { data, error } = await c.var.supabase
        .from("admin_audit_log")
        .select(`
            admin_id, action, created_at,
            users!admin_audit_log_admin_id_fkey(full_name, email, admin_role)
        `)
        .gte("created_at", weekStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

    if (error) {
        console.error("Audit stats query error:", error);
        return c.json({ error: "Erreur lors de la récupération des statistiques d'audit" }, 500);
    }

    const rows = (data ?? []) as Array<{
        admin_id: string | null;
        action: string;
        created_at: string;
        users: { full_name?: string | null; email?: string | null; admin_role?: string | null } | Array<{ full_name?: string | null; email?: string | null; admin_role?: string | null }> | null;
    }>;

    const today = rows.filter((row) => new Date(row.created_at) >= todayStart).length;
    const thisWeek = rows.length;

    const adminCounts = new Map<string, { id: string; name: string | null; email: string | null; role: string | null; count: number }>();
    const actionCounts = new Map<string, number>();

    for (const row of rows) {
        actionCounts.set(row.action, (actionCounts.get(row.action) ?? 0) + 1);
        if (!row.admin_id) continue;

        const user = Array.isArray(row.users) ? row.users[0] : row.users;
        const current = adminCounts.get(row.admin_id);
        if (current) {
            current.count += 1;
        } else {
            adminCounts.set(row.admin_id, {
                id: row.admin_id,
                name: user?.full_name ?? null,
                email: user?.email ?? null,
                role: user?.admin_role ?? null,
                count: 1,
            });
        }
    }

    const topAdmins = Array.from(adminCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const topActions = Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return c.json({
        today,
        thisWeek,
        activeAdmins: adminCounts.size,
        mostFrequentAction: topActions[0]?.action ?? null,
        topAdmins,
        topActions,
    });
});

adminSystemRoutes.get("/settings", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const { data, error } = await c.var.supabase.from("platform_settings").select("*");
    if (error) {
        console.error("Settings fetch error:", error);
        return c.json({ error: "Erreur lors de la récupération des réglages" }, 500);
    }
    return c.json(data);
});

adminSystemRoutes.put("/settings", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    if (typeof body !== "object" || body === null) {
        return c.json({ error: "Format invalide" }, 400);
    }

    const updates = Object.entries(body).map(([key, value]) => ({
        key,
        value,
        updated_by: c.var.userId,
        updated_at: new Date().toISOString()
    }));

    if (updates.length === 0) {
        return c.json({ message: "Aucun changement" });
    }

    const { data: updated, error } = await c.var.supabase
        .from("platform_settings")
        .upsert(updates)
        .select();

    if (error) {
        console.error("Settings bulk update error:", error);
        return c.json({ error: "Erreur lors de la mise à jour des réglages" }, 500);
    }

    await logAdminAction(c, {
        action: "bulk_update_settings",
        targetType: "platform_settings",
        targetId: "global",
        details: { keys: Object.keys(body) }
    });

    // Return as a key-value object to match frontend expectation
    const response = (updated as any[]).reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, any>);

    return c.json(response);
});

adminSystemRoutes.patch("/settings", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    if (!body.key || body.value === undefined) {
        return c.json({ error: "key et value requis" }, 400);
    }

    const { data: updated, error } = await c.var.supabase
        .from("platform_settings")
        .upsert({
            key: body.key,
            value: body.value,
            updated_by: c.var.userId,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error("Settings update error:", error);
        return c.json({ error: "Erreur lors de la mise à jour du réglage" }, 500);
    }

    await logAdminAction(c, {
        action: "update_setting",
        targetType: "platform_setting",
        targetId: body.key,
        details: { value: body.value }
    });

    return c.json(updated);
});

adminSystemRoutes.get("/report-schedules", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));

    const { data, error } = await (c.var.supabase.from("admin_report_schedules" as never) as any)
        .select("id, name, report_type, format, frequency, timezone, recipients, filters, delivery_hour, delivery_minute, day_of_week, day_of_month, is_active, last_run_at, next_run_at, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Report schedules fetch error:", error);
        return c.json({ error: "Erreur lors de la récupération des rapports planifiés" }, 500);
    }

    return c.json({
        schedules: (data ?? []).map((schedule: any) => ({
            id: schedule.id as string,
            name: schedule.name as string,
            reportType: schedule.report_type as string,
            format: schedule.format as string,
            frequency: schedule.frequency as string,
            timezone: schedule.timezone as string,
            recipients: Array.isArray(schedule.recipients) ? schedule.recipients as string[] : [],
            filters: schedule.filters ?? {},
            deliveryHour: schedule.delivery_hour as number,
            deliveryMinute: schedule.delivery_minute as number,
            dayOfWeek: (schedule.day_of_week as number | null) ?? null,
            dayOfMonth: (schedule.day_of_month as number | null) ?? null,
            isActive: Boolean(schedule.is_active),
            lastRunAt: (schedule.last_run_at as string | null) ?? null,
            nextRunAt: (schedule.next_run_at as string | null) ?? null,
            createdAt: schedule.created_at as string,
            updatedAt: schedule.updated_at as string,
        })),
    });
});

adminSystemRoutes.post("/report-schedules", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const raw = await parseBody(c);
    if (!raw) return c.json({ error: "Corps de la requête invalide" }, 400);
    const payload = reportScheduleSchema.safeParse(raw);
    if (!payload.success) {
        return c.json({ error: payload.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const scheduleToInsert = {
        name: payload.data.name,
        report_type: payload.data.report_type,
        format: payload.data.format,
        frequency: payload.data.frequency,
        timezone: payload.data.timezone,
        recipients: payload.data.recipients,
        filters: payload.data.filters,
        delivery_hour: payload.data.delivery_hour,
        delivery_minute: payload.data.delivery_minute,
        day_of_week: payload.data.frequency === "weekly" ? payload.data.day_of_week ?? null : null,
        day_of_month: payload.data.frequency === "monthly" ? payload.data.day_of_month ?? null : null,
        is_active: payload.data.is_active ?? true,
        created_by: c.var.userId,
        updated_by: c.var.userId,
    };

    const { data, error } = await (c.var.supabase.from("admin_report_schedules" as never) as any)
        .insert(scheduleToInsert)
        .select("id, created_at")
        .single();

    if (error) {
        console.error("Report schedule insert error:", error);
        return c.json({ error: "Erreur lors de la création du rapport planifié" }, 500);
    }

    await logAdminAction(c, {
        action: "create_report_schedule",
        targetType: "admin_report_schedule",
        targetId: data.id as string,
        details: {
            report_type: payload.data.report_type,
            frequency: payload.data.frequency,
            format: payload.data.format,
        },
    });

    return c.json({
        success: true,
        schedule: {
            id: data.id as string,
            createdAt: data.created_at as string,
        },
    }, 201);
});

adminSystemRoutes.patch("/report-schedules/:id", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const scheduleId = c.req.param("id");
    const updatesRaw = await parseBody(c);
    if (!updatesRaw) return c.json({ error: "Corps de la requête invalide" }, 400);
    if (!updatesRaw || typeof updatesRaw !== "object") {
        return c.json({ error: "Format invalide" }, 400);
    }

    const { data: existing, error: existingError } = await (c.var.supabase.from("admin_report_schedules" as never) as any)
        .select("name, report_type, format, frequency, timezone, recipients, filters, delivery_hour, delivery_minute, day_of_week, day_of_month, is_active")
        .eq("id", scheduleId)
        .single();

    if (existingError || !existing) {
        return c.json({ error: "Rapport planifié introuvable" }, 404);
    }

    const payload = reportScheduleSchema.safeParse({
        name: updatesRaw.name ?? existing.name,
        report_type: updatesRaw.report_type ?? existing.report_type,
        format: updatesRaw.format ?? existing.format,
        frequency: updatesRaw.frequency ?? existing.frequency,
        timezone: updatesRaw.timezone ?? existing.timezone,
        recipients: updatesRaw.recipients ?? existing.recipients,
        filters: updatesRaw.filters ?? existing.filters,
        delivery_hour: updatesRaw.delivery_hour ?? existing.delivery_hour,
        delivery_minute: updatesRaw.delivery_minute ?? existing.delivery_minute,
        day_of_week: updatesRaw.day_of_week ?? existing.day_of_week,
        day_of_month: updatesRaw.day_of_month ?? existing.day_of_month,
        is_active: updatesRaw.is_active ?? existing.is_active,
    });

    if (!payload.success) {
        return c.json({ error: payload.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const { data, error } = await (c.var.supabase.from("admin_report_schedules" as never) as any)
        .update({
            name: payload.data.name,
            report_type: payload.data.report_type,
            format: payload.data.format,
            frequency: payload.data.frequency,
            timezone: payload.data.timezone,
            recipients: payload.data.recipients,
            filters: payload.data.filters,
            delivery_hour: payload.data.delivery_hour,
            delivery_minute: payload.data.delivery_minute,
            day_of_week: payload.data.frequency === "weekly" ? payload.data.day_of_week ?? null : null,
            day_of_month: payload.data.frequency === "monthly" ? payload.data.day_of_month ?? null : null,
            is_active: payload.data.is_active ?? true,
            updated_by: c.var.userId,
        })
        .eq("id", scheduleId)
        .select("id, updated_at")
        .single();

    if (error) {
        console.error("Report schedule update error:", error);
        return c.json({ error: "Erreur lors de la mise à jour du rapport planifié" }, 500);
    }

    await logAdminAction(c, {
        action: "update_report_schedule",
        targetType: "admin_report_schedule",
        targetId: scheduleId,
        details: {
            frequency: payload.data.frequency,
            format: payload.data.format,
            is_active: payload.data.is_active ?? true,
        },
    });

    return c.json({
        success: true,
        schedule: {
            id: data.id as string,
            updatedAt: data.updated_at as string,
        },
    });
});

adminSystemRoutes.post("/report-schedules/:id/run", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const scheduleId = c.req.param("id");
    const { data: schedule, error: scheduleError } = await (c.var.supabase.from("admin_report_schedules" as never) as any)
        .select("id, report_type, format, recipients, filters, is_active")
        .eq("id", scheduleId)
        .single();

    if (scheduleError || !schedule) {
        return c.json({ error: "Rapport planifié introuvable" }, 404);
    }

    const { data, error } = await (c.var.supabase.from("admin_report_runs" as never) as any)
        .insert({
            schedule_id: scheduleId,
            requested_by: c.var.userId,
            report_type: schedule.report_type,
            format: schedule.format,
            recipients: schedule.recipients ?? [],
            filters: schedule.filters ?? {},
            status: "queued",
        })
        .select("id, status, created_at")
        .single();

    if (error) {
        console.error("Report run insert error:", error);
        return c.json({ error: "Erreur lors de la mise en file du rapport" }, 500);
    }

    await logAdminAction(c, {
        action: "queue_report_run",
        targetType: "admin_report_schedule",
        targetId: scheduleId,
        details: {
            report_type: schedule.report_type,
            is_active: Boolean(schedule.is_active),
            run_id: data.id as string,
        },
    });

    return c.json({
        success: true,
        run: {
            id: data.id as string,
            status: data.status as string,
            createdAt: data.created_at as string,
        },
    }, 202);
});

adminSystemRoutes.get("/report-schedules/:id/runs", async (c) => {
    const denied = requireDomain(c, "system");
    if (denied) return denied;

    const scheduleId = c.req.param("id");
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));

    const { data, error } = await (c.var.supabase.from("admin_report_runs" as never) as any)
        .select("id, report_type, format, status, recipients, filters, error_message, created_at, completed_at")
        .eq("schedule_id", scheduleId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Report runs fetch error:", error);
        return c.json({ error: "Erreur lors de la récupération des exécutions" }, 500);
    }

    return c.json({
        runs: (data ?? []).map((run: any) => ({
            id: run.id as string,
            reportType: run.report_type as string,
            format: run.format as string,
            status: run.status as string,
            recipients: Array.isArray(run.recipients) ? run.recipients as string[] : [],
            filters: run.filters ?? {},
            errorMessage: (run.error_message as string | null) ?? null,
            createdAt: run.created_at as string,
            completedAt: (run.completed_at as string | null) ?? null,
        })),
    });
});
