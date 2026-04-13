import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

// ── Validation schemas ───────────────────────────────────────────

const CampaignCreateSchema = z.object({
    restaurant_id: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: z.enum(["sms", "push", "banner", "email"]),
    target_audience: z.enum(["all", "customers", "inactive", "new"]),
    budget: z.number().int().positive(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Format invalide"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Format invalide"),
    content: z.string().min(1).max(500),
    cta_url: z.string().url().optional().nullable(),
    consent_required: z.boolean().optional(),
    quiet_hours_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format invalide").optional(),
    quiet_hours_end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format invalide").optional(),
    frequency_cap_per_user: z.number().int().min(0).optional(),
    frequency_window_days: z.number().int().min(1).optional(),
    suppression_enabled: z.boolean().optional(),
}).refine(data => data.end_date > data.start_date, {
    message: "La date de fin doit etre apres la date de debut",
    path: ["end_date"],
});

const CampaignUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    budget: z.number().int().positive().optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    content: z.string().min(1).max(500).optional(),
    cta_url: z.string().url().optional().nullable(),
    consent_required: z.boolean().optional(),
    quiet_hours_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format invalide").optional(),
    quiet_hours_end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format invalide").optional(),
    frequency_cap_per_user: z.number().int().min(0).optional(),
    frequency_window_days: z.number().int().min(1).optional(),
    suppression_enabled: z.boolean().optional(),
});

const CampaignStatusSchema = z.object({
    status: z.enum(["active", "paused", "ended"]),
});

function zodError(
    c: Context<{ Bindings: Env; Variables: Variables }>,
    err: z.ZodError,
): Response {
    const issue = err.issues[0];
    const field = issue?.path?.join(".") || "champ inconnu";
    const msg = issue?.message || "invalide";
    return c.json({ error: "Donnees invalides : " + field + " — " + msg }, 400) as unknown as Response;
}

export const adminMarketingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const COMPLIANCE_CAMPAIGNS = new Set(["sms", "email"]);
const DEFAULT_QUIET_HOURS_START = "20:00:00";
const DEFAULT_QUIET_HOURS_END = "08:00:00";

const complianceSchema = z.object({
    consent_required: z.boolean().optional(),
    quiet_hours_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format invalide").optional(),
    quiet_hours_end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format invalide").optional(),
    frequency_cap_per_user: z.number().int().min(0).optional(),
    frequency_window_days: z.number().int().min(1).optional(),
    suppression_enabled: z.boolean().optional(),
});

function isComplianceCampaign(type: string): boolean {
    return COMPLIANCE_CAMPAIGNS.has(type);
}

function buildCampaignCompliance(type: string, userId: string | null, input: z.infer<typeof complianceSchema> = {}) {
    const sensitive = isComplianceCampaign(type);
    return {
        consent_required: sensitive ? true : (input.consent_required ?? false),
        quiet_hours_start: input.quiet_hours_start ?? (sensitive ? DEFAULT_QUIET_HOURS_START : DEFAULT_QUIET_HOURS_START),
        quiet_hours_end: input.quiet_hours_end ?? (sensitive ? DEFAULT_QUIET_HOURS_END : DEFAULT_QUIET_HOURS_END),
        frequency_cap_per_user: sensitive
            ? Math.max(1, input.frequency_cap_per_user ?? 1)
            : (input.frequency_cap_per_user ?? 0),
        frequency_window_days: input.frequency_window_days ?? 7,
        suppression_enabled: sensitive ? true : (input.suppression_enabled ?? false),
        compliance_status: sensitive ? "ready" : "reviewed",
        compliance_checked_at: new Date().toISOString(),
        compliance_checked_by: userId,
    };
}

adminMarketingRoutes.get("/campaigns", async (c) => {
    const denied = requireDomain(c, "marketing");
    if (denied) return denied;

    const statusFilter = c.req.query("status") ?? "all";
    const typeFilter = c.req.query("type") ?? "all";
    const dateFrom = c.req.query("date_from");
    const dateTo = c.req.query("date_to");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (c.var.supabase as any)
        .from("ad_campaigns")
        .select("*, restaurants(name, slug)", { count: "exact" });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (typeFilter !== "all") query = query.eq("type", typeFilter);
    if (dateFrom) query = query.gte("starts_at", dateFrom);
    if (dateTo) query = query.lte("ends_at", dateTo);

    const { data: rawData, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) {
        console.error("Marketing query error:", error);
        return c.json({ error: "Erreur lors de la recuperation des campagnes" }, 500);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (rawData as any[])?.map((item: any) => {
        const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
        const impressions: number = item.impressions ?? 0;
        const clicks: number = item.clicks ?? 0;
        return {
            id: item.id,
            restaurantId: item.restaurant_id,
            restaurantName: restaurant?.name ?? null,
            restaurantSlug: restaurant?.slug ?? null,
            name: item.name ?? null,
            type: item.type ?? "banner",
            targetAudience: item.target_audience ?? "all",
            package: item.package,
            status: item.status,
            budget: item.budget ?? 0,
            spend: item.spend ?? 0,
            reach: item.reach ?? 0,
            impressions,
            clicks,
            ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
            conversions: item.conversions ?? 0,
            content: item.content ?? null,
            ctaUrl: item.cta_url ?? null,
            consentRequired: item.consent_required ?? false,
            quietHoursStart: item.quiet_hours_start ?? null,
            quietHoursEnd: item.quiet_hours_end ?? null,
            frequencyCapPerUser: item.frequency_cap_per_user ?? null,
            frequencyWindowDays: item.frequency_window_days ?? null,
            suppressionEnabled: item.suppression_enabled ?? false,
            complianceStatus: item.compliance_status ?? null,
            startsAt: item.starts_at,
            endsAt: item.ends_at,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        };
    });

    return c.json({
        data,
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / limit),
        },
    });
});

adminMarketingRoutes.post("/campaigns", async (c) => {
    const denied = requireDomain(c, "marketing");
    if (denied) return denied;

    const body = await c.req.json().catch(() => null);

    const parsed = CampaignCreateSchema.safeParse(body);
    if (!parsed.success) {
        return zodError(c, parsed.error);
    }

    const {
        restaurant_id, name, type, target_audience,
        budget, start_date, end_date, content, cta_url,
        consent_required, quiet_hours_start, quiet_hours_end,
        frequency_cap_per_user, frequency_window_days, suppression_enabled,
    } = parsed.data;

    const compliance = buildCampaignCompliance(type, c.var.userId, {
        consent_required,
        quiet_hours_start,
        quiet_hours_end,
        frequency_cap_per_user,
        frequency_window_days,
        suppression_enabled,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error } = await (c.var.supabase as any)
        .from("ad_campaigns")
        .insert({
            id: crypto.randomUUID(),
            restaurant_id,
            name,
            type,
            target_audience,
            package: type,
            budget,
            starts_at: new Date(start_date).toISOString(),
            ends_at: new Date(end_date).toISOString(),
            content,
            cta_url: cta_url ?? null,
            ...compliance,
            status: "active",
            spend: 0,
            reach: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error("Campaign create error:", error);
        return c.json({ error: "Impossible de creer la campagne" }, 500);
    }

    await logAdminAction(c, {
        action: "create_campaign",
        targetType: "campaign",
        targetId: campaign.id,
        details: { name, type, budget, restaurant_id },
    });

    return c.json({ success: true, campaign }, 201);
});

adminMarketingRoutes.patch("/campaigns/:id", async (c) => {
    const denied = requireDomain(c, "marketing");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);

    const parsed = CampaignUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return zodError(c, parsed.error);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentCampaign, error: fetchError } = await (c.var.supabase as any)
        .from("ad_campaigns")
        .select("id, type")
        .eq("id", id)
        .maybeSingle();

    if (fetchError || !currentCampaign) {
        return c.json({ error: "Campagne introuvable" }, 404);
    }

    if (isComplianceCampaign((currentCampaign as any).type)) {
        if (parsed.data.consent_required === false || parsed.data.suppression_enabled === false) {
            return c.json({ error: "Les campagnes SMS/email doivent conserver les garde-fous de consentement" }, 400);
        }
        if (parsed.data.frequency_cap_per_user !== undefined && parsed.data.frequency_cap_per_user < 1) {
            return c.json({ error: "La limite de fréquence doit être supérieure à zéro pour les campagnes SMS/email" }, 400);
        }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.budget !== undefined) updates.budget = parsed.data.budget;
    if (parsed.data.end_date !== undefined) updates.ends_at = new Date(parsed.data.end_date).toISOString();
    if (parsed.data.content !== undefined) updates.content = parsed.data.content;
    if (parsed.data.cta_url !== undefined) updates.cta_url = parsed.data.cta_url;
    if (parsed.data.consent_required !== undefined) updates.consent_required = parsed.data.consent_required;
    if (parsed.data.quiet_hours_start !== undefined) updates.quiet_hours_start = parsed.data.quiet_hours_start;
    if (parsed.data.quiet_hours_end !== undefined) updates.quiet_hours_end = parsed.data.quiet_hours_end;
    if (parsed.data.frequency_cap_per_user !== undefined) updates.frequency_cap_per_user = parsed.data.frequency_cap_per_user;
    if (parsed.data.frequency_window_days !== undefined) updates.frequency_window_days = parsed.data.frequency_window_days;
    if (parsed.data.suppression_enabled !== undefined) updates.suppression_enabled = parsed.data.suppression_enabled;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (c.var.supabase as any)
        .from("ad_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") return c.json({ error: "Campagne introuvable" }, 404);
        return c.json({ error: "Impossible de mettre a jour la campagne" }, 500);
    }

    return c.json({ success: true, campaign: updated });
});

adminMarketingRoutes.patch("/campaigns/:id/status", async (c) => {
    const denied = requireDomain(c, "marketing");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);

    const parsed = CampaignStatusSchema.safeParse(body);
    if (!parsed.success) {
        return zodError(c, parsed.error);
    }

    const { status } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current, error: fetchError } = await (c.var.supabase as any)
        .from("ad_campaigns")
        .select("id, type, consent_required, compliance_status")
        .eq("id", id)
        .maybeSingle();

    if (fetchError || !current) {
        return c.json({ error: "Campagne introuvable" }, 404);
    }

    if (status === "active" && isComplianceCampaign((current as any).type)) {
        if ((current as any).consent_required !== true) {
            return c.json({ error: "Les contrôles de consentement doivent être activés avant publication" }, 400);
        }
        if ((current as any).compliance_status === "blocked") {
            return c.json({ error: "La campagne est bloquée pour non-conformité" }, 400);
        }
    }

    const { data: updated, error } = await c.var.supabase
        .from("ad_campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") return c.json({ error: "Campagne introuvable" }, 404);
        return c.json({ error: "Impossible de mettre a jour le statut" }, 500);
    }

    await logAdminAction(c, {
        action: "update_campaign_status",
        targetType: "campaign",
        targetId: id,
        details: { status },
    });

    return c.json({ success: true, status: updated.status });
});

adminMarketingRoutes.get("/campaigns/:id/stats", async (c) => {
    const denied = requireDomain(c, "marketing");
    if (denied) return denied;

    const id = c.req.param("id");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error } = await (c.var.supabase as any)
        .from("ad_campaigns")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !campaign) {
        return c.json({ error: "Campagne introuvable" }, 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cam = campaign as any;
    const impressions: number = cam.impressions ?? 0;
    const clicks: number = cam.clicks ?? 0;
    const spend: number = cam.spend ?? 0;
    const reach: number = cam.reach ?? 0;
    const conversions: number = cam.conversions ?? 0;
    const budget: number = cam.budget ?? 0;
    const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;
    const roi = spend > 0 && conversions > 0
        ? parseFloat(((conversions * 2500 - spend) / spend * 100).toFixed(1))
        : 0;

    return c.json({
        campaign: {
            id: cam.id,
            name: cam.name,
            status: cam.status,
            startsAt: cam.starts_at,
            endsAt: cam.ends_at,
        },
        stats: {
            impressions,
            clicks,
            ctr,
            reach,
            spend,
            budget,
            budgetUsedPct: budget > 0 ? parseFloat(((spend / budget) * 100).toFixed(1)) : 0,
            conversions,
            roi,
        },
    });
});
