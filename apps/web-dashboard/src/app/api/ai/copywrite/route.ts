/**
 * POST /api/ai/copywrite
 * Generates an appetizing product description using Gemini Flash.
 * Body: { name: string, price?: number, category?: string, ingredients?: string }
 * Returns: { descriptions: string[] }
 */
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es un copywriter culinaire expert en cuisine africaine et camerounaise.
Tu génères des descriptions COURTES, ALLECHANTES et GOURMANDES pour des plats de restaurant.

Règles strictes :
- Maximum 2-3 phrases par description
- Ton chaleureux et gourmand, sans être pompeux
- Utilise des mots sensoriels (croustillant, fondant, savoureux, parfumé...)
- Pas d'emojis excessifs (1 max par description)
- Français naturel camerounais (pas trop soutenu)
- Mentionne les ingrédients clés si fournis
- Ne répète jamais le nom du plat mot pour mot au début

Tu retournes EXACTEMENT 3 descriptions différentes, séparées par "---".
- Variante 1 : Courte (1 phrase percutante)
- Variante 2 : Moyenne (2 phrases descriptives)
- Variante 3 : Storytelling (2-3 phrases avec émotion)`;

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "Gemini API key non configurée" },
            { status: 500 },
        );
    }

    try {
        const body = await request.json();
        const { name, price, category, ingredients } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Le nom du produit est requis" }, { status: 400 });
        }

        const userPrompt = [
            `Génère 3 descriptions pour ce plat :`,
            `- Nom : ${name}`,
            price ? `- Prix : ${price} FCFA` : null,
            category ? `- Catégorie : ${category}` : null,
            ingredients ? `- Ingrédients : ${ingredients}` : null,
        ]
            .filter(Boolean)
            .join("\n");

        const geminiRes = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 500,
                    topP: 0.95,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            console.error("[ai/copywrite] Gemini error:", geminiRes.status, errBody);
            return NextResponse.json(
                { error: "Erreur du service IA" },
                { status: 502 },
            );
        }

        const geminiData = await geminiRes.json();
        const rawText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        // Parse the 3 variants separated by "---"
        const descriptions = rawText
            .split("---")
            .map((d: string) => d.trim())
            .filter((d: string) => d.length > 10);

        // Fallback: if parsing fails, return the whole text as one description
        if (descriptions.length === 0 && rawText.trim()) {
            descriptions.push(rawText.trim());
        }

        return NextResponse.json({ descriptions });
    } catch (error) {
        console.error("[ai/copywrite] Unexpected error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
