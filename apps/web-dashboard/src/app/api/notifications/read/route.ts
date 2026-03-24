import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    const result = await withAuth();
    if (result.error) return result.error;

    const { restaurantId } = result.ctx;
    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    // Use true service-role client to bypass RLS
    const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Mark both kds_notifications and restaurant_notifications as read
    const kdsQuery = ids && ids.length > 0
        ? db.from("kds_notifications").update({ processed: true }).eq("restaurant_id", restaurantId).in("id", ids)
        : db.from("kds_notifications").update({ processed: true }).eq("restaurant_id", restaurantId).eq("processed", false);

    const engagementQuery = ids && ids.length > 0
        ? db.from("restaurant_notifications").update({ is_read: true }).eq("restaurant_id", restaurantId).in("id", ids)
        : db.from("restaurant_notifications").update({ is_read: true }).eq("restaurant_id", restaurantId).eq("is_read", false);

    const [kdsResult, engagementResult] = await Promise.all([kdsQuery, engagementQuery]);

    const error = kdsResult.error || engagementResult.error;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
