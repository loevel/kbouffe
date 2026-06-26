import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Catch-all proxy pour toute route /api/* SANS handler Next plus spécifique.
 *
 * Remplace le fallback rewrite de next.config (qui ne proxifie pas sur OpenNext
 * Cloudflare → 404/500 en prod, ex. /api/marketplace/suppliers, /api/admin/*,
 * /api/caisse/*). Les routes spécifiques (src/app/api/.../route.ts) ont la
 * priorité ; ce handler n'attrape que ce qui n'est pas déjà couvert.
 *
 * Transmet le JWT de session s'il existe, mais ne l'exige PAS : le backend Hono
 * applique sa propre auth par route (certaines routes sont publiques).
 */
const BACKEND_URL =
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

async function proxy(request: NextRequest): Promise<NextResponse> {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, BACKEND_URL);

    const headers: Record<string, string> = {};
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    } catch {
        // Pas de session → on forward sans Authorization (route publique).
    }

    let body: BodyInit | undefined;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("multipart/form-data")) {
            body = await request.formData(); // fetch fixe le boundary
        } else {
            const text = await request.text();
            if (text) {
                body = text;
                if (contentType) headers["content-type"] = contentType;
            }
        }
    }

    const upstreamReq = new Request(target.toString(), { method: request.method, headers, body });

    // Worker→worker via le service binding (fiable) ; fallback fetch URL en dev.
    let upstream: Response;
    try {
        const { env } = getCloudflareContext();
        const api = (env as unknown as { API?: { fetch: (r: Request) => Promise<Response> } }).API;
        upstream = api ? await api.fetch(upstreamReq) : await fetch(upstreamReq);
    } catch {
        upstream = await fetch(upstreamReq);
    }
    const respHeaders = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) respHeaders.set("content-type", ct);
    const cd = upstream.headers.get("content-disposition");
    if (cd) respHeaders.set("content-disposition", cd);

    return new NextResponse(upstream.body, { status: upstream.status, headers: respHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
