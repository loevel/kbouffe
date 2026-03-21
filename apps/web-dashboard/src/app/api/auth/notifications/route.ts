import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Fetch client notifications for this user
    const { data: notifications, error } = await supabase
        .from("client_notifications" as any)
        .select("*")
        .eq("user_id", user.id)
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
