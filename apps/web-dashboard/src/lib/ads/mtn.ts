/**
 * MTN Advertising API v1 — Fetch SMS & PCM (Push Content Manager) ad feeds.
 *
 * The Advertising API allows partners to retrieve ad content feeds for
 * distribution via SMS or push notifications to MTN subscribers.
 *
 * Endpoints:
 *   GET /adverts/feeds/sms-feeds  — SMS-based ad content (text promotions)
 *   GET /adverts/feeds/pcm-feeds  — PCM push notification ad content
 *
 * Docs: https://developers.mtn.com/products/mtn-advertising-api-v1
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ── Types ─────────────────────────────────────────────────────────────────

export interface MtnAdsConfig {
  /** API base URL (default: https://api.mtn.com) */
  baseUrl: string;
  /** OAuth 2.0 client ID */
  clientId: string;
  /** OAuth 2.0 client secret */
  clientSecret: string;
  /** Ocp-Apim-Subscription-Key for Advertising product */
  subscriptionKey: string;
}

/** Individual SMS ad content returned by the feed */
export interface SmsAdFeedItem {
  /** Unique identifier for the ad */
  id?: string;
  /** Ad content / message text */
  message?: string;
  /** Advertiser name */
  advertiser?: string;
  /** Campaign reference */
  campaignId?: string;
  /** Target audience segments */
  targetSegment?: string;
  /** Schedule / validity period */
  validFrom?: string;
  validTo?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/** Response from GET /adverts/feeds/sms-feeds */
export interface SmsFeedResponse {
  statusCode: number;
  statusMessage?: string;
  data: SmsAdFeedItem[];
  raw: Record<string, unknown>;
}

/** Individual PCM (Push Content Manager) ad content */
export interface PcmAdFeedItem {
  /** Unique identifier for the push ad */
  id?: string;
  /** Push notification title */
  title?: string;
  /** Push notification body */
  body?: string;
  /** Deep link or action URL */
  actionUrl?: string;
  /** Image URL for rich push */
  imageUrl?: string;
  /** Advertiser name */
  advertiser?: string;
  /** Campaign reference */
  campaignId?: string;
  /** Target audience segments */
  targetSegment?: string;
  /** Schedule / validity period */
  validFrom?: string;
  validTo?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/** Response from GET /adverts/feeds/pcm-feeds */
export interface PcmFeedResponse {
  statusCode: number;
  statusMessage?: string;
  data: PcmAdFeedItem[];
  raw: Record<string, unknown>;
}

/** Query parameters for feed requests */
export interface AdFeedQueryParams {
  /** Page number (pagination) */
  page?: number;
  /** Page size */
  pageSize?: number;
  /** Filter by advertiser */
  advertiser?: string;
  /** Filter by campaign ID */
  campaignId?: string;
  /** Any extra query params supported by the API */
  [key: string]: string | number | undefined;
}

// ── Config ────────────────────────────────────────────────────────────────

function assertAdsConfig(
  config: Partial<MtnAdsConfig>
): asserts config is MtnAdsConfig {
  const required = [
    "baseUrl",
    "clientId",
    "clientSecret",
    "subscriptionKey",
  ] as const;

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Configuration MTN Advertising manquante: ${key}`);
    }
  }
}

export async function getMtnAdsConfig(): Promise<MtnAdsConfig> {
  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as unknown as Record<string, string | undefined>;

  const config: Partial<MtnAdsConfig> = {
    baseUrl:
      process.env.MTN_ADS_BASE_URL ||
      cfEnv.MTN_ADS_BASE_URL ||
      "https://api.mtn.com",
    clientId:
      process.env.MTN_ADS_CLIENT_ID ||
      cfEnv.MTN_ADS_CLIENT_ID ||
      process.env.MTN_SMS_CLIENT_ID ||
      cfEnv.MTN_SMS_CLIENT_ID,
    clientSecret:
      process.env.MTN_ADS_CLIENT_SECRET ||
      cfEnv.MTN_ADS_CLIENT_SECRET ||
      process.env.MTN_SMS_CLIENT_SECRET ||
      cfEnv.MTN_SMS_CLIENT_SECRET,
    subscriptionKey:
      process.env.MTN_ADS_SUBSCRIPTION_KEY || cfEnv.MTN_ADS_SUBSCRIPTION_KEY,
  };

  assertAdsConfig(config);
  return config;
}

/** Check if the MTN Advertising API is properly configured */
export async function isMtnAdsConfigured(): Promise<boolean> {
  try {
    await getMtnAdsConfig();
    return true;
  } catch {
    return false;
  }
}

// ── OAuth 2.0 token ───────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getMtnAdsToken(
  config?: MtnAdsConfig
): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const c = config ?? (await getMtnAdsConfig());

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
          "Token Advertising MTN invalide"
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

// ── Helpers ───────────────────────────────────────────────────────────────

function buildQueryString(params?: AdFeedQueryParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

function extractArray(raw: Record<string, unknown>): unknown[] {
  // The API response structure isn't documented precisely,
  // so we handle common patterns: { data: [...] }, { feeds: [...] },
  // { smsFeeds: [...] }, or the root being an array.
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.feeds)) return raw.feeds;
  if (Array.isArray(raw.smsFeeds)) return raw.smsFeeds;
  if (Array.isArray(raw.pcmFeeds)) return raw.pcmFeeds;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.content)) return raw.content;
  // If nothing matches, return empty
  return [];
}

// ── SMS Feeds ─────────────────────────────────────────────────────────────

/**
 * Fetch SMS advertising feeds from MTN.
 * These are text-based ad content intended for SMS distribution.
 */
export async function getSmsFeed(
  params?: AdFeedQueryParams
): Promise<SmsFeedResponse> {
  const config = await getMtnAdsConfig();
  const token = await getMtnAdsToken(config);

  const url = `${config.baseUrl}/adverts/feeds/sms-feeds${buildQueryString(params)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      Accept: "application/json",
    },
  });

  const raw = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    console.error("[MTN Ads] SMS feed fetch failed:", {
      status: response.status,
      body: raw,
    });
    throw new Error(
      String(
        raw?.message ||
          raw?.error?.toString() ||
          `MTN Ads SMS feed échoué (HTTP ${response.status})`
      )
    );
  }

  const items = extractArray(raw).map((item) => {
    const obj = item as Record<string, unknown>;
    return {
      id: obj.id as string | undefined,
      message: (obj.message ?? obj.content ?? obj.text) as string | undefined,
      advertiser: obj.advertiser as string | undefined,
      campaignId: (obj.campaignId ?? obj.campaign_id) as string | undefined,
      targetSegment: (obj.targetSegment ?? obj.target_segment) as
        | string
        | undefined,
      validFrom: (obj.validFrom ?? obj.valid_from ?? obj.startDate) as
        | string
        | undefined,
      validTo: (obj.validTo ?? obj.valid_to ?? obj.endDate) as
        | string
        | undefined,
      ...obj,
    } satisfies SmsAdFeedItem;
  });

  return {
    statusCode: response.status,
    statusMessage: raw.statusMessage as string | undefined,
    data: items,
    raw,
  };
}

// ── PCM Feeds ─────────────────────────────────────────────────────────────

/**
 * Fetch PCM (Push Content Manager) advertising feeds from MTN.
 * These are rich push notification ad content with titles, bodies, images.
 */
export async function getPcmFeed(
  params?: AdFeedQueryParams
): Promise<PcmFeedResponse> {
  const config = await getMtnAdsConfig();
  const token = await getMtnAdsToken(config);

  const url = `${config.baseUrl}/adverts/feeds/pcm-feeds${buildQueryString(params)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      Accept: "application/json",
    },
  });

  const raw = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    console.error("[MTN Ads] PCM feed fetch failed:", {
      status: response.status,
      body: raw,
    });
    throw new Error(
      String(
        raw?.message ||
          raw?.error?.toString() ||
          `MTN Ads PCM feed échoué (HTTP ${response.status})`
      )
    );
  }

  const items = extractArray(raw).map((item) => {
    const obj = item as Record<string, unknown>;
    return {
      id: obj.id as string | undefined,
      title: (obj.title ?? obj.heading) as string | undefined,
      body: (obj.body ?? obj.message ?? obj.content) as string | undefined,
      actionUrl: (obj.actionUrl ?? obj.action_url ?? obj.url ?? obj.deepLink) as
        | string
        | undefined,
      imageUrl: (obj.imageUrl ?? obj.image_url ?? obj.image) as
        | string
        | undefined,
      advertiser: obj.advertiser as string | undefined,
      campaignId: (obj.campaignId ?? obj.campaign_id) as string | undefined,
      targetSegment: (obj.targetSegment ?? obj.target_segment) as
        | string
        | undefined,
      validFrom: (obj.validFrom ?? obj.valid_from ?? obj.startDate) as
        | string
        | undefined,
      validTo: (obj.validTo ?? obj.valid_to ?? obj.endDate) as
        | string
        | undefined,
      ...obj,
    } satisfies PcmAdFeedItem;
  });

  return {
    statusCode: response.status,
    statusMessage: raw.statusMessage as string | undefined,
    data: items,
    raw,
  };
}
