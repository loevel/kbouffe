/**
 * POST /api/admin/broadcast/test — envoie un test broadcast à l'admin connecté
 *
 * Essaie d'envoyer un FCM test si l'admin a un push token,
 * sinon envoie une notification dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";
import { sendFcmMessage } from "@/lib/firebase/admin";

function serviceDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const { userId } = auth.ctx;
    const db = serviceDb() as any;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Body JSON invalide", 400);
    }

    const { title, bodyText, link } = body;

    if (!title?.trim() || !bodyText?.trim()) {
        return apiError("Titre et message requis", 400);
    }

    try {
        // Chercher le push token de l'admin
        const { data: tokenRow } = await db
            .from("push_tokens")
            .select("token")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const token = tokenRow?.token;

        if (token) {
            // Envoyer FCM test
            try {
                await sendFcmMessage({
                    token,
                    title: `[TEST] ${title.trim()}`,
                    body: bodyText.trim(),
                    data: { test: "true" },
                    link: link ?? "/admin/broadcast",
                });

                return NextResponse.json({
                    success: true,
                    message: "Test FCM envoyé à votre appareil.",
                    method: "fcm",
                });
            } catch (fcmErr: any) {
                console.warn("[broadcast test] FCM failed, trying dashboard notification:", fcmErr?.message);
                // Continue vers dashboard notification
            }
        }

        // Fallback: créer une notification dashboard
        await db.from("admin_notifications").insert({
            admin_id: userId,
            type: "broadcast_test",
            title: `[TEST] ${title.trim()}`,
            body: bodyText.trim(),
            payload: { link: link ?? "/admin/broadcast", test: true },
            is_read: false,
        });

        return NextResponse.json({
            success: true,
            message: "Notification de test envoyée à votre dashboard.",
            method: "dashboard",
        });
    } catch (err: any) {
        console.error("[broadcast test] error:", err?.message);
        return apiError("Erreur lors de l'envoi du test");
    }
}
