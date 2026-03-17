/**
 * MTN MoMo payment routes — migrated from web-dashboard/src/app/api/payments/mtn/
 *
 * POST   /payments/mtn/request-to-pay      — initiate a collection
 * GET    /payments/mtn/status/:referenceId  — check collection status
 * POST   /payments/mtn/webhook             — collection webhook (public)
 * POST   /payments/mtn/transfer            — initiate a disbursement
 * GET    /payments/mtn/transfer/:referenceId — check disbursement status
 * POST   /payments/mtn/disbursement-webhook — disbursement webhook (public)
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const paymentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Helper: get Supabase admin client ─────────────────────────────
function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// ── Helper: MTN Collection API ────────────────────────────────────
async function getMtnToken(env: Env): Promise<string> {
    const credentials = btoa(`${env.MTN_COLLECTION_API_USER}:${env.MTN_COLLECTION_API_KEY}`);
    const baseUrl = env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const res = await fetch(`${baseUrl}/collection/token/`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? "",
        },
    });
    if (!res.ok) throw new Error(`MTN token error: ${res.status}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
}

async function requestToPay(env: Env, params: {
    referenceId: string; amount: number; currency: string;
    externalId: string; payerMsisdn: string; payerMessage: string; payeeNote: string;
}) {
    const token = await getMtnToken(env);
    const baseUrl = env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "X-Reference-Id": params.referenceId,
            "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
            "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? "",
            "Content-Type": "application/json",
            ...(env.MTN_COLLECTION_CALLBACK_URL ? { "X-Callback-Url": env.MTN_COLLECTION_CALLBACK_URL } : {}),
        },
        body: JSON.stringify({
            amount: String(params.amount),
            currency: params.currency,
            externalId: params.externalId,
            payer: { partyIdType: "MSISDN", partyId: params.payerMsisdn },
            payerMessage: params.payerMessage,
            payeeNote: params.payeeNote,
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`MTN requestToPay error: ${res.status} — ${text}`);
    }
}

async function getRequestToPayStatus(env: Env, referenceId: string) {
    const token = await getMtnToken(env);
    const baseUrl = env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
            "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? "",
        },
    });
    if (!res.ok) throw new Error(`MTN status error: ${res.status}`);
    return (await res.json()) as Record<string, any>;
}

function mapMtnStatusToPaymentStatus(mtnStatus: string): string {
    switch (mtnStatus.toUpperCase()) {
        case "SUCCESSFUL": return "paid";
        case "FAILED": return "failed";
        case "REJECTED": return "failed";
        case "TIMEOUT": return "failed";
        default: return "pending";
    }
}

// ── Helper: MTN Disbursement API ──────────────────────────────────
async function getDisbursementToken(env: Env): Promise<string> {
    const credentials = btoa(`${env.MTN_DISBURSEMENT_API_USER}:${env.MTN_DISBURSEMENT_API_KEY}`);
    const baseUrl = env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const res = await fetch(`${baseUrl}/disbursement/token/`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Ocp-Apim-Subscription-Key": env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY ?? "",
        },
    });
    if (!res.ok) throw new Error(`MTN disbursement token error: ${res.status}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
}

async function transfer(env: Env, params: {
    referenceId: string; amount: number; currency: string;
    externalId: string; payeeMsisdn: string; payerMessage: string; payeeNote: string;
}) {
    const token = await getDisbursementToken(env);
    const baseUrl = env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const res = await fetch(`${baseUrl}/disbursement/v1_0/transfer`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "X-Reference-Id": params.referenceId,
            "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
            "Ocp-Apim-Subscription-Key": env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY ?? "",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            amount: String(params.amount),
            currency: params.currency,
            externalId: params.externalId,
            payee: { partyIdType: "MSISDN", partyId: params.payeeMsisdn },
            payerMessage: params.payerMessage,
            payeeNote: params.payeeNote,
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`MTN transfer error: ${res.status} — ${text}`);
    }
}

async function getTransferStatus(env: Env, referenceId: string) {
    const token = await getDisbursementToken(env);
    const baseUrl = env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const res = await fetch(`${baseUrl}/disbursement/v1_0/transfer/${referenceId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
            "Ocp-Apim-Subscription-Key": env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY ?? "",
        },
    });
    if (!res.ok) throw new Error(`MTN transfer status error: ${res.status}`);
    return (await res.json()) as Record<string, any>;
}

function mapTransferStatus(mtnStatus: string): string {
    switch (mtnStatus.toUpperCase()) {
        case "SUCCESSFUL": return "paid";
        case "FAILED": return "failed";
        case "REJECTED": return "failed";
        default: return "processing";
    }
}

// ═══════════════════════ ROUTES ═══════════════════════════════════

// ── POST /request-to-pay ─────────────────────────────────────────
paymentRoutes.post("/request-to-pay", async (c) => {
    const body = await c.req.json<{ orderId: string; payerMsisdn: string; payerMessage?: string; payeeNote?: string }>();
    if (!body.orderId || !body.payerMsisdn?.trim()) {
        return c.json({ error: "orderId et payerMsisdn sont requis" }, 400);
    }

    const admin = getAdminClient(c.env);
    const { data: order, error: orderError } = await admin
        .from("orders").select("id, restaurant_id, total, payment_status")
        .eq("id", body.orderId).eq("restaurant_id", c.var.restaurantId).single();

    if (orderError || !order) return c.json({ error: "Commande introuvable" }, 404);

    const referenceId = crypto.randomUUID();
    const externalId = `order-${order.id}`;

    const { data: tx, error: txError } = await admin.from("payment_transactions")
        .insert({
            restaurant_id: c.var.restaurantId, order_id: order.id, provider: "mtn_momo",
            reference_id: referenceId, external_id: externalId,
            payer_msisdn: body.payerMsisdn.trim(), amount: order.total,
            currency: "XAF", status: "pending", provider_status: "PENDING",
        } as never).select("id, reference_id, status").single();

    if (txError || !tx) return c.json({ error: "Impossible de créer la transaction" }, 500);

    try {
        await requestToPay(c.env, {
            referenceId, amount: order.total, currency: "XAF", externalId,
            payerMsisdn: body.payerMsisdn.trim(),
            payerMessage: body.payerMessage ?? "Paiement commande Kbouffe",
            payeeNote: body.payeeNote ?? `Commande ${order.id}`,
        });
    } catch (providerError) {
        const message = providerError instanceof Error ? providerError.message : "Erreur fournisseur MTN";
        await admin.from("payment_transactions").update({
            status: "failed", provider_status: "FAILED", failed_reason: message,
            provider_response: { error: message }, updated_at: new Date().toISOString(),
        } as never).eq("id", (tx as any).id);
        return c.json({ error: message }, 502);
    }

    return c.json({ success: true, payment: { referenceId: (tx as any).reference_id, status: "pending" } });
});

// ── GET /status/:referenceId ─────────────────────────────────────
paymentRoutes.get("/status/:referenceId", async (c) => {
    const referenceId = c.req.param("referenceId");
    const admin = getAdminClient(c.env);

    const { data: tx, error: txError } = await admin.from("payment_transactions")
        .select("id, order_id, restaurant_id, reference_id, status")
        .eq("reference_id", referenceId).eq("restaurant_id", c.var.restaurantId).single();

    if (txError || !tx) return c.json({ error: "Transaction introuvable" }, 404);

    const providerPayload = await getRequestToPayStatus(c.env, referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapMtnStatusToPaymentStatus(providerStatus);

    await admin.from("payment_transactions").update({
        status: mappedStatus, provider_status: providerStatus, provider_response: providerPayload,
        completed_at: mappedStatus === "paid" ? new Date().toISOString() : null,
        failed_reason: mappedStatus === "failed" ? String(providerPayload.reason ?? "FAILED") : null,
        updated_at: new Date().toISOString(),
    } as never).eq("id", (tx as any).id);

    if ((tx as any).order_id) {
        const orderPaymentStatus = mappedStatus === "paid" ? "paid" : mappedStatus === "failed" ? "failed" : "pending";
        await admin.from("orders").update({ payment_status: orderPaymentStatus, updated_at: new Date().toISOString() } as never)
            .eq("id", (tx as any).order_id).eq("restaurant_id", c.var.restaurantId);
    }

    return c.json({ success: true, payment: { referenceId, status: mappedStatus, providerStatus }, providerPayload });
});

// ── POST /transfer ───────────────────────────────────────────────
paymentRoutes.post("/transfer", async (c) => {
    const body = await c.req.json<{ payoutId: string; payeeMsisdn: string; amount: number; payeeNote?: string }>();
    if (!body.payoutId || !body.payeeMsisdn?.trim() || !body.amount) {
        return c.json({ error: "payoutId, payeeMsisdn et amount sont requis" }, 400);
    }
    if (body.amount <= 0) return c.json({ error: "Le montant doit etre positif" }, 400);

    const admin = getAdminClient(c.env);
    const { data: payout, error: payoutError } = await admin.from("payouts")
        .select("id, restaurant_id, amount, status")
        .eq("id", body.payoutId).eq("restaurant_id", c.var.restaurantId).single();

    if (payoutError || !payout) return c.json({ error: "Versement introuvable" }, 404);
    if ((payout as any).status === "paid") return c.json({ error: "Ce versement a deja ete effectue" }, 400);

    const referenceId = crypto.randomUUID();
    const externalId = `payout-${(payout as any).id}`;

    await admin.from("payouts").update({ status: "processing", reference_id: referenceId, updated_at: new Date().toISOString() } as never)
        .eq("id", (payout as any).id);

    try {
        await transfer(c.env, {
            referenceId, amount: body.amount, currency: "XAF", externalId,
            payeeMsisdn: body.payeeMsisdn.trim(), payerMessage: "Versement Kbouffe",
            payeeNote: body.payeeNote ?? `Versement restaurant - ${(payout as any).id}`,
        });
        return c.json({ success: true, transfer: { referenceId, payoutId: (payout as any).id, amount: body.amount, status: "pending" } });
    } catch (providerError) {
        const message = providerError instanceof Error ? providerError.message : "Erreur fournisseur MTN Disbursement";
        await admin.from("payouts").update({ status: "failed", updated_at: new Date().toISOString() } as never).eq("id", (payout as any).id);
        return c.json({ error: message }, 502);
    }
});

// ── GET /transfer/:referenceId ───────────────────────────────────
paymentRoutes.get("/transfer/:referenceId", async (c) => {
    const referenceId = c.req.param("referenceId");
    const providerPayload = await getTransferStatus(c.env, referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapTransferStatus(providerStatus);

    const admin = getAdminClient(c.env);
    const { data: payoutRaw } = await admin.from("payouts").select("id").eq("reference_id", referenceId).single();
    if (payoutRaw) {
        await admin.from("payouts").update({
            status: mappedStatus,
            completed_at: mappedStatus === "paid" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        } as never).eq("reference_id", referenceId);
    }

    return c.json({
        success: true,
        transfer: { referenceId, status: mappedStatus, providerStatus, financialTransactionId: providerPayload.financialTransactionId },
    });
});

// ═══ PUBLIC WEBHOOKS (no auth) — mounted separately in index.ts ══

export const paymentWebhookRoutes = new Hono<{ Bindings: Env }>();

// ── POST /webhook — Collection webhook ───────────────────────────
paymentWebhookRoutes.post("/webhook", async (c) => {
    const secret = c.req.header("x-webhook-secret");
    if (c.env.MTN_WEBHOOK_SECRET && secret !== c.env.MTN_WEBHOOK_SECRET) {
        return c.json({ error: "Webhook non autorisé" }, 401);
    }

    const body = await c.req.json<{ referenceId?: string; externalId?: string }>().catch(() => ({} as any));
    const referenceId = body.referenceId || c.req.query("referenceId") || c.req.header("x-reference-id");
    if (!referenceId) return c.json({ error: "referenceId manquant" }, 400);

    const providerPayload = await getRequestToPayStatus(c.env, referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapMtnStatusToPaymentStatus(providerStatus);

    const admin = getAdminClient(c.env);
    const { data: tx } = await admin.from("payment_transactions").select("id, order_id, restaurant_id").eq("reference_id", referenceId).single();
    if (!tx) return c.json({ success: true, ignored: true });

    await admin.from("payment_transactions").update({
        status: mappedStatus, provider_status: providerStatus, provider_response: providerPayload,
        completed_at: mappedStatus === "paid" ? new Date().toISOString() : null,
        failed_reason: mappedStatus === "failed" ? String(providerPayload.reason ?? "FAILED") : null,
        updated_at: new Date().toISOString(),
    } as never).eq("id", (tx as any).id);

    if ((tx as any).order_id) {
        const orderPaymentStatus = mappedStatus === "paid" ? "paid" : mappedStatus === "failed" ? "failed" : "pending";
        await admin.from("orders").update({ payment_status: orderPaymentStatus, updated_at: new Date().toISOString() } as never)
            .eq("id", (tx as any).order_id).eq("restaurant_id", (tx as any).restaurant_id);
    }

    return c.json({ success: true });
});

// ── POST /disbursement-webhook ───────────────────────────────────
paymentWebhookRoutes.post("/disbursement-webhook", async (c) => {
    const body = await c.req.json<{ referenceId?: string; externalId?: string }>().catch(() => ({} as any));
    const referenceId = body.referenceId || c.req.query("referenceId") || c.req.header("x-reference-id");
    if (!referenceId) return c.json({ error: "referenceId manquant" }, 400);

    const providerPayload = await getTransferStatus(c.env, referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapTransferStatus(providerStatus);

    const admin = getAdminClient(c.env);
    const { data: payoutRaw } = await admin.from("payouts").select("id, restaurant_id").eq("reference_id", referenceId).single();
    if (payoutRaw) {
        await admin.from("payouts").update({
            status: mappedStatus,
            completed_at: mappedStatus === "paid" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        } as never).eq("id", (payoutRaw as any).id);
    }

    return c.json({ success: true, status: mappedStatus });
});
