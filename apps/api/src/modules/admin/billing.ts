import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminBillingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

function sumAmount(list: Array<Record<string, unknown>>, key = "amount"): number {
    return list?.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) ?? 0;
}

function maskPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return phone;
    if (digits.length <= 4) return "••••";
    return `${digits.slice(0, 3)}•••${digits.slice(-2)}`;
}

function maskReference(reference: string | null | undefined): string | null {
    if (!reference) return null;
    if (reference.length <= 8) return `${reference.slice(0, 2)}••••`;
    return `${reference.slice(0, 4)}••••${reference.slice(-4)}`;
}

function getClient(env: Env) {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY as string);
}

function buildPayoutEvidence(input: {
    previousStatus?: string | null;
    nextStatus: string;
    paymentReference?: string | null;
    providerName?: string | null;
    notes?: string | null;
    actorId?: string | null;
    extra?: Record<string, unknown>;
}) {
    return {
        transition: {
            from: input.previousStatus ?? null,
            to: input.nextStatus,
        },
        payment_reference: input.paymentReference ?? null,
        provider_name: input.providerName ?? null,
        notes: input.notes ?? null,
        actor_id: input.actorId ?? null,
        ...input.extra,
    };
}

async function insertPayoutEvent(
    supabase: ReturnType<typeof getClient>,
    payload: {
        payout_id: string;
        restaurant_id: string;
        event_type: "created" | "submitted" | "processing" | "paid" | "failed" | "note" | "evidence";
        status_from?: string | null;
        status_to?: string | null;
        provider_name?: string | null;
        provider_reference?: string | null;
        evidence?: Record<string, unknown>;
        recorded_by?: string | null;
    },
) {
    const { error } = await supabase.from("payout_events" as never).insert({
        payout_id: payload.payout_id,
        restaurant_id: payload.restaurant_id,
        event_type: payload.event_type,
        status_from: payload.status_from ?? null,
        status_to: payload.status_to ?? null,
        provider_name: payload.provider_name ?? null,
        provider_reference: payload.provider_reference ?? null,
        evidence: payload.evidence ?? {},
        recorded_by: payload.recorded_by ?? null,
    } as never);

    if (error) throw error;
}

// GET /stats
adminBillingRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = getClient(c.env);
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [
        { count: totalPayCount, data: totalPaySum },
        { count: pendingPayCount, data: pendingPaySum },
        { count: completedPayCount, data: completedPaySum },
        { count: totalTxCount },
        { data: commRevSum },
        { data: totalCommSum },
        { data: subRevSum },
        { data: gmvData },
        { data: commThisMonthData },
        { data: tvaData },
    ] = await Promise.all([
        supabase.from("payouts").select("amount", { count: "exact", head: false }),
        supabase.from("payouts").select("amount", { count: "exact", head: false }).in("status", ["pending"]),
        supabase.from("payouts").select("amount", { count: "exact", head: false }).in("status", ["paid"]),
        supabase.from("ledger_entries").select("*", { count: "exact", head: true }),
        supabase.from("ledger_entries").select("amount").eq("entry_type", "order_commission").eq("direction", "in"),
        supabase.from("payouts").select("commission_amount"),
        supabase.from("ledger_entries").select("amount").eq("entry_type", "subscription").eq("direction", "in"),
        supabase.from("orders").select("total").not("status", "eq", "cancelled").gte("created_at", monthStart),
        supabase.from("ledger_entries").select("amount").eq("entry_type", "order_commission").eq("direction", "in").gte("created_at", monthStart),
        (supabase.from("platform_invoices" as never) as any).select("tva_amount").in("status", ["issued", "paid"]).gte("issued_at", monthStart),
    ]);

    return c.json({
        payouts: {
            total: totalPayCount || 0,
            totalAmount: sumAmount(totalPaySum || []),
            pending: pendingPayCount || 0,
            pendingAmount: sumAmount(pendingPaySum || []),
            completed: completedPayCount || 0,
            completedAmount: sumAmount(completedPaySum || []),
        },
        transactions: { total: totalTxCount || 0 },
        commissionRevenue: sumAmount(commRevSum || []),
        totalCommission: sumAmount(totalCommSum || [], "commission_amount"),
        subscriptionRevenue: sumAmount(subRevSum || []),
        gmv_this_month: sumAmount((gmvData || []) as Array<Record<string, unknown>>, "total"),
        commissions_this_month: sumAmount(commThisMonthData || []),
        tva_collected_this_month: sumAmount((tvaData || []) as Array<Record<string, unknown>>, "tva_amount"),
    });
});

// GET /transactions
adminBillingRoutes.get("/transactions", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = getClient(c.env);
    const typeFilter = c.req.query("type") ?? "all";
    const directionFilter = c.req.query("direction") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    let query = supabase
        .from("ledger_entries")
        .select("*, restaurant:restaurants(name)", { count: "exact" });

    if (typeFilter !== "all") query = query.eq("entry_type", typeFilter);
    if (directionFilter !== "all") query = query.eq("direction", directionFilter);

    const from = (page - 1) * limit;
    const { data, count: total, error } = await query
        .order("created_at", { ascending: false })
        .range(from, from + limit - 1);

    if (error) {
        console.error("Supabase Transactions Error:", error);
        return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const formattedData = (data || []).map((t: any) => ({
        id: t.id,
        restaurantId: t.restaurant_id,
        type: t.entry_type,
        direction: t.direction,
        amount: t.amount,
        description: t.description,
        createdAt: t.created_at,
        restaurantName: t.restaurant?.name,
    }));

    return c.json({
        data: formattedData,
        pagination: { page, limit, total: total ?? 0, totalPages: Math.ceil((total ?? 0) / limit) },
    });
});

// GET /payouts
adminBillingRoutes.get("/payouts", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = getClient(c.env);
    const statusFilter = c.req.query("status") ?? "all";
    const restaurantId = c.req.query("restaurant_id");
    const dateFrom = c.req.query("date_from");
    const dateTo = c.req.query("date_to");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));
    const sortOrder = c.req.query("order") ?? "desc";

    const normalizedStatusFilter = statusFilter === "completed" ? "paid" : statusFilter;

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    let query = supabase
        .from("payouts")
        .select("*, restaurant:restaurants(name, slug)", { count: "exact" });

    if (normalizedStatusFilter !== "all") query = query.eq("status", normalizedStatusFilter);
    if (restaurantId) query = query.eq("restaurant_id", restaurantId);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59.999Z");

    const from = (page - 1) * limit;

    const [
        { data, count: total, error },
        { data: pendingData },
        { data: paidThisMonthData },
    ] = await Promise.all([
        query.order("created_at", { ascending: sortOrder === "asc" }).range(from, from + limit - 1),
        supabase.from("payouts").select("amount").eq("status", "pending"),
        supabase.from("payouts").select("amount").in("status", ["completed", "paid"]).gte("created_at", monthStart),
    ]);

    if (error) {
        console.error("Supabase Payouts Error:", error);
        return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 }, totals: { total_pending: 0, total_paid_this_month: 0 } });
    }

    const formattedData = (data || []).map((p: any) => ({
        id: p.id,
        restaurantId: p.restaurant_id,
        amount: p.amount,
        commissionAmount: p.commission_amount,
        grossAmount: p.gross_amount,
        status: p.status,
        paymentMethod: p.payment_method,
        paymentReference: maskReference(p.payment_reference),
        recipientPhone: maskPhone(p.recipient_phone),
        recipientName: p.recipient_name,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        notes: p.notes,
        createdAt: p.created_at,
        processedAt: p.processed_at,
        completedAt: p.completed_at,
        restaurantName: p.restaurant?.name,
        restaurantSlug: p.restaurant?.slug,
    }));

    return c.json({
        data: formattedData,
        pagination: { page, limit, total: total ?? 0, totalPages: Math.ceil((total ?? 0) / limit) },
        totals: {
            total_pending: sumAmount((pendingData || []) as Array<Record<string, unknown>>),
            total_paid_this_month: sumAmount((paidThisMonthData || []) as Array<Record<string, unknown>>),
        },
    });
});

// POST /payouts/manual — must be defined BEFORE /payouts/:id to avoid route conflicts
const manualPayoutSchema = z.object({
    restaurant_id: z.string().uuid({ message: "restaurant_id doit être un UUID valide" }),
    amount: z.number().int().positive({ message: "Le montant doit être supérieur à 0" }),
    period_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "period_from doit être au format YYYY-MM-DD" }),
    period_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "period_to doit être au format YYYY-MM-DD" }),
    notes: z.string().optional(),
});

adminBillingRoutes.post("/payouts/manual", async (c) => {
    const denied = requireDomain(c, "billing:write");
    if (denied) return denied;

    const body = await c.req.json();
    const result = manualPayoutSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const { restaurant_id, amount, period_from, period_to, notes } = result.data;

    if (new Date(period_from) > new Date(period_to)) {
        return c.json({ error: "period_from doit être antérieure à period_to" }, 400);
    }

    const supabase = getClient(c.env);

    const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("name, payment_account_id")
        .eq("id", restaurant_id)
        .single();

    if (restError || !restaurant) {
        return c.json({ error: "Restaurant introuvable" }, 404);
    }

    const { data, error } = await supabase
        .from("payouts")
        .insert({
            restaurant_id,
            amount,
            gross_amount: amount,
            commission_amount: 0,
            status: "pending",
            payment_method: "manual",
            provider_name: "manual",
            recipient_phone: (restaurant as any).payment_account_id ?? null,
            recipient_name: (restaurant as any).name ?? null,
            period_start: period_from,
            period_end: period_to,
            notes: notes ?? "Versement manuel créé par un administrateur",
            provider_evidence: {
                source: "admin/manual-payout",
                created_by: c.var.userId,
                period_from,
                period_to,
                notes: notes ?? null,
            },
        })
        .select("id, amount, status, created_at")
        .single();

    if (error) {
        console.error("Manual payout insert error:", error);
        return c.json({ error: "Impossible de créer le versement" }, 500);
    }

    await insertPayoutEvent(supabase, {
        payout_id: (data as any).id,
        restaurant_id,
        event_type: "created",
        status_to: "pending",
        provider_name: "manual",
        evidence: buildPayoutEvidence({
            nextStatus: "pending",
            providerName: "manual",
            notes: notes ?? null,
            actorId: c.var.userId,
            extra: { amount, period_from, period_to },
        }),
        recorded_by: c.var.userId,
    });

    await logAdminAction(c, {
        action: "create_manual_payout",
        targetType: "payout",
        targetId: (data as any).id,
        details: { restaurant_id, amount, period_from, period_to },
    });

    return c.json({ success: true, payout: data }, 201);
});

// PATCH /payouts/:id
const updatePayoutSchema = z.object({
    status: z.enum(["paid", "failed", "processing", "completed"], { message: "Statut invalide : doit être 'paid', 'processing', 'completed' ou 'failed'" }),
    payment_reference: z.string().optional(),
    notes: z.string().optional(),
    provider_name: z.string().trim().min(1).max(80).optional(),
}).refine(
    (data) => !(data.status === "failed" && !data.notes?.trim()),
    { message: "Les notes sont requises pour marquer un versement comme échoué", path: ["notes"] },
).refine(
    (data) => !(data.status === "paid" && !data.payment_reference?.trim()),
    { message: "payment_reference est requis pour marquer un versement comme payé", path: ["payment_reference"] },
);

adminBillingRoutes.patch("/payouts/:id", async (c) => {
    const denied = requireDomain(c, "billing:write");
    if (denied) return denied;

    const payoutId = c.req.param("id");
    const body = await c.req.json();
    const result = updatePayoutSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const { status, payment_reference, notes, provider_name } = result.data;
    const supabase = getClient(c.env);

    const { data: current, error: fetchError } = await supabase
        .from("payouts")
        .select("id, restaurant_id, status, provider_reference, provider_name")
        .eq("id", payoutId)
        .maybeSingle();

    if (fetchError || !current) return c.json({ error: "Versement introuvable" }, 404);

    const nextStatus = status === "completed" ? "paid" : status === "processing" ? "pending" : status;
    const updates: Record<string, unknown> = {
        status: nextStatus,
        processed_by: c.var.userId,
        provider_name: provider_name ?? (current as any).provider_name ?? "mtn_momo",
    };
    if (payment_reference?.trim()) {
        updates.payment_reference = payment_reference.trim();
        updates.provider_reference = payment_reference.trim();
    }
    if (notes?.trim()) updates.notes = notes.trim();
    if (nextStatus === "pending") {
        updates.processed_at = new Date().toISOString();
    }
    if (nextStatus === "paid") {
        updates.processed_at = new Date().toISOString();
        updates.completed_at = new Date().toISOString();
    }
    if (nextStatus === "failed") {
        updates.processed_at = new Date().toISOString();
        updates.provider_evidence = buildPayoutEvidence({
            previousStatus: (current as any).status,
            nextStatus,
            paymentReference: payment_reference ?? null,
            providerName: provider_name ?? (current as any).provider_name ?? "mtn_momo",
            notes: notes ?? null,
            actorId: c.var.userId,
        });
    }

    const { data: updated, error } = await supabase
        .from("payouts")
        .update(updates)
        .eq("id", payoutId)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await insertPayoutEvent(supabase, {
        payout_id: payoutId,
        restaurant_id: (current as any).restaurant_id,
        event_type: nextStatus === "paid" ? "paid" : nextStatus === "failed" ? "failed" : "processing",
        status_from: (current as any).status,
        status_to: status === "processing" ? "pending" : nextStatus,
        provider_name: provider_name ?? (current as any).provider_name ?? "mtn_momo",
        provider_reference: payment_reference?.trim() ?? (current as any).provider_reference ?? null,
        evidence: buildPayoutEvidence({
            previousStatus: (current as any).status,
            nextStatus,
            paymentReference: payment_reference ?? (current as any).provider_reference ?? null,
            providerName: provider_name ?? (current as any).provider_name ?? "mtn_momo",
            notes: notes ?? null,
            actorId: c.var.userId,
        }),
        recorded_by: c.var.userId,
    });

    await logAdminAction(c, {
        action: "update_payout_status",
        targetType: "payout",
        targetId: payoutId,
        details: { status: nextStatus, payment_reference, notes, provider_name },
    });

    return c.json({ success: true, payout: updated });
});

// GET /payouts/:id/retry
adminBillingRoutes.get("/payouts/:id/retry", async (c) => {
    const denied = requireDomain(c, "billing:write");
    if (denied) return denied;

    const payoutId = c.req.param("id");
    const supabase = getClient(c.env);

    const { data: payout, error: fetchError } = await supabase
        .from("payouts")
        .select("id, status, amount, recipient_phone, restaurant_id")
        .eq("id", payoutId)
        .single();

    if (fetchError || !payout) {
        return c.json({ error: "Versement introuvable" }, 404);
    }

    if ((payout as any).status !== "failed") {
        return c.json({ error: "Seuls les versements échoués peuvent être relancés" }, 400);
    }

    const { data: updated, error: updateError } = await supabase
        .from("payouts")
        .update({
            status: "pending",
            notes: `Relancé par admin le ${new Date().toLocaleDateString("fr-FR")}`,
            processed_at: null,
            completed_at: null,
        })
        .eq("id", payoutId)
        .select("id, status, amount")
        .single();

    if (updateError) return c.json({ error: updateError.message }, 500);

    await insertPayoutEvent(supabase, {
        payout_id: payoutId,
        restaurant_id: (payout as any).restaurant_id,
        event_type: "processing",
        status_from: "failed",
        status_to: "pending",
        provider_name: "retry",
        evidence: buildPayoutEvidence({
            previousStatus: "failed",
            nextStatus: "pending",
            providerName: "retry",
            actorId: c.var.userId,
            extra: { reason: "Relance manuelle" },
        }),
        recorded_by: c.var.userId,
    });

    await logAdminAction(c, {
        action: "retry_payout",
        targetType: "payout",
        targetId: payoutId,
        details: { previous_status: "failed" },
    });

    return c.json({ success: true, payout: updated });
});

// GET /payouts/:id/events — Historique immuable du versement
adminBillingRoutes.get("/payouts/:id/events", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const payoutId = c.req.param("id");
    const supabase = getClient(c.env);

    const { data, error } = await supabase
        .from("payout_events")
        .select("id, payout_id, restaurant_id, event_type, status_from, status_to, provider_name, provider_reference, evidence, recorded_by, recorded_at, created_at")
        .eq("payout_id", payoutId)
        .order("recorded_at", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true, events: data ?? [] });
});

// PATCH /payouts — legacy backward compat with existing UI
adminBillingRoutes.patch("/payouts", async (c) => {
    const denied = requireDomain(c, "billing:write");
    if (denied) return denied;

    const body = await c.req.json().catch(() => null);
    const legacySchema = z.object({
        id: z.string().uuid(),
        status: z.enum(["paid", "failed", "processing", "completed"]),
        paymentReference: z.string().trim().optional(),
        notes: z.string().trim().optional(),
        providerName: z.string().trim().optional(),
    });
    const parsed = legacySchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0]?.message ?? "Statut invalide" }, 400);
    }

    const supabase = getClient(c.env);
    const { data: current, error: fetchError } = await supabase
        .from("payouts")
        .select("id, restaurant_id, status, provider_reference, provider_name")
        .eq("id", parsed.data.id)
        .maybeSingle();

    if (fetchError || !current) return c.json({ error: "Versement introuvable" }, 404);

    const nextStatus = parsed.data.status === "completed"
        ? "paid"
        : parsed.data.status === "processing"
            ? "pending"
            : parsed.data.status;

    if (nextStatus === "paid" && !parsed.data.paymentReference) {
        return c.json({ error: "paymentReference est requis pour marquer un versement comme payé" }, 400);
    }
    if (nextStatus === "failed" && !parsed.data.notes) {
        return c.json({ error: "Les notes sont requises pour marquer un versement comme échoué" }, 400);
    }

    const updates: Record<string, unknown> = {
        status: nextStatus,
        processed_by: c.var.userId,
        provider_name: parsed.data.providerName ?? (current as any).provider_name ?? "mtn_momo",
    };
    if (parsed.data.paymentReference) {
        updates.payment_reference = parsed.data.paymentReference;
        updates.provider_reference = parsed.data.paymentReference;
    }
    if (parsed.data.notes) updates.notes = parsed.data.notes;
    updates.processed_at = new Date().toISOString();
    if (nextStatus === "paid") updates.completed_at = new Date().toISOString();

    const { data: updated, error } = await supabase
        .from("payouts")
        .update(updates)
        .eq("id", parsed.data.id)
        .select()
        .single();

    if (error) return c.json({ error: error?.message ?? "Erreur interne" }, 500);

    await insertPayoutEvent(supabase, {
        payout_id: parsed.data.id,
        restaurant_id: (current as any).restaurant_id,
        event_type: nextStatus === "paid" ? "paid" : nextStatus === "failed" ? "failed" : "processing",
        status_from: (current as any).status,
        status_to: parsed.data.status === "processing" ? "pending" : nextStatus,
        provider_name: parsed.data.providerName ?? (current as any).provider_name ?? "mtn_momo",
        provider_reference: parsed.data.paymentReference ?? (current as any).provider_reference ?? null,
        evidence: buildPayoutEvidence({
            previousStatus: (current as any).status,
            nextStatus,
            paymentReference: parsed.data.paymentReference ?? (current as any).provider_reference ?? null,
            providerName: parsed.data.providerName ?? (current as any).provider_name ?? "mtn_momo",
            notes: parsed.data.notes ?? null,
            actorId: c.var.userId,
        }),
        recorded_by: c.var.userId,
    });

    await logAdminAction(c, {
        action: "update_payout",
        targetType: "payout",
        targetId: parsed.data.id,
        details: { status: nextStatus, paymentReference: maskReference(parsed.data.paymentReference ?? null), notes: parsed.data.notes ?? null },
    });

    return c.json({ success: true, payout: updated });
});
