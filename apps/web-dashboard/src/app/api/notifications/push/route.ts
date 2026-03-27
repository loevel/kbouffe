/**
 * POST /api/notifications/push
 * Envoie une push notification FCM à une liste de tokens.
 * Route interne — protégée par INTERNAL_API_SECRET.
 *
 * Body: { tokens: string[], title: string, body: string, data?: Record<string,string>, link?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { sendFcmBatch } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        // Protection par secret interne
        const secret = process.env.INTERNAL_API_SECRET;
        if (secret) {
            const auth = request.headers.get("authorization");
            if (auth !== `Bearer ${secret}`) {
                return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
            }
        }

        const body = await request.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

        const { tokens, title, body: msgBody, data, link } = body as {
            tokens?: string[];
            title?: string;
            body?: string;
            data?: Record<string, string>;
            link?: string;
        };

        if (!tokens?.length) return NextResponse.json({ error: "tokens[] requis" }, { status: 400 });
        if (!title || !msgBody) return NextResponse.json({ error: "title et body requis" }, { status: 400 });

        await sendFcmBatch(tokens, title, msgBody, data, link);

        return NextResponse.json({ success: true, sent: tokens.length });
    } catch (err: any) {
        console.error("[POST /api/notifications/push]", err);
        return NextResponse.json({ error: err.message ?? "Erreur serveur" }, { status: 500 });
    }
}
