/**
 * Backend API proxy — forwards Next.js route handler requests to the Hono backend
 * using the Supabase session JWT as Bearer token.
 *
 * Usage (same URL):
 *   export const GET  = (req: NextRequest) => backendProxy(req);
 *
 * Usage (URL mismatch — web-dashboard path differs from backend path):
 *   export const GET  = (req: NextRequest) => backendProxy(req, "/api/restaurant/support/tickets");
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BACKEND_URL = process.env.API_URL ?? "http://localhost:8787";

export async function backendProxy(request: NextRequest, targetPath?: string): Promise<NextResponse> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Use explicit targetPath override if provided, otherwise forward the pathname as-is
    const path = targetPath ?? request.nextUrl.pathname;
    const target = new URL(path + request.nextUrl.search, BACKEND_URL);

    const isMultipart = (request.headers.get("content-type") ?? "").includes("multipart/form-data");

    let body: BodyInit | undefined;
    const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
    };

    if (["POST", "PUT", "PATCH"].includes(request.method)) {
        if (isMultipart) {
            body = await request.formData();
            // Do NOT set Content-Type — fetch sets it with the boundary automatically
        } else {
            const text = await request.text();
            if (text) {
                body = text;
                headers["Content-Type"] = "application/json";
            }
        }
    } else {
        headers["Content-Type"] = "application/json";
    }

    try {
        const res = await fetch(target.toString(), {
            method: request.method,
            headers,
            body,
        });

        const contentType = res.headers.get("content-type") ?? "";
        const data = contentType.includes("application/json")
            ? await res.json().catch(() => null)
            : await res.text().catch(() => null);

        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error(`[backendProxy] ${request.method} ${target} →`, err);
        return NextResponse.json({ error: "Erreur de communication avec le backend" }, { status: 502 });
    }
}

/**
 * Like backendProxy but returns raw data + status instead of a NextResponse.
 * Use this when you need to adapt the response shape before returning it to the client.
 *
 * Example:
 *   const { data, status } = await backendFetch(req);
 *   return NextResponse.json({ restaurant: data, success: true }, { status });
 */
export async function backendFetch<T = unknown>(
    request: NextRequest,
    targetPath?: string,
): Promise<{ data: T | null; status: number; ok: boolean }> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        return { data: null, status: 401, ok: false };
    }

    const path = targetPath ?? request.nextUrl.pathname;
    const target = new URL(path + request.nextUrl.search, BACKEND_URL);

    const isMultipart = (request.headers.get("content-type") ?? "").includes("multipart/form-data");
    let body: BodyInit | undefined;
    const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
    };

    if (["POST", "PUT", "PATCH"].includes(request.method)) {
        if (isMultipart) {
            body = await request.formData();
        } else {
            const text = await request.text();
            if (text) {
                body = text;
                headers["Content-Type"] = "application/json";
            }
        }
    } else {
        headers["Content-Type"] = "application/json";
    }

    try {
        const res = await fetch(target.toString(), { method: request.method, headers, body });
        const data = await res.json().catch(() => null) as T | null;
        return { data, status: res.status, ok: res.ok };
    } catch (err) {
        console.error(`[backendFetch] ${request.method} ${target} →`, err);
        return { data: null, status: 502, ok: false };
    }
}
