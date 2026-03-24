import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";

export async function GET() {
    const result = await withAuth();
    if (result.error) return result.error;

    const { supabase, restaurantId } = result.ctx;

    // Fetch both kds_notifications and restaurant_notifications in parallel
    const [kdsRes, engagementRes] = await Promise.all([
        supabase
            .from("kds_notifications" as any)
            .select("*")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .limit(15),
        supabase
            .from("restaurant_notifications")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .limit(10),
    ]);

    // Normalize kds_notifications into a unified format
    const kdsNotifs = ((kdsRes.data as any[]) ?? []).map((n: any) => ({
        id: n.id,
        restaurant_id: n.restaurant_id,
        order_id: n.order_id,
        event_type: n.event_type,
        payload: n.payload ?? {},
        processed: n.processed,
        created_at: n.created_at,
        _source: "kds" as const,
    }));

    // Normalize engagement notifications (daily_summary, badge_earned, inactive_customer)
    const engagementNotifs = ((engagementRes.data as any[]) ?? []).map((n: any) => ({
        id: n.id,
        restaurant_id: n.restaurant_id,
        order_id: null,
        event_type: n.type,
        payload: { ...((n.payload as Record<string, unknown>) ?? {}), title: n.title, body: n.body },
        processed: n.is_read,
        created_at: n.created_at,
        _source: "engagement" as const,
    }));

    // Merge and sort by created_at desc, limit to 20
    const merged = [...kdsNotifs, ...engagementNotifs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

    const unreadCount = merged.filter((n) => !n.processed).length;

    return NextResponse.json({ notifications: merged, unreadCount });
}
