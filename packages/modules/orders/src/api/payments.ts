/**
 * Mobile Money payment routes (multi-provider)
 *
 * Mounted on /payments/mtn for backward compatibility.
 * A provider abstraction is used under the hood to support future operators.
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";
import {
    getMobileMoneyProvider,
    listMobileMoneyProviders,
    type MobileMoneyProviderCode,
} from "./mobile-money-providers";

export const paymentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_PROVIDER: MobileMoneyProviderCode = "mtn_momo";

// ── Helper: get Supabase admin client ─────────────────────────────
function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
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

function mapTransferStatus(mtnStatus: string): string {
    switch (mtnStatus.toUpperCase()) {
        case "SUCCESSFUL": return "paid";
        case "FAILED": return "failed";
        case "REJECTED": return "failed";
        default: return "processing";
    }
}

// ═══════════════════════ ROUTES ═══════════════════════════════════

paymentRoutes.get("/providers", async (c) => {
    return c.json({ success: true, providers: listMobileMoneyProviders(c.env), defaultProvider: DEFAULT_PROVIDER });
});

// ── POST /request-to-pay ─────────────────────────────────────────
paymentRoutes.post("/request-to-pay", async (c) => {
    const body = await c.req.json<{ orderId: string; payerMsisdn: string; payerMessage?: string; payeeNote?: string; provider?: MobileMoneyProviderCode }>();
    if (!body.orderId || !body.payerMsisdn?.trim()) {
        return c.json({ error: "orderId et payerMsisdn sont requis" }, 400);
    }

    const providerCode = body.provider ?? DEFAULT_PROVIDER;
    const provider = getMobileMoneyProvider(providerCode);
    if (!provider) return c.json({ error: "Provider de paiement non supporté" }, 400);
    if (!provider.requestToPay || !provider.getRequestToPayStatus) {
        return c.json({ error: `Le provider ${providerCode} ne supporte pas la collection` }, 400);
    }
    if (!provider.isConfigured(c.env)) {
        return c.json({ error: `Le provider ${providerCode} n'est pas configuré` }, 400);
    }

    const admin = getAdminClient(c.env);

    // Récupérer la commande ET le numéro MTN du restaurant en une seule requête.
    // payment_account_id = numéro MTN du restaurant (bénéficiaire direct).
    const { data: order, error: orderError } = await admin
        .from("orders")
        .select("id, restaurant_id, total, payment_status, restaurants!inner(payment_account_id, payment_provider)")
        .eq("id", body.orderId)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (orderError || !order) return c.json({ error: "Commande introuvable" }, 404);

    // Conformité COBAC/BEAC : le restaurant doit avoir un numéro MTN configuré.
    // Sans ça, KBouffe deviendrait l'intermédiaire financier — illégal sans agrément EMF.
    const restaurant = (order as any).restaurants;
    const payeeMsisdn: string | null = restaurant?.payment_account_id?.trim() || null;
    if (!payeeMsisdn) {
        return c.json({
            error: "Ce restaurant n'a pas configuré son numéro Mobile Money. Le paiement ne peut pas être traité.",
            code: "RESTAURANT_NO_MTN",
        }, 422);
    }

    const referenceId = crypto.randomUUID();
    const externalId = `order-${order.id}`;

    const { data: tx, error: txError } = await admin.from("payment_transactions")
        .insert({
            restaurant_id: c.var.restaurantId, order_id: order.id, provider: providerCode,
            reference_id: referenceId, external_id: externalId,
            payer_msisdn: body.payerMsisdn.trim(),
            payee_msisdn: payeeMsisdn,   // traçabilité : prouve que l'argent va au resto
            payment_flow: "direct",       // client → restaurant directement, jamais via KBouffe
            amount: order.total,
            currency: "XAF", status: "pending", provider_status: "PENDING",
        } as never).select("id, reference_id, status").single();

    if (txError || !tx) return c.json({ error: "Impossible de créer la transaction" }, 500);

    try {
        await provider.requestToPay(c.env, {
            referenceId, amount: order.total, currency: "XAF", externalId,
            payerMsisdn: body.payerMsisdn.trim(),
            payeeMsisdn,                 // argent va DIRECTEMENT au numéro MTN du restaurant
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

    return c.json({ success: true, payment: { referenceId: (tx as any).reference_id, status: "pending", provider: providerCode } });
});

// ── GET /status/:referenceId ─────────────────────────────────────
paymentRoutes.get("/status/:referenceId", async (c) => {
    const referenceId = c.req.param("referenceId");
    const admin = getAdminClient(c.env);

    const { data: tx, error: txError } = await admin.from("payment_transactions")
        .select("id, order_id, restaurant_id, reference_id, status, provider")
        .eq("reference_id", referenceId).eq("restaurant_id", c.var.restaurantId).single();

    if (txError || !tx) return c.json({ error: "Transaction introuvable" }, 404);

    const providerCode = String((tx as any).provider ?? DEFAULT_PROVIDER) as MobileMoneyProviderCode;
    const provider = getMobileMoneyProvider(providerCode);
    if (!provider?.getRequestToPayStatus) {
        return c.json({ error: `Le provider ${providerCode} ne supporte pas le statut collection` }, 400);
    }
    if (!provider.isConfigured(c.env)) {
        return c.json({ error: `Le provider ${providerCode} n'est pas configuré` }, 400);
    }

    const providerPayload = await provider.getRequestToPayStatus(c.env, referenceId);
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
    const body = await c.req.json<{ payoutId: string; payeeMsisdn: string; amount: number; payeeNote?: string; provider?: MobileMoneyProviderCode }>();
    if (!body.payoutId || !body.payeeMsisdn?.trim() || !body.amount) {
        return c.json({ error: "payoutId, payeeMsisdn et amount sont requis" }, 400);
    }
    if (body.amount <= 0) return c.json({ error: "Le montant doit etre positif" }, 400);

    const providerCode = body.provider ?? DEFAULT_PROVIDER;
    const provider = getMobileMoneyProvider(providerCode);
    if (!provider) return c.json({ error: "Provider de paiement non supporté" }, 400);
    if (!provider.transfer || !provider.getTransferStatus) {
        return c.json({ error: `Le provider ${providerCode} ne supporte pas le transfert` }, 400);
    }
    if (!provider.isConfigured(c.env)) {
        return c.json({ error: `Le provider ${providerCode} n'est pas configuré` }, 400);
    }

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
        await provider.transfer(c.env, {
            referenceId, amount: body.amount, currency: "XAF", externalId,
            payeeMsisdn: body.payeeMsisdn.trim(), payerMessage: "Versement Kbouffe",
            payeeNote: body.payeeNote ?? `Versement restaurant - ${(payout as any).id}`,
        });
        return c.json({ success: true, transfer: { referenceId, payoutId: (payout as any).id, amount: body.amount, status: "pending", provider: providerCode } });
    } catch (providerError) {
        const message = providerError instanceof Error ? providerError.message : "Erreur fournisseur MTN Disbursement";
        await admin.from("payouts").update({ status: "failed", updated_at: new Date().toISOString() } as never).eq("id", (payout as any).id);
        return c.json({ error: message }, 502);
    }
});

// ── GET /transfer/:referenceId ───────────────────────────────────
paymentRoutes.get("/transfer/:referenceId", async (c) => {
    const referenceId = c.req.param("referenceId");
    const providerCode = (c.req.query("provider") as MobileMoneyProviderCode | null) ?? DEFAULT_PROVIDER;
    const provider = getMobileMoneyProvider(providerCode);
    if (!provider?.getTransferStatus) {
        return c.json({ error: `Le provider ${providerCode} ne supporte pas le statut transfert` }, 400);
    }
    if (!provider.isConfigured(c.env)) {
        return c.json({ error: `Le provider ${providerCode} n'est pas configuré` }, 400);
    }

    const providerPayload = await provider.getTransferStatus(c.env, referenceId);
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
        transfer: { referenceId, status: mappedStatus, providerStatus, provider: providerCode, financialTransactionId: providerPayload.financialTransactionId },
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

    const admin = getAdminClient(c.env);
    const { data: tx } = await admin
        .from("payment_transactions")
        .select("id, order_id, restaurant_id, provider")
        .eq("reference_id", referenceId)
        .single();
    if (!tx) return c.json({ success: true, ignored: true });

    const providerCode = String((tx as any).provider ?? DEFAULT_PROVIDER) as MobileMoneyProviderCode;
    const provider = getMobileMoneyProvider(providerCode);
    if (!provider?.getRequestToPayStatus) {
        return c.json({ error: `Le provider ${providerCode} ne supporte pas le webhook collection` }, 400);
    }

    const providerPayload = await provider.getRequestToPayStatus(c.env, referenceId);
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
            .eq("id", (tx as any).order_id).eq("restaurant_id", (tx as any).restaurant_id);
    }

    return c.json({ success: true });
});

// ── POST /disbursement-webhook ───────────────────────────────────
paymentWebhookRoutes.post("/disbursement-webhook", async (c) => {
    const secret = c.req.header("x-webhook-secret");
    if (c.env.MTN_WEBHOOK_SECRET && secret !== c.env.MTN_WEBHOOK_SECRET) {
        return c.json({ error: "Webhook non autorisé" }, 401);
    }

    const body = await c.req.json<{ referenceId?: string; externalId?: string }>().catch(() => ({} as any));
    const referenceId = body.referenceId || c.req.query("referenceId") || c.req.header("x-reference-id");
    if (!referenceId) return c.json({ error: "referenceId manquant" }, 400);

    const providerCode = (c.req.query("provider") as MobileMoneyProviderCode | null) ?? DEFAULT_PROVIDER;
    const provider = getMobileMoneyProvider(providerCode);
    if (!provider?.getTransferStatus) {
        return c.json({ error: `Le provider ${providerCode} ne supporte pas le webhook transfert` }, 400);
    }

    const providerPayload = await provider.getTransferStatus(c.env, referenceId);
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
