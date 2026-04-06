/**
 * POST /api/account/push-token
 *
 * Saves or updates an Expo push token for the currently authenticated user.
 * Called by the mobile app on startup after permissions are granted.
 *
 * Body: { token: string, platform: 'ios' | 'android' }
 *
 * The token is upserted into the `public.push_tokens` table so that:
 *   - one user can have multiple tokens (different devices)
 *   - re-registering the same token is idempotent (ON CONFLICT DO UPDATE)
 *   - tokens belonging to a deleted user are removed automatically (CASCADE)
 *
 * DELETE /api/account/push-token
 *
 * Removes a specific token for the authenticated user (e.g. on sign-out).
 * Body: { token: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
    token: z.string().min(1, "Token requis"),
    platform: z
        .string()
        .refine((v) => ["ios", "android", "unknown"].includes(v), {
            message: "Plateforme invalide (ios | android | unknown)",
        })
        .default("unknown"),
});

const deleteSchema = z.object({
    token: z.string().min(1, "Token requis"),
});

// ── POST — register / refresh token ──────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 },
            );
        }

        // 2. Validate body
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Corps de requête JSON invalide" },
                { status: 400 },
            );
        }

        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Données invalides",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { token, platform } = parsed.data;

        // 3. Upsert token — use admin client to bypass RLS
        //    ON CONFLICT on (user_id, token) → update platform + updated_at
        const admin = await createAdminClient();
        const { error: upsertError } = await admin.from("push_tokens").upsert(
            {
                user_id: user.id,
                token,
                platform,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id,token",
                ignoreDuplicates: false,
            },
        );

        if (upsertError) {
            console.error(
                "POST /api/account/push-token — upsert error:",
                upsertError,
            );
            return NextResponse.json(
                { error: "Impossible d'enregistrer le token" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("POST /api/account/push-token — unexpected error:", err);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}

// ── DELETE — remove token on sign-out ────────────────────────────────────────

export async function DELETE(request: NextRequest) {
    try {
        // 1. Authenticate
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 },
            );
        }

        // 2. Validate body
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Corps de requête JSON invalide" },
                { status: 400 },
            );
        }

        const parsed = deleteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Données invalides",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { token } = parsed.data;

        // 3. Delete — use admin client to bypass RLS
        const admin = await createAdminClient();
        const { error: deleteError } = await admin
            .from("push_tokens")
            .delete()
            .eq("user_id", user.id)
            .eq("token", token);

        if (deleteError) {
            console.error(
                "DELETE /api/account/push-token — delete error:",
                deleteError,
            );
            return NextResponse.json(
                { error: "Impossible de supprimer le token" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(
            "DELETE /api/account/push-token — unexpected error:",
            err,
        );
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
