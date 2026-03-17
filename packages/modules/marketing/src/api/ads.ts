/**
 * Ads routes — migrated from web-dashboard/src/app/api/ads/
 *
 * GET  /ads/status        — check MTN Ads API config status
 * GET  /ads/feeds/pcm     — fetch MTN PCM advertising feeds
 * GET  /ads/feeds/sms     — fetch MTN SMS advertising feeds
 * POST /ads/deliver       — process active campaigns + deliver push
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const adsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── helpers ──────────────────────────────────────────────────────
function isMtnAdsConfigured(env: Env): boolean {
    return !!(env.MTN_ADS_SUBSCRIPTION_KEY);
}

interface AdFeedQueryParams {
    page?: number;
    pageSize?: number;
    advertiser?: string;
    campaignId?: string;
}

async function fetchFeed(env: Env, feedType: "sms" | "pcm", params: AdFeedQueryParams) {
    const baseUrl = env.MTN_ADS_BASE_URL ?? "https://api.mtn.com/v1/ads";
    const url = new URL(`${baseUrl}/${feedType}/feeds`);
    if (params.page) url.searchParams.set("page", String(params.page));
    if (params.pageSize) url.searchParams.set("pageSize", String(params.pageSize));
    if (params.advertiser) url.searchParams.set("advertiser", params.advertiser);
    if (params.campaignId) url.searchParams.set("campaignId", params.campaignId);

    const res = await fetch(url.toString(), {
        headers: { "Ocp-Apim-Subscription-Key": env.MTN_ADS_SUBSCRIPTION_KEY ?? "" },
    });

    if (!res.ok) {
        return { data: [], statusCode: res.status };
    }

    const data = await res.json() as any;
    return { data: Array.isArray(data) ? data : data.data ?? [], statusCode: res.status };
}

// ── GET /status ──────────────────────────────────────────────────
adsRoutes.get("/status", async (c) => {
    return c.json({ configured: isMtnAdsConfigured(c.env) });
});

// ── GET /feeds/pcm ───────────────────────────────────────────────
adsRoutes.get("/feeds/pcm", async (c) => {
    if (!isMtnAdsConfigured(c.env)) {
        return c.json({ error: "MTN Advertising API non configurée. Ajoutez MTN_ADS_SUBSCRIPTION_KEY." }, 503);
    }

    const params: AdFeedQueryParams = {};
    if (c.req.query("page")) params.page = Number(c.req.query("page"));
    if (c.req.query("pageSize")) params.pageSize = Number(c.req.query("pageSize"));
    if (c.req.query("advertiser")) params.advertiser = c.req.query("advertiser");
    if (c.req.query("campaignId")) params.campaignId = c.req.query("campaignId");

    try {
        const feed = await fetchFeed(c.env, "pcm", params);
        return c.json({ feeds: feed.data, total: feed.data.length, statusCode: feed.statusCode });
    } catch (error) {
        console.error("GET /ads/feeds/pcm error:", error);
        return c.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, 500);
    }
});

// ── GET /feeds/sms ───────────────────────────────────────────────
adsRoutes.get("/feeds/sms", async (c) => {
    if (!isMtnAdsConfigured(c.env)) {
        return c.json({ error: "MTN Advertising API non configurée. Ajoutez MTN_ADS_SUBSCRIPTION_KEY." }, 503);
    }

    const params: AdFeedQueryParams = {};
    if (c.req.query("page")) params.page = Number(c.req.query("page"));
    if (c.req.query("pageSize")) params.pageSize = Number(c.req.query("pageSize"));
    if (c.req.query("advertiser")) params.advertiser = c.req.query("advertiser");
    if (c.req.query("campaignId")) params.campaignId = c.req.query("campaignId");

    try {
        const feed = await fetchFeed(c.env, "sms", params);
        return c.json({ feeds: feed.data, total: feed.data.length, statusCode: feed.statusCode });
    } catch (error) {
        console.error("GET /ads/feeds/sms error:", error);
        return c.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, 500);
    }
});

// ── POST /deliver ────────────────────────────────────────────────
adsRoutes.post("/deliver", async (c) => {
    try {
        const supabase = c.var.supabase;
        const now = new Date().toISOString();

        // Find active campaigns with push delivery that haven't been fully sent
        const { data: activeCampaigns, error: campaignsError } = await supabase
            .from("ad_campaigns")
            .select("*")
            .eq("status", "active")
            .eq("include_push", true)
            .lte("starts_at", now)
            .gte("ends_at", now);

        if (campaignsError) {
            return c.json({ error: campaignsError.message }, 500);
        }

        const results = [];
        for (const campaign of activeCampaigns || []) {
            // Mark push as sent for this campaign
            await supabase
                .from("ad_campaigns")
                .update({
                    push_sent: true,
                    updated_at: now,
                } as any)
                .eq("id", campaign.id);

            results.push({
                campaignId: campaign.id,
                restaurantId: campaign.restaurant_id,
                status: "push_queued",
            });
        }

        // Optionally fetch MTN ad feeds for monitoring
        let feeds = { configured: false, smsFeedCount: 0, pcmFeedCount: 0, fetchedAt: now };
        if (isMtnAdsConfigured(c.env)) {
            try {
                const [smsFeed, pcmFeed] = await Promise.all([
                    fetchFeed(c.env, "sms", {}),
                    fetchFeed(c.env, "pcm", {}),
                ]);
                feeds = {
                    configured: true,
                    smsFeedCount: smsFeed.data.length,
                    pcmFeedCount: pcmFeed.data.length,
                    fetchedAt: now,
                };
            } catch {
                // non-blocking
            }
        }

        return c.json({ processed: results.length, results, feeds });
    } catch (error) {
        console.error("POST /ads/deliver error:", error);
        return c.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, 500);
    }
});

