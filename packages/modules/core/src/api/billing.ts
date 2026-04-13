/**
 * API Facturation & TVA — KBouffe
 *
 * Conformité DGI Cameroun :
 *   - TVA 19,25% sur tous les services KBouffe (CGI Art.125)
 *   - Factures numérotées séquentiellement (format KBF-YYYY-MM-NNNNN)
 *   - Déclaration TVA mensuelle avec preuve de dépôt immuable
 *
 * Routes merchant (nécessitent authMiddleware) :
 *   GET  /billing/invoices            — Liste des factures du restaurant
 *   GET  /billing/invoices/:id        — Détail d'une facture
 *   GET  /billing/summary             — Résumé financier (abonnement actuel, total payé)
 *
 * Routes admin (nécessitent adminMiddleware) :
 *   GET  /admin/billing/invoices      — Toutes les factures (tous restaurants)
 *   POST /admin/billing/invoices      — Émettre une facture manuellement
 *   POST /admin/billing/invoices/subscription — Générer facture depuis abonnement
 *   GET  /admin/billing/tva-declaration       — Synthèse TVA mensuelle pour DGI
 *   POST /admin/billing/tva-declaration/file  — Déposer une déclaration mensuelle
 */

import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "./types";
import {
  computeTva,
  TVA_RATES_BY_SERVICE,
  computeTvaDeclaration,
  buildInvoiceSummary,
  formatFcfa,
  type InvoiceType,
  type PlatformInvoiceInput,
} from "./lib/tva";

// ── Helpers ───────────────────────────────────────────────────────────────

function getAdminClient(env: Env) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant");
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function startOfMonthIso(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0)).toISOString();
}

function endOfMonthIso(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999)).toISOString();
}

function buildMonthlyPeriodRange(period?: string, from?: string, to?: string) {
  if (period) {
    const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
    if (!monthMatch) {
      throw new Error("Le paramètre period doit être au format YYYY-MM");
    }

    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (month < 1 || month > 12) {
      throw new Error("Le mois de la période est invalide");
    }

    return {
      label: period,
      from: startOfMonthIso(year, month - 1),
      to: endOfMonthIso(year, month - 1),
    };
  }

  if (!from || !to) {
    throw new Error("Fournir 'period' (YYYY-MM) ou 'from' et 'to' pour un mois complet");
  }

  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Les dates de période sont invalides");
  }

  if (start.getUTCFullYear() !== end.getUTCFullYear() || start.getUTCMonth() !== end.getUTCMonth()) {
    throw new Error("La déclaration TVA doit couvrir un seul mois");
  }

  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + 1;
  const label = `${year}-${String(month).padStart(2, "0")}`;

  return {
    label,
    from: startOfMonthIso(year, month - 1),
    to: endOfMonthIso(year, month - 1),
  };
}

function fiscalIdentityReady(restaurant: Record<string, unknown> | null | undefined) {
  const kycStatus = String(restaurant?.kyc_status ?? "").toLowerCase();
  const niu = String(restaurant?.nif ?? restaurant?.kyc_niu ?? "").trim();
  const rccm = String(restaurant?.rccm ?? restaurant?.kyc_rccm ?? "").trim();

  return kycStatus === "approved" && Boolean(niu) && Boolean(rccm);
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

async function createPayoutEvent(admin: ReturnType<typeof getAdminClient>, payload: {
  payout_id: string;
  restaurant_id: string;
  event_type: "created" | "submitted" | "processing" | "paid" | "failed" | "note" | "evidence";
  status_from?: string | null;
  status_to?: string | null;
  provider_name?: string | null;
  provider_reference?: string | null;
  evidence?: Record<string, unknown>;
  recorded_by?: string | null;
}) {
  const { error } = await admin.from("payout_events" as never).insert({
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

// ── Routes merchant ───────────────────────────────────────────────────────

export const billingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /billing/invoices
billingRoutes.get("/invoices", async (c) => {
  const admin = getAdminClient(c.env);
  const restaurantId = c.var.restaurantId;

  const { data, error } = await admin
    .from("platform_invoices" as never)
    .select("id, invoice_number, invoice_type, description, amount_ht, tva_amount, amount_ttc, status, issued_at, paid_at, period_start, period_end")
    .eq("restaurant_id", restaurantId)
    .order("issued_at", { ascending: false })
    .limit(50);

  if (error) return c.json({ error: "Impossible de récupérer les factures" }, 500);

  return c.json({ success: true, invoices: data ?? [] });
});

// GET /billing/invoices/:id
billingRoutes.get("/invoices/:id", async (c) => {
  const admin = getAdminClient(c.env);
  const invoiceId = c.req.param("id");
  const restaurantId = c.var.restaurantId;

  const { data, error } = await admin
    .from("platform_invoices" as never)
    .select("*")
    .eq("id", invoiceId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (error || !data) return c.json({ error: "Facture introuvable" }, 404);

  const breakdown = computeTva((data as any).amount_ht, (data as any).tva_rate === 0);
  const summary = buildInvoiceSummary(breakdown);

  return c.json({ success: true, invoice: data, summary });
});

// GET /billing/summary
billingRoutes.get("/summary", async (c) => {
  const admin = getAdminClient(c.env);
  const restaurantId = c.var.restaurantId;

  const [plansRes, invoicesRes] = await Promise.all([
    admin.from("saas_plans" as never).select("id, name, price_ht, price_ttc, tva_rate, billing_cycle"),
    admin.from("platform_invoices" as never)
      .select("amount_ht, tva_amount, amount_ttc, status")
      .eq("restaurant_id", restaurantId)
      .in("status", ["issued", "paid"]),
  ]);

  const invoices = (invoicesRes.data ?? []) as Array<{ amount_ht: number; tva_amount: number; amount_ttc: number; status: string }>;
  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = invoices.filter((i) => i.status === "issued");

  return c.json({
    success: true,
    summary: {
      plans: plansRes.data ?? [],
      total_paid_ttc: paid.reduce((s, i) => s + i.amount_ttc, 0),
      total_paid_tva: paid.reduce((s, i) => s + i.tva_amount, 0),
      total_outstanding_ttc: outstanding.reduce((s, i) => s + i.amount_ttc, 0),
      invoice_count: invoices.length,
    },
  });
});

// ── Routes admin ──────────────────────────────────────────────────────────

export const adminBillingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /admin/billing/invoices
adminBillingRoutes.get("/invoices", async (c) => {
  const admin = getAdminClient(c.env);
  const { status, type, from, to, restaurant_id } = c.req.query();
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50")));

  let query = (admin.from("platform_invoices" as never) as any)
    .select("id, invoice_number, invoice_type, restaurant_id, restaurant_name, description, amount_ht, tva_amount, amount_ttc, status, issued_at, paid_at", { count: "exact" })
    .order("issued_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq("status", status);
  if (type)   query = query.eq("invoice_type", type);
  if (from)   query = query.gte("issued_at", from);
  if (to)     query = query.lte("issued_at", to);
  if (restaurant_id) query = query.eq("restaurant_id", restaurant_id);

  const { data, count: total, error } = await query;
  if (error) return c.json({ error: "Erreur récupération factures admin" }, 500);

  return c.json({
    success: true,
    invoices: data ?? [],
    pagination: { page, limit, total: total ?? 0, totalPages: Math.ceil((total ?? 0) / limit) },
  });
});

// POST /admin/billing/invoices — Émettre une facture manuellement
adminBillingRoutes.post("/invoices", async (c) => {
  const body = await c.req.json<PlatformInvoiceInput>();

  if (!body.restaurant_id || !body.description || body.amount_ht === undefined) {
    return c.json({ error: "restaurant_id, description et amount_ht sont requis" }, 400);
  }
  if (body.amount_ht < 0) {
    return c.json({ error: "amount_ht doit être positif" }, 400);
  }

  const admin = getAdminClient(c.env);

  // Récupérer infos restaurant pour snapshot fiscal
  const { data: resto } = await admin
    .from("restaurants")
    .select("name, address, nif, rccm, kyc_status, kyc_niu, kyc_rccm")
    .eq("id", body.restaurant_id)
    .single();

  if (!fiscalIdentityReady(resto as Record<string, unknown> | null | undefined)) {
    return c.json({
      error: "Identité fiscale du restaurant non vérifiée",
      details: "KYC approuvé et identifiants fiscaux NIU/RCCM requis avant émission de facture",
    }, 409);
  }

  const tva_rate_bps = body.tva_rate_bps ?? TVA_RATES_BY_SERVICE[body.invoice_type];
  const breakdown = computeTva(body.amount_ht, tva_rate_bps === 0);
  const invoiceNumber: string = (await admin.rpc("generate_invoice_number" as never) as any).data;

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 30);  // 30 jours

  const payload = {
    invoice_number:      invoiceNumber,
    restaurant_id:       body.restaurant_id,
    invoice_type:        body.invoice_type,
    reference_type:      body.reference_type ?? null,
    reference_id:        body.reference_id ?? null,
    period_start:        body.period_start ?? null,
    period_end:          body.period_end ?? null,
    description:         body.description,
    amount_ht:           breakdown.amount_ht,
    tva_rate:            breakdown.tva_rate_bps,
    tva_amount:          breakdown.tva_amount,
    amount_ttc:          breakdown.amount_ttc,
    line_items:          body.line_items ?? null,
    status:              "issued",
    issued_at:           new Date().toISOString(),
    due_at:              dueAt.toISOString(),
    kbouffe_niu:         body.kbouffe_niu ?? c.env.KBOUFFE_NIU ?? null,
    kbouffe_rccm:        body.kbouffe_rccm ?? c.env.KBOUFFE_RCCM ?? null,
    restaurant_niu:      body.restaurant_niu  ?? (resto as any)?.nif ?? null,
    restaurant_rccm:     body.restaurant_rccm ?? (resto as any)?.rccm ?? null,
    restaurant_name:     body.restaurant_name ?? (resto as any)?.name ?? null,
    restaurant_address:  body.restaurant_address ?? (resto as any)?.address ?? null,
  };

  const { data, error } = await admin
    .from("platform_invoices" as never)
    .insert(payload as never)
    .select("id, invoice_number, amount_ht, tva_amount, amount_ttc, status")
    .single();

  if (error) {
    console.error("billing invoice insert error:", error);
    return c.json({ error: "Impossible de créer la facture" }, 500);
  }

  return c.json({ success: true, invoice: data }, 201);
});

// POST /admin/billing/invoices/subscription — Auto-générer une facture depuis un abonnement SaaS
adminBillingRoutes.post("/invoices/subscription", async (c) => {
  const body = await c.req.json<{ restaurant_id: string; plan_id: string; period_start: string; period_end: string }>();
  if (!body.restaurant_id || !body.plan_id) {
    return c.json({ error: "restaurant_id et plan_id sont requis" }, 400);
  }

  const admin = getAdminClient(c.env);

  const { data: plan } = await admin
    .from("saas_plans" as never)
    .select("id, name, price_ht, tva_rate")
    .eq("id", body.plan_id)
    .single();

  if (!plan) return c.json({ error: "Plan SaaS introuvable" }, 404);

  const planData = plan as { id: string; name: string; price_ht: number; tva_rate: number };

  if (planData.price_ht === 0) {
    return c.json({ error: "Le plan Starter est gratuit, pas de facture à émettre" }, 400);
  }

  // Générer la facture via la route POST /invoices
  const invoiceReq = new Request("http://internal/admin/billing/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurant_id: body.restaurant_id,
      invoice_type: "subscription" as InvoiceType,
      reference_type: "saas_plan",
      reference_id: planData.id,
      period_start: body.period_start,
      period_end: body.period_end,
      description: `Abonnement KBouffe — Plan ${planData.name}`,
      amount_ht: planData.price_ht,
      tva_rate_bps: planData.tva_rate ?? 1925,
      line_items: [{
        label: `Plan ${planData.name} — abonnement mensuel`,
        quantity: 1,
        unit_price_ht: planData.price_ht,
        tva_rate: 0.1925,
        total_ht: planData.price_ht,
        total_tva: Math.ceil(planData.price_ht * 0.1925),
        total_ttc: planData.price_ht + Math.ceil(planData.price_ht * 0.1925),
      }],
    } satisfies PlatformInvoiceInput),
  });

  return adminBillingRoutes.fetch(invoiceReq, c.env, c.executionCtx);
});

// GET /admin/billing/tva-declaration?period=2026-04  — Synthèse TVA DGI mensuelle
adminBillingRoutes.get("/tva-declaration", async (c) => {
  const admin = getAdminClient(c.env);
  const { period, from, to } = c.req.query();

  let range;
  try {
    range = buildMonthlyPeriodRange(period, from, to);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Période invalide" }, 400);
  }

  const { data, error } = await admin
    .from("platform_invoices" as never)
    .select("amount_ht, tva_amount, amount_ttc, invoice_type, status, issued_at, restaurant_name")
    .in("status", ["issued", "paid"])
    .gte("issued_at", range.from)
    .lte("issued_at", range.to)
    .order("issued_at");

  if (error) return c.json({ error: "Erreur récupération factures TVA" }, 500);

  const invoices = (data ?? []) as Array<{ amount_ht: number; tva_amount: number; amount_ttc: number; invoice_type: string; status: string; issued_at: string; restaurant_name: string }>;
  const aggregated = computeTvaDeclaration(invoices);

  // Ventilation par type de prestation
  const byType = invoices.reduce<Record<string, { count: number; total_ht: number; total_tva: number; total_ttc: number }>>((acc, inv) => {
    if (!acc[inv.invoice_type]) acc[inv.invoice_type] = { count: 0, total_ht: 0, total_tva: 0, total_ttc: 0 };
    acc[inv.invoice_type].count++;
    acc[inv.invoice_type].total_ht  += inv.amount_ht;
    acc[inv.invoice_type].total_tva += inv.tva_amount;
    acc[inv.invoice_type].total_ttc += inv.amount_ttc;
    return acc;
  }, {});

  return c.json({
    success: true,
    declaration: {
      period: range.label,
      period_start: range.from,
      period_end: range.to,
      period_type: "monthly",
      ...aggregated,
      by_type: byType,
      formatted: {
        total_ht:  formatFcfa(aggregated.total_ht),
        total_tva: formatFcfa(aggregated.total_tva),
        total_ttc: formatFcfa(aggregated.total_ttc),
        tva_rate:  "19,25 %",
        note: "Déclaration à déposer auprès de la DGI Cameroun chaque mois.",
      },
    },
    invoices,
  });
});

// POST /admin/billing/tva-declaration/file — Marquer une déclaration comme déposée
adminBillingRoutes.post("/tva-declaration/file", async (c) => {
  const body = await c.req.json<{
    period_label: string;
    period_start: string;
    period_end: string;
    dgi_reference?: string;
  }>();

  if (!body.period_label || !body.period_start || !body.period_end) {
    return c.json({ error: "period_label, period_start, period_end sont requis" }, 400);
  }

  const periodStartDate = new Date(body.period_start);
  const periodEndDate = new Date(body.period_end);
  if (
    Number.isNaN(periodStartDate.getTime()) ||
    Number.isNaN(periodEndDate.getTime()) ||
    periodStartDate.getUTCFullYear() !== periodEndDate.getUTCFullYear() ||
    periodStartDate.getUTCMonth() !== periodEndDate.getUTCMonth()
  ) {
    return c.json({ error: "La déclaration TVA doit couvrir un seul mois" }, 400);
  }

  const expectedLabel = `${periodStartDate.getUTCFullYear()}-${String(periodStartDate.getUTCMonth() + 1).padStart(2, "0")}`;
  if (body.period_label !== expectedLabel) {
    return c.json({ error: "period_label doit respecter le format YYYY-MM du mois déclaré" }, 400);
  }

  const admin = getAdminClient(c.env);
  const { data: existingDeclaration } = await admin
    .from("tva_declarations" as never)
    .select("id, status")
    .eq("period_label", body.period_label)
    .maybeSingle();

  if ((existingDeclaration as { status?: string } | null)?.status === "filed") {
    return c.json({ error: "Cette déclaration TVA mensuelle a déjà été déposée" }, 409);
  }

  // Calculer les totaux de la période
  const { data: invoices } = await admin
    .from("platform_invoices" as never)
    .select("id, invoice_number, amount_ht, tva_amount, amount_ttc, invoice_type, status, issued_at, restaurant_id, restaurant_name")
    .in("status", ["issued", "paid"])
    .gte("issued_at", body.period_start)
    .lte("issued_at", body.period_end);

  const totals = computeTvaDeclaration((invoices ?? []) as Array<{ amount_ht: number; tva_amount: number; amount_ttc: number }>);
  const filingSnapshot = {
    source: "admin/billing/tva-declaration/file",
    filed_at: new Date().toISOString(),
    period_label: body.period_label,
    period_start: body.period_start,
    period_end: body.period_end,
    invoices: (invoices ?? []).map((invoice: any) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_type: invoice.invoice_type,
      restaurant_id: invoice.restaurant_id,
      restaurant_name: invoice.restaurant_name,
      amount_ht: invoice.amount_ht,
      tva_amount: invoice.tva_amount,
      amount_ttc: invoice.amount_ttc,
      status: invoice.status,
      issued_at: invoice.issued_at,
    })),
  };

  const { data: storedDeclaration, error: storeError } = await admin
    .from("tva_declarations" as never)
    .upsert({
      period_label:   body.period_label,
      period_type:    "monthly",
      period_start:   body.period_start,
      period_end:     body.period_end,
      ...totals,
      status:         "draft",
      filed_at:       null,
      filed_by:       null,
      dgi_reference:  body.dgi_reference ?? null,
      filing_snapshot: filingSnapshot,
    } as never, { onConflict: "period_label" })
    .select()
    .single();

  if (storeError) return c.json({ error: "Erreur préparation déclaration TVA" }, 500);

  const { data, error } = await admin
    .from("tva_declarations" as never)
    .update({
      status: "filed",
      filed_at: new Date().toISOString(),
      filed_by: c.var.userId,
      dgi_reference: body.dgi_reference ?? null,
      filing_snapshot: filingSnapshot,
    } as never)
    .eq("id", (storedDeclaration as any).id)
    .select()
    .single();

  if (error) return c.json({ error: "Erreur enregistrement déclaration TVA" }, 500);

  return c.json({ success: true, declaration: data });
});
