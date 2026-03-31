import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface MtnConfig {
  baseUrl: string;
  apiUser: string;
  apiKey: string;
  subscriptionKey: string;
  targetEnvironment: string;
  callbackUrl?: string;
  webhookSecret?: string;
}

export interface RequestToPayInput {
  referenceId: string;
  amount: number;
  currency: string;
  externalId: string;
  payerMsisdn: string;
  payerMessage: string;
  payeeNote: string;
}

function assertConfig(config: Partial<MtnConfig>): asserts config is MtnConfig {
  const required = [
    "baseUrl",
    "apiUser",
    "apiKey",
    "subscriptionKey",
    "targetEnvironment",
  ] as const;

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Configuration MTN manquante: ${key}`);
    }
  }
}

export async function getMtnConfig(): Promise<MtnConfig> {
  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as unknown as Record<string, string | undefined>;

  const config: Partial<MtnConfig> = {
    baseUrl:
      process.env.MTN_BASE_URL ||
      cfEnv.MTN_BASE_URL ||
      "https://sandbox.momodeveloper.mtn.com",
    apiUser: process.env.MTN_API_USER || cfEnv.MTN_API_USER,
    apiKey: process.env.MTN_API_KEY || cfEnv.MTN_API_KEY,
    subscriptionKey:
      process.env.MTN_COLLECTION_SUBSCRIPTION_KEY ||
      cfEnv.MTN_COLLECTION_SUBSCRIPTION_KEY,
    targetEnvironment:
      process.env.MTN_TARGET_ENV || cfEnv.MTN_TARGET_ENV || "sandbox",
    callbackUrl: process.env.MTN_CALLBACK_URL || cfEnv.MTN_CALLBACK_URL,
    webhookSecret: process.env.MTN_WEBHOOK_SECRET || cfEnv.MTN_WEBHOOK_SECRET,
  };

  assertConfig(config);
  return config;
}

function toBasicAuth(apiUser: string, apiKey: string): string {
  return `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString("base64")}`;
}

export async function getMtnAccessToken(config?: MtnConfig): Promise<string> {
  const c = config ?? (await getMtnConfig());

  const response = await fetch(`${c.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: toBasicAuth(c.apiUser, c.apiKey),
      "Ocp-Apim-Subscription-Key": c.subscriptionKey,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.access_token) {
    throw new Error(body?.message || body?.error || "Token MTN invalide");
  }

  return body.access_token as string;
}

export async function requestToPay(input: RequestToPayInput): Promise<void> {
  const config = await getMtnConfig();
  const token = await getMtnAccessToken(config);

  const payload: Record<string, unknown> = {
    amount: String(input.amount),
    currency: input.currency,
    externalId: input.externalId,
    payer: {
      partyIdType: "MSISDN",
      partyId: input.payerMsisdn,
    },
    payerMessage: input.payerMessage,
    payeeNote: input.payeeNote,
  };

  if (config.callbackUrl) {
    payload.callbackUrl = config.callbackUrl;
  }

  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": input.referenceId,
      "X-Target-Environment": config.targetEnvironment,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || body?.error || "Échec request-to-pay MTN");
  }
}

export async function getRequestToPayStatus(referenceId: string): Promise<Record<string, unknown>> {
  const config = await getMtnConfig();
  const token = await getMtnAccessToken(config);

  const response = await fetch(
    `${config.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (body as { message?: string; error?: string })?.message ||
        (body as { message?: string; error?: string })?.error ||
        "Impossible de lire le statut MTN"
    );
  }

  return body as Record<string, unknown>;
}

export function mapMtnStatusToPaymentStatus(
  providerStatus: string | null | undefined
): "pending" | "paid" | "failed" {
  const normalized = (providerStatus ?? "").toUpperCase();

  if (normalized === "SUCCESSFUL") return "paid";
  if (["FAILED", "REJECTED", "EXPIRED"].includes(normalized)) return "failed";
  return "pending";
}
