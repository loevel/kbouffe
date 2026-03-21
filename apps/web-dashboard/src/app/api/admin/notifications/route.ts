import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

export async function GET() {
    const result = await withAdmin();
    if (result.error) return result.error;

    const { supabase } = result.ctx;

    // Fetch last 30 admin notifications
    const { data: notifications, error } = await supabase
        .from("admin_notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = (notifications as any[])?.filter(
        (n: any) => !n.is_read
    ).length ?? 0;

    return NextResponse.json({ notifications: notifications ?? [], unreadCount });
}
