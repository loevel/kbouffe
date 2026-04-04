/**
 * POST /api/admin/ai/moderate-review
 * Analyzes a customer review for toxicity and suggests a merchant response.
 * Body: { reviewId, rating, comment, restaurantName }
 * Returns: { toxicityScore, sentiment, flags, suggestedResponse, recommendation }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "Gemini non configuré" }, { status: 500 });

    const { ctx, error } = await withAdmin();
    if (error) return error;

    const body = await request.json();
    const { rating, comment, restaurantName } = body;

    if (!comment?.trim()) {
        return NextResponse.json({
            toxicityScore: 0,
            sentiment: "neutral",
            flags: [],
            suggestedResponse: null,
            recommendation: "keep",
        });
    }

    const prompt = `Tu es un modérateur expert pour KBouffe, une plateforme de livraison de repas au Cameroun.
Analyse cet avis client et fournis une évaluation de modération.

Restaurant: "${restaurantName ?? "Restaurant inconnu"}"
Note: ${rating}/5
Commentaire: "${comment}"

Évalue:
1. toxicityScore: de 0.0 (parfaitement sain) à 1.0 (très toxique/offensant)
2. sentiment: "positive", "neutral" ou "negative"
3. flags: liste des problèmes détectés parmi: ["insulte", "spam", "fake", "hors_sujet", "coordonnees_personnelles", "menace", "contenu_adulte"]
4. suggestedResponse: une réponse professionnelle et empathique que le restaurateur pourrait publier (max 200 caractères, en français, ton chaleureux). Null si la note est négative sans commentaire constructif.
5. recommendation: "keep" (garder visible), "review" (à examiner manuellement), "hide" (masquer immédiatement)

Réponds UNIQUEMENT avec ce JSON:
{
  "toxicityScore": 0.0,
  "sentiment": "positive",
  "flags": [],
  "suggestedResponse": "...",
  "recommendation": "keep"
}`;

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 400, responseMimeType: "application/json" },
            }),
        });

        if (!res.ok) return NextResponse.json({ error: "Erreur Gemini" }, { status: 502 });

        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        await ctx.supabase.from("ai_usage_logs").insert({
            restaurant_id: null,
            feature: "admin_moderate_review",
            tokens_used: 0,
        });

        return NextResponse.json({
            toxicityScore: parsed.toxicityScore ?? 0,
            sentiment: parsed.sentiment ?? "neutral",
            flags: parsed.flags ?? [],
            suggestedResponse: parsed.suggestedResponse ?? null,
            recommendation: parsed.recommendation ?? "keep",
        });
    } catch {
        return NextResponse.json({ error: "Impossible d'analyser l'avis" }, { status: 422 });
    }
}
