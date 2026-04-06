/**
 * POST /api/admin/email-templates/[id]/ai/[action]
 * Proxy vers le Cloudflare Worker pour les actions IA :
 * - improve, translate, variants
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

const WORKER_URL =
    process.env.API_WORKER_URL ?? "https://kbouffe-api.davechendjou.workers.dev";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; action: string }> }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { adminRole } = auth.ctx;

    if (adminRole !== "super_admin") {
        return NextResponse.json(
            { error: "Accès refusé. Super admin uniquement." },
            { status: 403 }
        );
    }

    const { id, action } = await params;

    if (!["improve", "translate", "variants"].includes(action)) {
        return NextResponse.json({ error: "Action IA invalide" }, { status: 400 });
    }

    const token = request.headers.get("Authorization");
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    const res = await fetch(`${WORKER_URL}/admin/email-templates/${id}/ai/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
