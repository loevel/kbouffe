/**
 * Merchant-facing marketplace routes:
 *   - GET  /marketplace/services           — list available service packs
 *   - GET  /marketplace/check-feature      — check if a feature is active for current restaurant
 *   - POST /marketplace/initiate-payment   — start a purchase (mobile_money or gift_card)
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import {
    getMobileMoneyProvider,
    type MobileMoneyProviderCode,
} from "@kbouffe/module-orders";
import type { Env, Variables } from "../../types";

export const merchantMarketplaceServicesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Feature → slug mapping (mirrors web-dashboard/src/lib/premium-features.ts) ──
const FEATURE_SLUG_MAP: Record<string, string[]> = {
    premium_storefront: ["premium_storefront", "ai_complete"],
    ai_complete:        ["ai_marketing", "ai_advisor", "ai_complete"],
    ai_marketing:       ["ai_marketing", "ai_complete"],
    ai_advisor:         ["ai_advisor", "ai_complete"],
};

function resolveSlugsForFeature(feature: string): string[] {
    return FEATURE_SLUG_MAP[feature] ?? [feature];
}

function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

function computeExpiresAt(durationDays: number | null): string | null {
    if (!durationDays || durationDays <= 0) return null;
    const expires = new Date();
    expires.setUTCDate(expires.getUTCDate() + durationDays);
    return expires.toISOString();
}

// ── GET /services ────────────────────────────────────────────────
merchantMarketplaceServicesRoutes.get("/services", async (c) => {
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("marketplace_services")
        .select("id, name, description, price, category, duration_days, features, icon, slug, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) return c.json({ error: "Erreur lors du chargement des services" }, 500);
    return c.json({ services: data || [], data: data || [] });
});

// ── GET /check-feature?feature=premium_storefront ────────────────
merchantMarketplaceServicesRoutes.get("/check-feature", async (c) => {
    const feature = c.req.query("feature");
    if (!feature) return c.json({ active: false, error: "feature requis" }, 400);

    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const slugs = resolveSlugsForFeature(feature);

    // Resolve service ids for the candidate slugs
    const { data: services, error: svcErr } = await supabase
        .from("marketplace_services")
        .select("id")
        .in("slug", slugs);

    if (svcErr || !services || services.length === 0) {
        return c.json({ active: false, feature });
    }

    const serviceIds = (services as any[]).map((s) => s.id);

    const nowIso = new Date().toISOString();
    const { data: purchases } = await supabase
        .from("marketplace_purchases")
        .select("id, expires_at")
        .eq("restaurant_id", restaurantId)
        .eq("status", "active")
        .in("service_id", serviceIds)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .limit(1);

    const active = Array.isArray(purchases) && purchases.length > 0;
    const expiresAt = active ? (purchases as any[])[0]?.expires_at ?? null : null;
    return c.json({ active, feature, expires_at: expiresAt });
});

// ── POST /initiate-payment ───────────────────────────────────────
interface InitiatePaymentBody {
    serviceId: string;
    restaurantId?: string;
    amount?: number;
    paymentMethod: "mobile_money" | "gift_card";
    phoneNumber?: string;
    provider?: MobileMoneyProviderCode;
    giftCardCode?: string;
}

merchantMarketplaceServicesRoutes.post("/initiate-payment", async (c) => {
    const body = await c.req.json<InitiatePaymentBody>().catch(() => null);
    if (!body || !body.serviceId || !body.paymentMethod) {
        return c.json({ error: "serviceId et paymentMethod requis" }, 400);
    }

    const admin = getAdminClient(c.env);
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const userId = c.var.userId;

    // Ensure service exists and is active
    const { data: service, error: svcErr } = await supabase
        .from("marketplace_services")
        .select("id, name, price, duration_days, slug, is_active")
        .eq("id", body.serviceId)
        .eq("is_active", true)
        .maybeSingle();

    if (svcErr || !service) {
        return c.json({ error: "Service introuvable ou inactif" }, 404);
    }

    const amount = (service as any).price as number;
    const durationDays = (service as any).duration_days as number | null;

    // ── GIFT CARD FLOW ──────────────────────────────────────────
    if (body.paymentMethod === "gift_card") {
        const code = body.giftCardCode?.trim();
        if (!code) return c.json({ error: "Code de carte cadeaux requis" }, 400);

        const nowIso = new Date().toISOString();
        const { data: cards } = await admin
            .from("gift_cards")
            .select("id, current_balance, is_active, expires_at, usable_context, restricted_to_restaurant_id, issued_by_type")
            .eq("code", code)
            .eq("is_active", true);

        const card = (cards as any[] | null)?.find((g) => {
            if (!g.is_active) return false;
            if (g.expires_at && g.expires_at <= nowIso) return false;
            if (g.current_balance < amount) return false;
            const ctx = g.usable_context ?? "all";
            if (ctx === "menu_only") return false;
            if (g.restricted_to_restaurant_id && g.restricted_to_restaurant_id !== restaurantId) return false;
            return true;
        });

        if (!card) {
            return c.json({ error: "Carte cadeaux invalide, expirée ou solde insuffisant" }, 400);
        }

        const newBalance = card.current_balance - amount;

        // Redeem: debit the card + record movement + create active purchase.
        const { error: upErr } = await admin
            .from("gift_cards")
            .update({ current_balance: newBalance, updated_at: nowIso })
            .eq("id", card.id);
        if (upErr) return c.json({ error: "Impossible de débiter la carte cadeaux" }, 500);

        await admin.from("gift_card_movements").insert({
            gift_card_id: card.id,
            amount: -amount,
            balance_after: newBalance,
            type: "redeem",
            note: `Marketplace: ${(service as any).name}`,
        } as never);

        const expiresAt = computeExpiresAt(durationDays);
        const { data: purchase, error: purchErr } = await admin
            .from("marketplace_purchases")
            .insert({
                restaurant_id: restaurantId,
                service_id: (service as any).id,
                admin_id: userId,
                status: "active",
                starts_at: nowIso,
                expires_at: expiresAt,
                amount_paid: amount,
                payment_method: "gift_card",
                gift_card_id: card.id,
                activated_at: nowIso,
            } as never)
            .select("id, expires_at")
            .single();

        if (purchErr || !purchase) {
            // Rollback balance on failure to keep state consistent.
            await admin
                .from("gift_cards")
                .update({ current_balance: card.current_balance, updated_at: new Date().toISOString() })
                .eq("id", card.id);
            return c.json({ error: "Impossible d'activer l'achat" }, 500);
        }

        return c.json({
            success: true,
            status: "active",
            payment_method: "gift_card",
            purchase_id: (purchase as any).id,
            expires_at: (purchase as any).expires_at,
        });
    }

    // ── MOBILE MONEY FLOW ──────────────────────────────────────
    if (body.paymentMethod === "mobile_money") {
        const phoneNumber = body.phoneNumber?.trim();
        if (!phoneNumber || phoneNumber.length < 9) {
            return c.json({ error: "Numéro de téléphone invalide (min. 9 chiffres)" }, 400);
        }

        const providerCode = (body.provider ?? "mtn_momo") as MobileMoneyProviderCode;
        const provider = getMobileMoneyProvider(providerCode);
        if (!provider?.requestToPay) {
            return c.json({ error: `Provider ${providerCode} non supporté` }, 400);
        }
        if (!provider.isConfigured(c.env)) {
            return c.json({ error: `Provider ${providerCode} non configuré` }, 400);
        }

        const payeeMsisdn = c.env.PLATFORM_PAYEE_MSISDN?.trim();
        if (!payeeMsisdn) {
            return c.json({
                error: "La plateforme n'a pas de compte Mobile Money configuré. Contactez l'administrateur.",
                code: "PLATFORM_NO_MSISDN",
            }, 422);
        }

        const referenceId = crypto.randomUUID();
        const externalId = `marketplace-${(service as any).id}`.slice(0, 32);
        const nowIso = new Date().toISOString();

        // 1) Create payment_transactions (order_id is NULL — marketplace purchase)
        const { data: tx, error: txErr } = await admin
            .from("payment_transactions")
            .insert({
                restaurant_id: restaurantId,
                order_id: null,
                provider: providerCode,
                reference_id: referenceId,
                external_id: externalId,
                payer_msisdn: phoneNumber,
                payee_msisdn: payeeMsisdn,
                payment_flow: "platform",
                amount,
                currency: "XAF",
                status: "pending",
                provider_status: "PENDING",
            } as never)
            .select("id")
            .single();

        if (txErr || !tx) {
            return c.json({ error: "Impossible de créer la transaction" }, 500);
        }

        // 2) Create pending marketplace_purchases row linked to the transaction.
        const { data: purchase, error: purchErr } = await admin
            .from("marketplace_purchases")
            .insert({
                restaurant_id: restaurantId,
                service_id: (service as any).id,
                admin_id: userId,
                status: "pending",
                starts_at: nowIso,
                expires_at: null,
                amount_paid: 0,
                payment_method: "mobile_money",
                payment_transaction_id: (tx as any).id,
            } as never)
            .select("id")
            .single();

        if (purchErr || !purchase) {
            return c.json({ error: "Impossible de créer l'achat en attente" }, 500);
        }

        // 3) Ask the provider to initiate request-to-pay
        try {
            await provider.requestToPay(c.env, {
                referenceId,
                amount,
                currency: "XAF",
                externalId,
                payerMsisdn: phoneNumber,
                payeeMsisdn,
                payerMessage: `Achat ${(service as any).name}`,
                payeeNote: `Marketplace service ${(service as any).slug ?? (service as any).id}`,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur fournisseur Mobile Money";
            await admin
                .from("payment_transactions")
                .update({
                    status: "failed",
                    provider_status: "FAILED",
                    failed_reason: message,
                    provider_response: { error: message },
                    updated_at: new Date().toISOString(),
                } as never)
                .eq("id", (tx as any).id);
            await admin
                .from("marketplace_purchases")
                .update({ status: "failed", updated_at: new Date().toISOString() } as never)
                .eq("id", (purchase as any).id);
            return c.json({ error: message }, 502);
        }

        return c.json({
            success: true,
            status: "pending",
            payment_method: "mobile_money",
            provider: providerCode,
            reference_id: referenceId,
            purchase_id: (purchase as any).id,
        });
    }

    return c.json({ error: "Méthode de paiement non supportée" }, 400);
});

// ── GET /purchases/:id/status ────────────────────────────────────
merchantMarketplaceServicesRoutes.get("/purchases/:id/status", async (c) => {
    const id = c.req.param("id");
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;

    const { data, error } = await supabase
        .from("marketplace_purchases")
        .select("id, status, expires_at, activated_at, amount_paid, payment_method")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

    if (error || !data) return c.json({ error: "Achat introuvable" }, 404);
    return c.json({ purchase: data });
});
