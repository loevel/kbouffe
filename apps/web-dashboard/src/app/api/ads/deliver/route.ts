/**
 * POST /api/ads/deliver — Process active campaigns and deliver push notifications.
 *
 * This is an admin endpoint intended to be called by a cron job or manually
 * to process campaigns that have push delivery enabled.
 *
 * Also returns MTN ad feed status for monitoring.
 */
import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { processActivePushCampaigns, fetchAdFeeds } from "@/lib/ads/service";

export async function POST() {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;

        // Fetch MTN ad feeds (for monitoring/logging)
        const feeds = await fetchAdFeeds();

        // Process active campaigns with pending push delivery
        const deliveryResults = await processActivePushCampaigns();

        return NextResponse.json({
            processed: deliveryResults.length,
            results: deliveryResults,
            feeds: {
                configured: feeds.configured,
                smsFeedCount: feeds.sms?.data.length ?? 0,
                pcmFeedCount: feeds.pcm?.data.length ?? 0,
                fetchedAt: feeds.fetchedAt,
            },
        });
    } catch (error) {
        console.error("POST /api/ads/deliver error:", error);
        return apiError(
            error instanceof Error ? error.message : "Erreur serveur",
            500
        );
    }
}
