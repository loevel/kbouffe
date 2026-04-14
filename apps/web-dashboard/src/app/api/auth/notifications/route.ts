import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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

export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    // Use service client to bypass RLS
    const db = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let query = db
        .from("client_notifications")
        .delete()
        .eq("user_id", user.id);

    if (ids && ids.length > 0) {
        query = query.in("id", ids);
    }

    const { error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
