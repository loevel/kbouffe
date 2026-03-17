/**
 * MTN SMS v3 API — Send SMS to any MTN subscriber in Cameroon.
 *
 * Uses the SMS v3 product from MTN Developer Portal.
 * Requires:
 *   - MTN_SMS_SUBSCRIPTION_KEY (Ocp-Apim-Subscription-Key)
 *   - MTN_SMS_CLIENT_ID + MTN_SMS_CLIENT_SECRET (OAuth 2.0)
 *   - MTN_SMS_SENDER_ADDRESS (your registered sender number/shortcode)
 *
 * Docs: https://developers.mtn.com/products/sms-v3
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ── Types ─────────────────────────────────────────────────────────────────

export interface MtnSmsConfig {
  /** API base URL */
  baseUrl: string;
  /** OAuth 2.0 client ID */
  clientId: string;
  /** OAuth 2.0 client secret */
  clientSecret: string;
  /** Ocp-Apim-Subscription-Key */
  subscriptionKey: string;
  /** Sender address (shortcode or number registered on MTN) */
  senderAddress: string;
}

export interface SendSmsInput {
  /** Recipient phone number in E.164 format (e.g. "237670000000") */
  recipientMsisdn: string;
  /** SMS message body (max 160 chars for single, 1600 for concatenated) */
  message: string;
  /** Optional: your reference for tracking */
  clientCorrelatorId?: string;
  /** Optional: keyword for the SMS service */
  keyword?: string;
}

export interface SendSmsResult {
  /** HTTP status code from MTN */
  statusCode: number;
  /** Transaction ID from MTN */
  transactionId?: string;
  /** Provider raw response */
  raw: Record<string, unknown>;
}

// ── Config ────────────────────────────────────────────────────────────────

function assertSmsConfig(
  config: Partial<MtnSmsConfig>
): asserts config is MtnSmsConfig {
  const required = [
    "baseUrl",
    "clientId",
    "clientSecret",
    "subscriptionKey",
    "senderAddress",
  ] as const;

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Configuration MTN SMS manquante: ${key}`);
    }
  }
}

export async function getMtnSmsConfig(): Promise<MtnSmsConfig> {
  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as unknown as Record<string, string | undefined>;

  const config: Partial<MtnSmsConfig> = {
    baseUrl:
      process.env.MTN_SMS_BASE_URL ||
      cfEnv.MTN_SMS_BASE_URL ||
      "https://api.mtn.com",
    clientId: process.env.MTN_SMS_CLIENT_ID || cfEnv.MTN_SMS_CLIENT_ID,
    clientSecret:
      process.env.MTN_SMS_CLIENT_SECRET || cfEnv.MTN_SMS_CLIENT_SECRET,
    subscriptionKey:
      process.env.MTN_SMS_SUBSCRIPTION_KEY || cfEnv.MTN_SMS_SUBSCRIPTION_KEY,
    senderAddress:
      process.env.MTN_SMS_SENDER_ADDRESS || cfEnv.MTN_SMS_SENDER_ADDRESS,
  };

  assertSmsConfig(config);
  return config;
}

// ── OAuth 2.0 token ───────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getMtnSmsToken(
  config?: MtnSmsConfig
): Promise<string> {
  // Return cached token if still valid (with 60s margin)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const c = config ?? (await getMtnSmsConfig());

  const body = new URLSearchParams({
    grant_type: "client_credentials",
  });

  const response = await fetch(`${c.baseUrl}/v1/oauth/access-token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const result = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || !result.access_token) {
    throw new Error(
      String(
        result?.error_description ||
          result?.error ||
          result?.message ||
          "Token SMS MTN invalide"
      )
    );
  }

  const expiresIn = Number(result.expires_in) || 3600;
  cachedToken = {
    token: result.access_token as string,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedToken.token;
}

// ── Send SMS ──────────────────────────────────────────────────────────────

/**
 * Normalise a Cameroonian phone number to E.164 format.
 * Accepts: "670000000", "237670000000", "+237670000000", "6 70 00 00 00"
 */
export function normalizeCameroonPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]+/g, "");

  if (cleaned.startsWith("+237")) {
    return cleaned.slice(1); // remove leading "+"
  }
  if (cleaned.startsWith("237") && cleaned.length >= 12) {
    return cleaned;
  }
  if (cleaned.startsWith("6") && cleaned.length === 9) {
    return `237${cleaned}`;
  }

  return cleaned; // return as-is if format is unknown
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const config = await getMtnSmsConfig();
  const token = await getMtnSmsToken(config);

  const recipientNumber = normalizeCameroonPhone(input.recipientMsisdn);

  const payload = {
    senderAddress: config.senderAddress,
    receiverAddress: [`tel:+${recipientNumber}`],
    message: input.message,
    clientCorrelatorId:
      input.clientCorrelatorId ?? `kbouffe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...(input.keyword ? { keyword: input.keyword } : {}),
  };

  const response = await fetch(
    `${config.baseUrl}/v3/sms/messages/sms/outbound`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    console.error("[MTN SMS] Send failed:", {
      status: response.status,
      body: result,
    });
    throw new Error(
      String(
        result?.message ||
          result?.error?.toString() ||
          `SMS MTN échoué (HTTP ${response.status})`
      )
    );
  }

  return {
    statusCode: response.status,
    transactionId: result.transactionId as string | undefined,
    raw: result,
  };
}

// ── Delivery report (optional callback handler) ──────────────────────────

export interface SmsDeliveryReport {
  callbackData?: string;
  deliveryInfo: {
    address: string;
    deliveryStatus: string;
  }[];
}

export function parseSmsDeliveryReport(
  body: unknown
): SmsDeliveryReport | null {
  if (!body || typeof body !== "object") return null;
  const report = body as Record<string, unknown>;

  if (!report.deliveryInfoNotification) return null;

  const notification = report.deliveryInfoNotification as Record<
    string,
    unknown
  >;

  return {
    callbackData: notification.callbackData as string | undefined,
    deliveryInfo: (
      notification.deliveryInfo as Array<Record<string, unknown>>
    ).map((info) => ({
      address: String(info.address ?? ""),
      deliveryStatus: String(info.deliveryStatus ?? ""),
    })),
  };
}
