import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    const result = await withAdmin();
    if (result.error) return result.error;

    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    // Use true service-role client to bypass RLS for the update
    const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let query = db
        .from("admin_notifications")
        .update({ is_read: true });

    if (ids && ids.length > 0) {
        query = query.in("id", ids);
    } else {
        // Mark all unread as read
        query = query.eq("is_read", false);
    }

    const { error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
