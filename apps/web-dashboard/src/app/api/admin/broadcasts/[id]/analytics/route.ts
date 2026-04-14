/**
 * GET /api/admin/broadcasts/[id]/analytics — Get broadcast analytics
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";

function serviceDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const db = serviceDb() as any;
    const broadcastId = params.id;

    try {
        // Get broadcast summary
        const { data: broadcast, error: broadcastError } = await db
            .from("admin_broadcasts")
            .select("id, title, tokens_sent, total_opens, total_clicks, open_rate, sent_at")
            .eq("id", broadcastId)
            .single();

        if (broadcastError || !broadcast) {
            return apiError("Broadcast not found", 404);
        }

        // Get detailed analytics
        const { data: analytics, error: analyticsError } = await db
            .from("broadcast_analytics")
            .select("action, created_at, restaurant_id")
            .eq("broadcast_id", broadcastId)
            .order("created_at", { ascending: false });

        if (analyticsError) {
            console.error("[GET analytics]", analyticsError);
            return apiError("Erreur lors de la récupération des analytics");
        }

        // Calculate timeline data (last 7 days)
        const timelineData: Record<string, { opens: number; clicks: number }> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toLocaleDateString("fr-FR");
            timelineData[key] = { opens: 0, clicks: 0 };
        }

        (analytics ?? []).forEach((event: any) => {
            const date = new Date(event.created_at).toLocaleDateString("fr-FR");
            if (timelineData[date]) {
                if (event.action === "opened") timelineData[date].opens++;
                if (event.action === "clicked") timelineData[date].clicks++;
            }
        });

        const timeline = Object.entries(timelineData).map(([date, data]) => ({
            date,
            opens: data.opens,
            clicks: data.clicks,
        }));

        // Get unique restaurants that opened
        const openedRestaurants = new Set(
            (analytics ?? [])
                .filter((e: any) => e.action === "opened")
                .map((e: any) => e.restaurant_id)
        );

        const clickedRestaurants = new Set(
            (analytics ?? [])
                .filter((e: any) => e.action === "clicked")
                .map((e: any) => e.restaurant_id)
        );

        return NextResponse.json({
            broadcast,
            summary: {
                sent: broadcast.tokens_sent,
                opens: broadcast.total_opens,
                clicks: broadcast.total_clicks,
                openRate: broadcast.open_rate,
                openedRestaurants: openedRestaurants.size,
                clickedRestaurants: clickedRestaurants.size,
            },
            timeline,
        });
    } catch (err: any) {
        console.error("[GET /api/admin/broadcasts/[id]/analytics]", err);
        return apiError("Erreur serveur");
    }
}
