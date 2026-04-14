import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { createClient } from "@supabase/supabase-js";

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

export async function DELETE(request: NextRequest) {
    const result = await withAuth();
    if (result.error) return result.error;

    const { restaurantId } = result.ctx;
    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;
    const source: "kds" | "engagement" | "all" = body.source ?? "engagement";

    // Use service client to bypass RLS
    const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];

    // Delete from kds_notifications if requested
    if (source === "kds" || source === "all") {
        let kdsQuery = db
            .from("kds_notifications")
            .delete()
            .eq("restaurant_id", restaurantId);

        if (ids && ids.length > 0) {
            kdsQuery = kdsQuery.in("id", ids);
        }

        const kdsResult = await kdsQuery;
        if (kdsResult.error) {
            return NextResponse.json({ error: kdsResult.error.message }, { status: 500 });
        }
        results.push(kdsResult);
    }

    // Delete from restaurant_notifications if requested
    if (source === "engagement" || source === "all") {
        let engagementQuery = db
            .from("restaurant_notifications")
            .delete()
            .eq("restaurant_id", restaurantId);

        if (ids && ids.length > 0) {
            engagementQuery = engagementQuery.in("id", ids);
        }

        const engagementResult = await engagementQuery;
        if (engagementResult.error) {
            return NextResponse.json({ error: engagementResult.error.message }, { status: 500 });
        }
        results.push(engagementResult);
    }

    return NextResponse.json({ success: true, deleted: results.length });
}
