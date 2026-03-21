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

    let query = db
        .from("kds_notifications")
        .update({ processed: true })
        .eq("restaurant_id", restaurantId);

    if (ids && ids.length > 0) {
        query = query.in("id", ids);
    } else {
        query = query.eq("processed", false);
    }

    const { error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
