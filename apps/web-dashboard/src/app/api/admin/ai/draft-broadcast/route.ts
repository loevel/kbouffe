/**
 * POST /api/admin/ai/draft-broadcast
 * Drafts a push notification message (2 A/B variants) using Gemini.
 * Body: { intent, template, targetType }
 * Returns: { variantA: { title, body }, variantB: { title, body } }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

const TARGET_LABELS: Record<string, string> = {
    all:    "tous les restaurateurs inscrits sur la plateforme",
    active: "les restaurants avec une boutique active et publiée",
    pack:   "les restaurants abonnés à un pack spécifique",
    city:   "les restaurants d'une ville particulière",
};

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "Gemini non configuré" }, { status: 500 });

    const { ctx, error } = await withAdmin();
    if (error) return error;

    const body = await request.json();
    const { intent, template, targetType } = body;

    if (!intent?.trim()) return NextResponse.json({ error: "L'intention est requise" }, { status: 400 });

    const targetDesc = TARGET_LABELS[targetType] ?? "les utilisateurs de la plateforme";

    const prompt = `Tu es un expert en marketing mobile pour KBouffe, une plateforme de commande de repas au Cameroun.
Tu rédiges des notifications push envoyées aux restaurateurs partenaires.

Intention de l'admin: "${intent.trim()}"
Type de message: ${template ?? "custom"}
Destinataires: ${targetDesc}

Contraintes techniques:
- Titre: max 60 caractères, percutant, peut avoir 1 emoji au début
- Corps: max 160 caractères, clair et actionnable, termine avec un verbe d'action

Génère 2 variantes A/B avec des angles différents (une plus directe, une plus émotionnelle).

Réponds UNIQUEMENT avec ce JSON:
{
  "variantA": { "title": "...", "body": "..." },
  "variantB": { "title": "...", "body": "..." }
}`;

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.85, maxOutputTokens: 300, responseMimeType: "application/json" },
            }),
        });

        if (!res.ok) return NextResponse.json({ error: "Erreur Gemini" }, { status: 502 });

        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        await ctx.supabase.from("ai_usage_logs").insert({
            restaurant_id: null,
            feature: "admin_draft_broadcast",
            tokens_used: 0,
        });

        return NextResponse.json({
            variantA: parsed.variantA ?? { title: "", body: "" },
            variantB: parsed.variantB ?? { title: "", body: "" },
        });
    } catch {
        return NextResponse.json({ error: "Impossible de générer le message" }, { status: 422 });
    }
}
