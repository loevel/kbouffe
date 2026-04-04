/**
 * POST /api/admin/ai/suggest-section
 * Generates title + subtitle for a homepage section using Gemini.
 * Body: { type, auto_rule, display_style, hint? }
 * Returns: { title, subtitle }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

const RULE_LABELS: Record<string, string> = {
    featured:  "restaurants mis en avant (sponsorisés + premium + meilleure note)",
    top_rated: "restaurants les mieux notés par les clients",
    popular:   "restaurants les plus populaires selon le volume de commandes",
    newest:    "nouveaux restaurants récemment inscrits",
    sponsored: "restaurants partenaires sponsorisés",
};

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "Gemini non configuré" }, { status: 500 });

    const { ctx, error } = await withAdmin();
    if (error) return error;

    const body = await request.json();
    const { type, auto_rule, display_style, hint } = body;

    const ruleDesc = auto_rule ? RULE_LABELS[auto_rule] ?? auto_rule : null;
    const styleDesc = display_style === "circles" ? "affichage en cercles (style navigation rapide)" : "affichage en cartes horizontales défilantes";

    const prompt = `Tu es un expert en marketing pour une plateforme de commande de repas en Afrique (Cameroun, contexte FCFA).
Tu génères des textes pour la page d'accueil du store KBouffe.

Section à créer:
- Type: ${type === "auto" ? "automatique" : type === "manual" ? "manuelle" : "saisonnière"}
${ruleDesc ? `- Règle: ${ruleDesc}` : ""}
- Style: ${styleDesc}
${hint ? `- Contexte fourni par l'admin: "${hint}"` : ""}

Génère un titre accrocheur (max 35 caractères) et un sous-titre engageant (max 70 caractères) pour cette section.
Le ton doit être chaleureux, local, incitatif. Pas de majuscules partout. Pas d'emojis dans le titre.

Réponds UNIQUEMENT avec ce JSON:
{
  "title": "...",
  "subtitle": "..."
}`;

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9, maxOutputTokens: 150, responseMimeType: "application/json" },
            }),
        });

        if (!res.ok) return NextResponse.json({ error: "Erreur Gemini" }, { status: 502 });

        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Log usage (admin call — no restaurant_id)
        await ctx.supabase.from("ai_usage_logs").insert({
            restaurant_id: null,
            feature: "admin_suggest_section",
            tokens_used: 0,
        });

        return NextResponse.json({ title: parsed.title ?? "", subtitle: parsed.subtitle ?? "" });
    } catch {
        return NextResponse.json({ error: "Impossible de générer le contenu" }, { status: 422 });
    }
}
