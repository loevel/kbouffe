import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";

export async function GET() {
    const result = await withAuth();
    if (result.error) return result.error;

    const { supabase, restaurantId } = result.ctx;

    // Fetch last 20 kds_notifications for this restaurant, unread first
    const { data: notifications, error } = await supabase
        .from("kds_notifications" as any)
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("processed", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = (notifications as any[])?.filter(
        (n: any) => !n.processed
    ).length ?? 0;

    return NextResponse.json({ notifications: notifications ?? [], unreadCount });
}
