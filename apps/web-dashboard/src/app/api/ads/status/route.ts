/**
 * GET /api/ads/status — Check MTN Advertising API configuration status.
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { isMtnAdsConfigured } from "@/lib/ads/mtn";

export async function GET() {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;

        const configured = await isMtnAdsConfigured();

        return NextResponse.json({ configured });
    } catch (error) {
        console.error("GET /api/ads/status error:", error);
        return NextResponse.json({ configured: false });
    }
}
