import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Fetch from user_sessions table once created
        // For now, return mock data
        const sessions = [
            {
                id: "session-1",
                device: "Chrome on macOS",
                ip_address: "192.168.1.1",
                user_agent: "Mozilla/5.0...",
                login_at: new Date().toISOString(),
                last_activity: new Date().toISOString(),
                is_current: true,
            },
        ];

        return Response.json({ sessions });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return Response.json({ sessions: [] });
    }
}
