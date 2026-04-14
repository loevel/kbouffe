/**
 * POST /api/broadcasts/track — Track broadcast opens (pixel tracking)
 *
 * Called when user clicks notification or opens dashboard
 * Public endpoint (no auth required for pixel tracking)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function POST(request: NextRequest) {
    const db = serviceDb() as any;

    try {
        const body = await request.json();
        const { broadcastId, restaurantId, action, clickedLink, userAgent, ipAddress } = body;

        if (!broadcastId || !restaurantId || !action) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        // Record the analytics event
        const { error } = await db.from("broadcast_analytics").insert({
            broadcast_id: broadcastId,
            restaurant_id: restaurantId,
            action,
            clicked_link: clickedLink || null,
            user_agent: userAgent || null,
            ip_address: ipAddress || null,
        });

        if (error) {
            console.error("[broadcast track]", error);
            // Don't error - tracking failures shouldn't break the app
            return NextResponse.json({ success: true });
        }

        // Update broadcast summary stats
        const { data: stats } = await db
            .from("broadcast_analytics")
            .select("action", { count: "exact" })
            .eq("broadcast_id", broadcastId)
            .in("action", ["opened", "clicked"]);

        const opens = (stats ?? []).filter((s: any) => s.action === "opened").length;
        const clicks = (stats ?? []).filter((s: any) => s.action === "clicked").length;

        const { data: sent } = await db
            .from("admin_broadcasts")
            .select("tokens_sent")
            .eq("id", broadcastId)
            .single();

        const openRate = sent && sent.tokens_sent > 0
            ? Math.round((opens / sent.tokens_sent) * 100 * 100) / 100
            : 0;

        await db
            .from("admin_broadcasts")
            .update({
                total_opens: opens,
                total_clicks: clicks,
                open_rate: openRate,
            })
            .eq("id", broadcastId);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[broadcast track] error:", err);
        // Don't error - tracking should never break user experience
        return NextResponse.json({ success: true });
    }
}

// GET — return 1x1 transparent pixel (for img src tracking)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const broadcastId = searchParams.get("bid");
    const restaurantId = searchParams.get("rid");

    if (broadcastId && restaurantId) {
        // Async track without blocking response
        const trackPromise = fetch(request.nextUrl.origin + "/api/broadcasts/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                broadcastId,
                restaurantId,
                action: "opened",
                userAgent: request.headers.get("user-agent"),
                ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip"),
            }),
        }).catch(() => {}); // Silently fail if tracking fails
    }

    // Return 1x1 transparent GIF pixel
    const pixel = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
        0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a,
        0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);

    return new NextResponse(pixel, {
        headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    });
}
