/**
 * GET  /api/admin/integrations — list all integration keys (values masked)
 * PUT  /api/admin/integrations — upsert a single key value
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";
import { invalidateIntegrationCache } from "@/lib/platform-integrations";

/** Mask a secret: show first 4 + dots + last 4 */
function mask(value: string | null, isSecret: boolean): string {
    if (!value || value.trim() === "") return "";
    if (!isSecret) return value;
    if (value.length <= 8) return "••••••••";
    return `${value.slice(0, 4)}${"•".repeat(12)}${value.slice(-4)}`;
}

export async function GET() {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { data, error } = await db
        .from("platform_integrations")
        .select("id, key_name, key_value, is_secret, category, label, description, placeholder, docs_url, updated_at, updated_by")
        .order("category")
        .order("key_name");

    if (error) {
        console.error("[GET /api/admin/integrations]", error);
        return apiError("Erreur de chargement");
    }

    // Never send raw secret values to the client
    const sanitized = (data ?? []).map((row: any) => ({
        ...row,
        key_value: undefined,                        // never expose
        masked_value: mask(row.key_value, row.is_secret),
        is_configured: !!row.key_value?.trim(),
    }));

    return NextResponse.json({ integrations: sanitized });
}

export async function PUT(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase, userId } = auth.ctx;
    const db = supabase as any;

    try {
        const { key_name, key_value } = await request.json();

        if (!key_name || typeof key_name !== "string") {
            return apiError("key_name requis", 400);
        }
        if (typeof key_value !== "string") {
            return apiError("key_value doit être une chaîne", 400);
        }

        // Verify the key exists in our registry
        const { data: existing, error: findErr } = await db
            .from("platform_integrations")
            .select("id, is_secret")
            .eq("key_name", key_name)
            .single();

        if (findErr || !existing) {
            return apiError("Clé inconnue", 404);
        }

        const { error: updateErr } = await db
            .from("platform_integrations")
            .update({
                key_value: key_value.trim() || null,
                updated_by: userId,
                updated_at: new Date().toISOString(),
            })
            .eq("key_name", key_name);

        if (updateErr) {
            console.error("[PUT /api/admin/integrations]", updateErr);
            return apiError("Erreur de mise à jour");
        }

        // Bust the server-side cache
        invalidateIntegrationCache();

        return NextResponse.json({
            success: true,
            masked_value: mask(key_value.trim(), existing.is_secret),
            is_configured: !!key_value.trim(),
        });
    } catch (err) {
        console.error("[PUT /api/admin/integrations] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}
