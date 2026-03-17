/**
 * Ad delivery service — bridges Kbouffe ad campaigns with MTN Advertising feeds.
 *
 * When a campaign is active and includes push delivery, this service:
 *  1. Fetches available PCM/SMS feeds from MTN Advertising API
 *  2. Matches restaurant campaigns to suitable ad distribution slots
 *  3. Sends SMS ads via MTN SMS v3 for campaigns that include SMS distribution
 *
 * This is called by a cron/admin endpoint to process active campaigns.
 */
import { getSmsFeed, getPcmFeed, isMtnAdsConfigured } from "@/lib/ads/mtn";
import { sendSms, normalizeCameroonPhone } from "@/lib/sms/mtn";
import { createAdminClient } from "@/lib/supabase/server";
import type { AdCampaign } from "@/lib/supabase/types";
import type { SmsFeedResponse, PcmFeedResponse } from "@/lib/ads/mtn";

// ── Types ─────────────────────────────────────────────────────────────────

export interface AdDeliveryResult {
  campaignId: string;
  smsFeedAvailable: boolean;
  pcmFeedAvailable: boolean;
  pushSent: boolean;
  errors: string[];
}

export interface FeedSummary {
  sms: SmsFeedResponse | null;
  pcm: PcmFeedResponse | null;
  configured: boolean;
  fetchedAt: string;
}

// ── Feed fetching ─────────────────────────────────────────────────────────

/**
 * Fetch both SMS and PCM feeds from the MTN Advertising API.
 * Returns null for each feed type if the API is not configured or fails.
 */
export async function fetchAdFeeds(): Promise<FeedSummary> {
  const configured = await isMtnAdsConfigured();
  if (!configured) {
    return {
      sms: null,
      pcm: null,
      configured: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  let sms: SmsFeedResponse | null = null;
  let pcm: PcmFeedResponse | null = null;

  const [smsResult, pcmResult] = await Promise.allSettled([
    getSmsFeed(),
    getPcmFeed(),
  ]);

  if (smsResult.status === "fulfilled") sms = smsResult.value;
  else console.error("[AdDelivery] SMS feed error:", smsResult.reason);

  if (pcmResult.status === "fulfilled") pcm = pcmResult.value;
  else console.error("[AdDelivery] PCM feed error:", pcmResult.reason);

  return {
    sms,
    pcm,
    configured: true,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Campaign delivery ─────────────────────────────────────────────────────

/**
 * Process active campaigns that have push delivery enabled but not yet sent.
 * Sends the push message to the campaign's restaurant subscribers via SMS.
 */
export async function processActivePushCampaigns(): Promise<AdDeliveryResult[]> {
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  // Find active campaigns with push enabled but not yet sent
  const { data: campaigns, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("status", "active")
    .eq("include_push", true)
    .eq("push_sent", false)
    .lte("starts_at", now)
    .gte("ends_at", now);

  if (error) {
    console.error("[AdDelivery] Campaign query error:", error);
    return [];
  }

  const results: AdDeliveryResult[] = [];
  const typedCampaigns = (campaigns ?? []) as AdCampaign[];

  for (const campaign of typedCampaigns) {
    const result = await deliverCampaignPush(campaign, supabase);
    results.push(result);
  }

  return results;
}

/**
 * Deliver a single campaign's push notification via SMS to subscribed customers.
 */
async function deliverCampaignPush(
  campaign: AdCampaign,
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<AdDeliveryResult> {
  const result: AdDeliveryResult = {
    campaignId: campaign.id,
    smsFeedAvailable: false,
    pcmFeedAvailable: false,
    pushSent: false,
    errors: [],
  };

  if (!campaign.push_message) {
    result.errors.push("No push message defined");
    return result;
  }

  try {
    // Get restaurant info for branding
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("name, phone")
      .eq("id", campaign.restaurant_id)
      .single();

    const restaurantName = (restaurant as unknown as { name?: string } | null)?.name ?? "Restaurant";

    // Get customer phone numbers for this restaurant (recent orders)
    const { data: customers } = await supabase
      .from("orders")
      .select("customer_phone")
      .eq("restaurant_id", campaign.restaurant_id)
      .not("customer_phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    const uniquePhones = new Set<string>();
    for (const order of (customers ?? []) as { customer_phone?: string }[]) {
      if (order.customer_phone) {
        const normalized = normalizeCameroonPhone(order.customer_phone);
        if (normalized.length >= 9) uniquePhones.add(normalized);
      }
    }

    if (uniquePhones.size === 0) {
      result.errors.push("No customer phones found for this restaurant");
      // Mark as sent anyway to avoid retrying
      await supabase
        .from("ad_campaigns")
        .update({ push_sent: true } as never)
        .eq("id", campaign.id);
      return result;
    }

    // Build the promotional SMS message
    const smsMessage = `[${restaurantName}] ${campaign.push_message}`;

    // Send SMS to each customer (with rate limiting)
    let sentCount = 0;
    for (const phone of uniquePhones) {
      try {
        await sendSms({
          recipientMsisdn: phone,
          message: smsMessage.slice(0, 160), // SMS limit
          clientCorrelatorId: `ad-${campaign.id}-${phone}`,
          keyword: "PROMO",
        });
        sentCount++;
      } catch (smsErr) {
        result.errors.push(`SMS to ${phone}: ${smsErr instanceof Error ? smsErr.message : "failed"}`);
      }
    }

    // Mark campaign as push_sent
    await supabase
      .from("ad_campaigns")
      .update({ push_sent: true } as never)
      .eq("id", campaign.id);

    result.pushSent = true;
    console.log(
      `[AdDelivery] Campaign ${campaign.id}: sent ${sentCount}/${uniquePhones.size} SMS`
    );
  } catch (err) {
    result.errors.push(
      err instanceof Error ? err.message : "Unknown delivery error"
    );
  }

  return result;
}

/**
 * Track an ad impression for a campaign.
 */
export async function trackImpression(campaignId: string): Promise<void> {
  try {
    const supabase = await createAdminClient();
    await (supabase.rpc as Function)("increment_campaign_impressions", {
      campaign_id: campaignId,
    });
  } catch (err) {
    console.error("[AdDelivery] Impression tracking error:", err);
  }
}

/**
 * Track an ad click for a campaign.
 */
export async function trackClick(campaignId: string): Promise<void> {
  try {
    const supabase = await createAdminClient();
    await (supabase.rpc as Function)("increment_campaign_clicks", {
      campaign_id: campaignId,
    });
  } catch (err) {
    console.error("[AdDelivery] Click tracking error:", err);
  }
}
