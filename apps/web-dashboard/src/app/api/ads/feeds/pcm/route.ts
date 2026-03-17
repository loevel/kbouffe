/**
 * GET /api/ads/feeds/pcm — Fetch MTN PCM (Push Content Manager) advertising feeds.
 *
 * Query params (all optional):
 *   ?page=1&pageSize=20&advertiser=…&campaignId=…
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { getPcmFeed, isMtnAdsConfigured } from "@/lib/ads/mtn";
import type { AdFeedQueryParams } from "@/lib/ads/mtn";

export async function GET(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;

        const configured = await isMtnAdsConfigured();
        if (!configured) {
            return apiError(
                "MTN Advertising API non configurée. Ajoutez MTN_ADS_SUBSCRIPTION_KEY.",
                503
            );
        }

        const { searchParams } = new URL(request.url);

        const params: AdFeedQueryParams = {};
        if (searchParams.get("page")) params.page = Number(searchParams.get("page"));
        if (searchParams.get("pageSize"))
            params.pageSize = Number(searchParams.get("pageSize"));
        if (searchParams.get("advertiser"))
            params.advertiser = searchParams.get("advertiser")!;
        if (searchParams.get("campaignId"))
            params.campaignId = searchParams.get("campaignId")!;

        const feed = await getPcmFeed(params);

        return NextResponse.json({
            feeds: feed.data,
            total: feed.data.length,
            statusCode: feed.statusCode,
        });
    } catch (error) {
        console.error("GET /api/ads/feeds/pcm error:", error);
        return apiError(
            error instanceof Error ? error.message : "Erreur serveur",
            500
        );
    }
}
