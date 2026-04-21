import { createClient } from "@supabase/supabase-js";
import type { Env } from "../../types";

export function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export function getMtnBaseUrl(env: Env) {
    return env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
}

export function isMtnCollectionConfigured(env: Env) {
    return Boolean(
        env.MTN_COLLECTION_API_USER &&
        env.MTN_COLLECTION_API_KEY &&
        env.MTN_COLLECTION_SUBSCRIPTION_KEY,
    );
}

export async function getMtnCollectionToken(env: Env): Promise<string> {
    const credentials = btoa(`${env.MTN_COLLECTION_API_USER}:${env.MTN_COLLECTION_API_KEY}`);
    const response = await fetch(`${getMtnBaseUrl(env)}/collection/token/`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? "",
        },
    });

    const payload = await response.json().catch(() => ({} as { access_token?: string; message?: string; error?: string })) as { access_token?: string; message?: string; error?: string };
    if (!response.ok || !payload.access_token) {
        throw new Error(payload.message ?? payload.error ?? `MTN token error: ${response.status}`);
    }
    return payload.access_token;
}

export async function requestMtnToPay(
    env: Env,
    params: {
        referenceId: string;
        amount: number;
        externalId: string;
        payerMsisdn: string;
        payerMessage: string;
        payeeNote: string;
    },
) {
    const token = await getMtnCollectionToken(env);
    const response = await fetch(`${getMtnBaseUrl(env)}/collection/v1_0/requesttopay`, {
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
            currency: "XAF",
            externalId: params.externalId,
            payer: { partyIdType: "MSISDN", partyId: params.payerMsisdn },
            payerMessage: params.payerMessage,
            payeeNote: params.payeeNote,
        }),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`MTN request-to-pay error: ${response.status}${text ? ` — ${text}` : ""}`);
    }
}
