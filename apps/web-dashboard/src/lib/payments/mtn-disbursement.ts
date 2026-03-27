/**
 * MTN MoMo Disbursement API — Transfer money TO restaurants / drivers.
 *
 * Uses the Disbursement product from the MTN Developer Portal which has
 * its own subscription key, API user/key pair, and token endpoint.
 *
 * Docs: https://momodeveloper.mtn.com/docs/services/disbursement
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ── Types ─────────────────────────────────────────────────────────────────

export interface DisbursementConfig {
  baseUrl: string;
  apiUser: string;
  apiKey: string;
  subscriptionKey: string;
  targetEnvironment: string;
  callbackUrl?: string;
}

export interface TransferInput {
  /** Unique UUID for idempotency */
  referenceId: string;
  /** Amount in smallest currency unit (FCFA) */
  amount: number;
  /** ISO 4217 currency code — "XAF" for Cameroon */
  currency: string;
  /** Your internal reference (e.g. "payout-<payoutId>") */
  externalId: string;
  /** Recipient phone number in E.164 format (e.g. "237670000000") */
  payeeMsisdn: string;
  /** Short message shown to the payer (your platform) */
  payerMessage: string;
  /** Short note shown to the payee (restaurant/driver) */
  payeeNote: string;
}

export interface TransferStatus {
  amount: string;
  currency: string;
  financialTransactionId?: string;
  externalId: string;
  payee: { partyIdType: string; partyId: string };
  payerMessage: string;
  payeeNote: string;
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  reason?: string;
  [key: string]: unknown;
}

// ── Config ────────────────────────────────────────────────────────────────

function assertDisbursementConfig(
  config: Partial<DisbursementConfig>
): asserts config is DisbursementConfig {
  const required = [
    "baseUrl",
    "apiUser",
    "apiKey",
    "subscriptionKey",
    "targetEnvironment",
  ] as const;

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Configuration MTN Disbursement manquante: ${key}`);
    }
  }
}

export async function getDisbursementConfig(): Promise<DisbursementConfig> {
  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as unknown as Record<string, string | undefined>;

  const config: Partial<DisbursementConfig> = {
    baseUrl:
      process.env.MTN_BASE_URL ||
      cfEnv.MTN_BASE_URL ||
      "https://sandbox.momodeveloper.mtn.com",
    apiUser:
      process.env.MTN_DISBURSEMENT_API_USER || cfEnv.MTN_DISBURSEMENT_API_USER,
    apiKey:
      process.env.MTN_DISBURSEMENT_API_KEY || cfEnv.MTN_DISBURSEMENT_API_KEY,
    subscriptionKey:
      process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY ||
      cfEnv.MTN_DISBURSEMENT_SUBSCRIPTION_KEY,
    targetEnvironment:
      process.env.MTN_TARGET_ENV || cfEnv.MTN_TARGET_ENV || "sandbox",
    callbackUrl:
      process.env.MTN_DISBURSEMENT_CALLBACK_URL ||
      cfEnv.MTN_DISBURSEMENT_CALLBACK_URL,
  };

  assertDisbursementConfig(config);
  return config;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toBasicAuth(apiUser: string, apiKey: string): string {
  return `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString("base64")}`;
}

// ── Token ─────────────────────────────────────────────────────────────────

export async function getDisbursementToken(
  config?: DisbursementConfig
): Promise<string> {
  const c = config ?? (await getDisbursementConfig());

  const response = await fetch(`${c.baseUrl}/disbursement/token/`, {
    method: "POST",
    headers: {
      Authorization: toBasicAuth(c.apiUser, c.apiKey),
      "Ocp-Apim-Subscription-Key": c.subscriptionKey,
    },
  });

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || !body.access_token) {
    throw new Error(
      String(body?.message || body?.error || "Token disboursement MTN invalide")
    );
  }

  return body.access_token as string;
}

// ── Transfer (send money to a payee) ──────────────────────────────────────

export async function transfer(input: TransferInput): Promise<void> {
  const config = await getDisbursementConfig();
  const token = await getDisbursementToken(config);

  const payload: Record<string, unknown> = {
    amount: String(input.amount),
    currency: input.currency,
    externalId: input.externalId,
    payee: {
      partyIdType: "MSISDN",
      partyId: input.payeeMsisdn,
    },
    payerMessage: input.payerMessage,
    payeeNote: input.payeeNote,
  };

  if (config.callbackUrl) {
    payload.callbackUrl = config.callbackUrl;
  }

  const response = await fetch(
    `${config.baseUrl}/disbursement/v1_0/transfer`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": input.referenceId,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    throw new Error(
      String(body?.message || body?.error || "Échec transfert MTN Disbursement")
    );
  }
}

// ── Transfer status ───────────────────────────────────────────────────────

export async function getTransferStatus(
  referenceId: string
): Promise<TransferStatus> {
  const config = await getDisbursementConfig();
  const token = await getDisbursementToken(config);

  const response = await fetch(
    `${config.baseUrl}/disbursement/v1_0/transfer/${referenceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
    }
  );

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new Error(
      String(body?.message || body?.error || "Impossible de lire le statut transfert MTN")
    );
  }

  return body as unknown as TransferStatus;
}

// ── Account balance ───────────────────────────────────────────────────────

export async function getDisbursementBalance(): Promise<{
  availableBalance: string;
  currency: string;
}> {
  const config = await getDisbursementConfig();
  const token = await getDisbursementToken(config);

  const response = await fetch(
    `${config.baseUrl}/disbursement/v1_0/account/balance`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
    }
  );

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new Error(
      String(body?.message || body?.error || "Impossible de lire le solde MTN")
    );
  }

  return body as { availableBalance: string; currency: string };
}

// ── Verify account holder ─────────────────────────────────────────────────

export async function verifyAccountHolder(
  msisdn: string
): Promise<{ result: boolean }> {
  const config = await getDisbursementConfig();
  const token = await getDisbursementToken(config);

  const response = await fetch(
    `${config.baseUrl}/disbursement/v1_0/accountholder/msisdn/${msisdn}/active`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
    }
  );

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    return { result: false };
  }

  return { result: Boolean(body.result) };
}

// ── Status mapping ────────────────────────────────────────────────────────

export function mapTransferStatus(
  providerStatus: string | null | undefined
): "pending" | "paid" | "failed" {
  const normalized = (providerStatus ?? "").toUpperCase();

  if (normalized === "SUCCESSFUL") return "paid";
  if (["FAILED", "REJECTED", "EXPIRED"].includes(normalized)) return "failed";
  return "pending";
}
