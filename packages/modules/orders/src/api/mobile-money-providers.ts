import { CoreEnv as Env } from "@kbouffe/module-core";

export type MobileMoneyProviderCode = "mtn_momo" | "orange_money";
export type PaymentFlow = "collection" | "disbursement";

export interface CollectionRequestInput {
    referenceId: string;
    amount: number;
    currency: string;
    externalId: string;
    payerMsisdn: string;
    /** Optional — recipient MSISDN for direct-to-merchant payment flows. */
    payeeMsisdn?: string | null;
    payerMessage: string;
    payeeNote: string;
}

export interface DisbursementRequestInput {
    referenceId: string;
    amount: number;
    currency: string;
    externalId: string;
    payeeMsisdn: string;
    payerMessage: string;
    payeeNote: string;
}

export interface MobileMoneyProvider {
    code: MobileMoneyProviderCode;
    label: string;
    supports: PaymentFlow[];
    isConfigured: (env: Env) => boolean;
    requestToPay?: (env: Env, input: CollectionRequestInput) => Promise<void>;
    getRequestToPayStatus?: (env: Env, referenceId: string) => Promise<Record<string, unknown>>;
    transfer?: (env: Env, input: DisbursementRequestInput) => Promise<void>;
    getTransferStatus?: (env: Env, referenceId: string) => Promise<Record<string, unknown>>;
}

function baseUrl(env: Env) {
    return env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
}

async function getMtnCollectionToken(env: Env): Promise<string> {
    const credentials = btoa(`${env.MTN_COLLECTION_API_USER}:${env.MTN_COLLECTION_API_KEY}`);
    const res = await fetch(`${baseUrl(env)}/collection/token/`, {
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

async function getMtnDisbursementToken(env: Env): Promise<string> {
    const credentials = btoa(`${env.MTN_DISBURSEMENT_API_USER}:${env.MTN_DISBURSEMENT_API_KEY}`);
    const res = await fetch(`${baseUrl(env)}/disbursement/token/`, {
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

const mtnProvider: MobileMoneyProvider = {
    code: "mtn_momo",
    label: "MTN MoMo",
    supports: ["collection", "disbursement"],
    isConfigured: (env) => Boolean(
        env.MTN_COLLECTION_API_USER &&
        env.MTN_COLLECTION_API_KEY &&
        env.MTN_COLLECTION_SUBSCRIPTION_KEY,
    ),
    requestToPay: async (env, params) => {
        const token = await getMtnCollectionToken(env);
        const res = await fetch(`${baseUrl(env)}/collection/v1_0/requesttopay`, {
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
    },
    getRequestToPayStatus: async (env, referenceId) => {
        const token = await getMtnCollectionToken(env);
        const res = await fetch(`${baseUrl(env)}/collection/v1_0/requesttopay/${referenceId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
                "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? "",
            },
        });
        if (!res.ok) throw new Error(`MTN status error: ${res.status}`);
        return (await res.json()) as Record<string, unknown>;
    },
    transfer: async (env, params) => {
        const token = await getMtnDisbursementToken(env);
        const res = await fetch(`${baseUrl(env)}/disbursement/v1_0/transfer`, {
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
    },
    getTransferStatus: async (env, referenceId) => {
        const token = await getMtnDisbursementToken(env);
        const res = await fetch(`${baseUrl(env)}/disbursement/v1_0/transfer/${referenceId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
                "Ocp-Apim-Subscription-Key": env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY ?? "",
            },
        });
        if (!res.ok) throw new Error(`MTN transfer status error: ${res.status}`);
        return (await res.json()) as Record<string, unknown>;
    },
};

const orangeProvider: MobileMoneyProvider = {
    code: "orange_money",
    label: "Orange Money",
    supports: ["collection", "disbursement"],
    isConfigured: () => false,
};

const PROVIDERS: Record<MobileMoneyProviderCode, MobileMoneyProvider> = {
    mtn_momo: mtnProvider,
    orange_money: orangeProvider,
};

export function getMobileMoneyProvider(code: MobileMoneyProviderCode) {
    return PROVIDERS[code];
}

export function listMobileMoneyProviders(env: Env) {
    return (Object.values(PROVIDERS) as MobileMoneyProvider[]).map((provider) => ({
        code: provider.code,
        label: provider.label,
        supports: provider.supports,
        configured: provider.isConfigured(env),
    }));
}
