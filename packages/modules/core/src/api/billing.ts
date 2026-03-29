/**
 * API Facturation & TVA — KBouffe
 *
 * Conformité DGI Cameroun :
 *   - TVA 19,25% sur tous les services KBouffe (CGI Art.125)
 *   - Factures numérotées séquentiellement (format KBF-YYYY-MM-NNNNN)
 *   - Déclaration TVA trimestrielle obligatoire auprès de la DGI
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
 *   GET  /admin/billing/tva-declaration       — Synthèse TVA pour DGI
 *   POST /admin/billing/tva-declaration/file  — Marquer une déclaration comme déposée
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
  const { status, type, from, to } = c.req.query();

  let query = (admin.from("platform_invoices" as never) as any)
    .select("id, invoice_number, invoice_type, restaurant_id, restaurant_name, description, amount_ht, tva_amount, amount_ttc, status, issued_at, paid_at")
    .order("issued_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (type)   query = query.eq("invoice_type", type);
  if (from)   query = query.gte("issued_at", from);
  if (to)     query = query.lte("issued_at", to);

  const { data, error } = await query;
  if (error) return c.json({ error: "Erreur récupération factures admin" }, 500);

  return c.json({ success: true, invoices: data ?? [] });
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
    .select("name, address, nif, rccm")
    .eq("id", body.restaurant_id)
    .single();

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

// GET /admin/billing/tva-declaration?period=2026-Q1  — Synthèse TVA DGI
adminBillingRoutes.get("/tva-declaration", async (c) => {
  const admin = getAdminClient(c.env);
  const { period, from, to } = c.req.query();

  // Résoudre les dates si period fournie (ex: "2026-Q1")
  let dateFrom = from;
  let dateTo = to;

  if (period) {
    const match = period.match(/^(\d{4})-Q([1-4])$/);
    if (match) {
      const year = parseInt(match[1]);
      const quarter = parseInt(match[2]);
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      dateFrom = `${year}-${String(startMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(year, endMonth, 0).getDate();
      dateTo = `${year}-${String(endMonth).padStart(2, "0")}-${lastDay}`;
    }
  }

  if (!dateFrom || !dateTo) {
    return c.json({ error: "Fournir 'period' (ex: 2026-Q1) ou 'from' et 'to'" }, 400);
  }

  const { data, error } = await admin
    .from("platform_invoices" as never)
    .select("amount_ht, tva_amount, amount_ttc, invoice_type, status, issued_at, restaurant_name")
    .in("status", ["issued", "paid"])
    .gte("issued_at", dateFrom)
    .lte("issued_at", dateTo)
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
      period: period ?? `${dateFrom} → ${dateTo}`,
      period_start: dateFrom,
      period_end: dateTo,
      ...aggregated,
      by_type: byType,
      formatted: {
        total_ht:  formatFcfa(aggregated.total_ht),
        total_tva: formatFcfa(aggregated.total_tva),
        total_ttc: formatFcfa(aggregated.total_ttc),
        tva_rate:  "19,25 %",
        note: "Déclaration à déposer auprès de la DGI Cameroun chaque trimestre.",
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

  const admin = getAdminClient(c.env);

  // Calculer les totaux de la période
  const { data: invoices } = await admin
    .from("platform_invoices" as never)
    .select("amount_ht, tva_amount, amount_ttc")
    .in("status", ["issued", "paid"])
    .gte("issued_at", body.period_start)
    .lte("issued_at", body.period_end);

  const totals = computeTvaDeclaration((invoices ?? []) as Array<{ amount_ht: number; tva_amount: number; amount_ttc: number }>);

  const { data, error } = await admin
    .from("tva_declarations" as never)
    .upsert({
      period_label:   body.period_label,
      period_type:    "quarterly",
      period_start:   body.period_start,
      period_end:     body.period_end,
      ...totals,
      status:         "filed",
      filed_at:       new Date().toISOString(),
      dgi_reference:  body.dgi_reference ?? null,
    } as never, { onConflict: "period_label" })
    .select()
    .single();

  if (error) return c.json({ error: "Erreur enregistrement déclaration TVA" }, 500);

  return c.json({ success: true, declaration: data });
});
