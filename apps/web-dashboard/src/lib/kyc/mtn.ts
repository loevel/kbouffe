/**
 * MTN Customer KYC Verification API v1 — Verify customer identity.
 *
 * Validates a customer's KYC data (name, ID number, date of birth, etc.)
 * against MTN's records for a given MSISDN. Available in Cameroon.
 *
 * Use cases on Kbouffe:
 *   - Verify restaurant owners at onboarding
 *   - Verify delivery drivers before activation
 *   - Validate customer phone ownership for Mobile Money payments
 *
 * Base URL: https://api.mtn.com/v1/kycVerification
 * Auth: API Key (Ocp-Apim-Subscription-Key) + Basic Auth (clientId:clientSecret → OAuth token)
 *
 * Docs: https://developers.mtn.com/products/customer-kyc-verification
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ── Types ─────────────────────────────────────────────────────────────────

export interface KycConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  subscriptionKey: string;
}

/** KYC request: fields to verify against MTN records */
export interface KycVerificationRequest {
  /** MSISDN of the subscriber (E.164, e.g. "237670000000") */
  msisdn: string;
  /** First name to verify */
  firstName?: string;
  /** Last name to verify */
  lastName?: string;
  /** Date of birth (YYYY-MM-DD) */
  dateOfBirth?: string;
  /** National ID / passport number */
  idNumber?: string;
  /** ID type: "NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENSE" */
  idType?: string;
  /** Nationality (ISO 3166-1 alpha-2, e.g. "CM") */
  nationality?: string;
  /** Address line */
  address?: string;
  /** City */
  city?: string;
  /** Gender: "MALE" | "FEMALE" */
  gender?: string;
}

/** Per-field verification result */
export interface KycFieldResult {
  /** Whether the field matched MTN records */
  verified: boolean;
  /** Confidence score (0-100) if available */
  score?: number;
}

/** Full KYC verification response */
export interface KycVerificationResult {
  /** Overall verification status */
  status: "VERIFIED" | "PARTIALLY_VERIFIED" | "NOT_VERIFIED" | "NOT_FOUND";
  /** HTTP status code from MTN */
  statusCode: number;
  /** Per-field results */
  fields: {
    firstName?: KycFieldResult;
    lastName?: KycFieldResult;
    dateOfBirth?: KycFieldResult;
    idNumber?: KycFieldResult;
    nationality?: KycFieldResult;
    address?: KycFieldResult;
    gender?: KycFieldResult;
  };
  /** MSISDN verified as active */
  msisdnActive?: boolean;
  /** Raw response from MTN */
  raw: Record<string, unknown>;
}

// ── Config ────────────────────────────────────────────────────────────────

function assertKycConfig(
  config: Partial<KycConfig>
): asserts config is KycConfig {
  const required = [
    "baseUrl",
    "clientId",
    "clientSecret",
    "subscriptionKey",
  ] as const;

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Configuration MTN KYC manquante: ${key}`);
    }
  }
}

export async function getKycConfig(): Promise<KycConfig> {
  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as unknown as Record<string, string | undefined>;

  const config: Partial<KycConfig> = {
    baseUrl:
      process.env.MTN_KYC_BASE_URL ||
      cfEnv.MTN_KYC_BASE_URL ||
      "https://api.mtn.com/v1/kycVerification",
    clientId:
      process.env.MTN_KYC_CLIENT_ID ||
      cfEnv.MTN_KYC_CLIENT_ID ||
      process.env.MTN_SMS_CLIENT_ID ||
      cfEnv.MTN_SMS_CLIENT_ID,
    clientSecret:
      process.env.MTN_KYC_CLIENT_SECRET ||
      cfEnv.MTN_KYC_CLIENT_SECRET ||
      process.env.MTN_SMS_CLIENT_SECRET ||
      cfEnv.MTN_SMS_CLIENT_SECRET,
    subscriptionKey:
      process.env.MTN_KYC_SUBSCRIPTION_KEY ||
      cfEnv.MTN_KYC_SUBSCRIPTION_KEY,
  };

  assertKycConfig(config);
  return config;
}

// ── OAuth 2.0 Token ───────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getKycToken(config: KycConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch("https://api.mtn.com/v1/oauth/access-token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || !body.access_token) {
    throw new Error(
      String(
        body?.error_description ||
          body?.error ||
          "Token KYC MTN invalide"
      )
    );
  }

  const expiresIn = Number(body.expires_in) || 3600;
  cachedToken = {
    token: body.access_token as string,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedToken.token;
}

// ── Phone normalization ───────────────────────────────────────────────────

function normalizeMsisdn(phone: string): string {
  const cleaned = phone.replace(/[\s\-()+ ]/g, "");
  if (cleaned.startsWith("237") && cleaned.length >= 12) return cleaned;
  if (cleaned.startsWith("6") && cleaned.length === 9) return `237${cleaned}`;
  return cleaned;
}

// ── Verify KYC ────────────────────────────────────────────────────────────

/**
 * Verify a customer's KYC attributes against MTN records.
 *
 * POST /v1/kycVerification/verify
 */
export async function verifyCustomerKyc(
  input: KycVerificationRequest
): Promise<KycVerificationResult> {
  const config = await getKycConfig();
  const token = await getKycToken(config);
  const msisdn = normalizeMsisdn(input.msisdn);

  // Build request body — only include non-empty fields
  const requestBody: Record<string, unknown> = {
    msisdn,
  };

  if (input.firstName) requestBody.firstName = input.firstName;
  if (input.lastName) requestBody.lastName = input.lastName;
  if (input.dateOfBirth) requestBody.dateOfBirth = input.dateOfBirth;
  if (input.idNumber) requestBody.idNumber = input.idNumber;
  if (input.idType) requestBody.idType = input.idType;
  if (input.nationality) requestBody.nationality = input.nationality;
  if (input.address) requestBody.address = input.address;
  if (input.city) requestBody.city = input.city;
  if (input.gender) requestBody.gender = input.gender;

  const response = await fetch(`${config.baseUrl}/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "X-Country": "CM",
    },
    body: JSON.stringify(requestBody),
  });

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    // 404 — MSISDN not found in MTN records
    if (response.status === 404) {
      return {
        status: "NOT_FOUND",
        statusCode: 404,
        fields: {},
        msisdnActive: false,
        raw: body,
      };
    }

    throw new Error(
      String(
        body?.message ||
          body?.error ||
          `KYC verification failed (HTTP ${response.status})`
      )
    );
  }

  // Parse the response
  return parseKycResponse(response.status, body);
}

/**
 * Check if an MSISDN is active on MTN.
 *
 * GET /v1/kycVerification/msisdn/{msisdn}/active
 */
export async function checkMsisdnActive(
  phone: string
): Promise<{ active: boolean; raw: Record<string, unknown> }> {
  const config = await getKycConfig();
  const token = await getKycToken(config);
  const msisdn = normalizeMsisdn(phone);

  const response = await fetch(
    `${config.baseUrl}/msisdn/${msisdn}/active`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
        "X-Country": "CM",
      },
    }
  );

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    return { active: false, raw: body };
  }

  return {
    active: Boolean(body.result ?? body.active ?? body.isActive),
    raw: body,
  };
}

// ── Response parser ───────────────────────────────────────────────────────

function parseKycResponse(
  statusCode: number,
  body: Record<string, unknown>
): KycVerificationResult {
  const data = (body.data ?? body) as Record<string, unknown>;

  // Extract per-field results
  const fields: KycVerificationResult["fields"] = {};

  const fieldKeys = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "idNumber",
    "nationality",
    "address",
    "gender",
  ] as const;

  for (const key of fieldKeys) {
    const fieldResult = data[key];
    if (fieldResult !== undefined) {
      if (typeof fieldResult === "boolean") {
        fields[key] = { verified: fieldResult };
      } else if (typeof fieldResult === "object" && fieldResult !== null) {
        const obj = fieldResult as Record<string, unknown>;
        fields[key] = {
          verified: Boolean(obj.verified ?? obj.match ?? obj.result),
          score: obj.score !== undefined ? Number(obj.score) : undefined,
        };
      }
    }
  }

  // Determine overall status
  const verifiedCount = Object.values(fields).filter((f) => f.verified).length;
  const totalCount = Object.keys(fields).length;

  let status: KycVerificationResult["status"];
  if (totalCount === 0) {
    status = "NOT_VERIFIED";
  } else if (verifiedCount === totalCount) {
    status = "VERIFIED";
  } else if (verifiedCount > 0) {
    status = "PARTIALLY_VERIFIED";
  } else {
    status = "NOT_VERIFIED";
  }

  return {
    status,
    statusCode,
    fields,
    msisdnActive:
      data.msisdnActive !== undefined
        ? Boolean(data.msisdnActive)
        : undefined,
    raw: body,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Check if MTN KYC is configured (all env vars present).
 */
export async function isKycConfigured(): Promise<boolean> {
  try {
    await getKycConfig();
    return true;
  } catch {
    return false;
  }
}
