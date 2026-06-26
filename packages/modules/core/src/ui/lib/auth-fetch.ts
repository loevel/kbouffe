"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Enhanced fetch that automatically includes the Supabase JWT
 * in the Authorization header.
 *
 * Prepends NEXT_PUBLIC_API_URL when the URL is relative, so that
 * the dashboard (deployed separately from the API) always targets
 * the correct Hono backend in production.
 *
 * Use this for all client-side API calls to the Hono backend.
 */
export async function authFetch(url: string, options: RequestInit = {}) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const fullUrl = url.startsWith("http") ? url : `${base}${url}`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(fullUrl, {
        ...options,
        headers,
    });
}

/**
 * Like authFetch but ALWAYS same-origin: it never prepends NEXT_PUBLIC_API_URL.
 *
 * Use this for endpoints that are implemented as Next.js route handlers on the
 * dashboard itself (e.g. /api/ai/*, /api/notifications) rather than on the Hono
 * backend. Sending those to the backend worker yields a 404.
 *
 * The JWT is still attached (harmless), but these local handlers authenticate
 * via the session cookie, which is sent automatically on same-origin requests.
 */
export async function localFetch(url: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
