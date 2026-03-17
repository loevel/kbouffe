import { createClient } from "@/lib/supabase/client";

export async function authFetch(url: string, options: RequestInit = {}) {
    const supabase = createClient();
    const headers: Record<string, string> = { ...((options.headers as any) || {}) };
    
    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
        }
    }
    
    return fetch(url, { ...options, headers });
}
