/**
 * POST /api/ai/translate
 * Traduit du texte FR → EN via Gemini Flash.
 * Body: { texts: string[] }  — tableau de textes à traduire
 * Returns: { translations: string[] }
 *
 * Utilisé dans ProductForm et CategoryList pour la traduction automatique.
 */
import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/platform-integrations";

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `You are a professional culinary translator specializing in African and Cameroonian cuisine.
Translate the provided French text(s) into natural, appealing English.

Rules:
- Keep the tone warm and appetizing
- Preserve food-specific terms when there's no direct English equivalent (e.g., "ndolé", "foléré", "miondo")
- Keep it concise and natural
- Do NOT add explanations or notes
- Return ONLY the translated texts, one per line, in the same order as the input
- If a text is already in English or empty, return it as-is`;

export async function POST(request: NextRequest) {
    const apiKey = await getIntegration("GEMINI_API_KEY") ?? process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "Clé API Gemini non configurée" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { texts } = body as { texts: string[] };

        if (!Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json(
                { error: "Le champ 'texts' doit être un tableau non vide" },
                { status: 400 }
            );
        }

        // Filter out empty texts but keep track of indices
        const nonEmpty = texts.map((t, i) => ({ index: i, text: t?.trim() ?? "" }));
        const toTranslate = nonEmpty.filter(({ text }) => text.length > 0);

        if (toTranslate.length === 0) {
            return NextResponse.json({ translations: texts.map(() => "") });
        }

        const userPrompt = `Translate these ${toTranslate.length} French text(s) to English:\n\n` +
            toTranslate.map(({ text }, i) => `${i + 1}. ${text}`).join("\n");

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 800,
                    topP: 0.9,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            console.error("[ai/translate] Gemini error:", geminiRes.status, errBody);
            return NextResponse.json(
                { error: "Erreur du service IA" },
                { status: 502 }
            );
        }

        const geminiData = await geminiRes.json();
        const rawText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();

        // Parse numbered lines "1. text" or plain lines
        const lines = rawText
            .split("\n")
            .map((l: string) => l.replace(/^\d+\.\s*/, "").trim())
            .filter((l: string) => l.length > 0);

        // Rebuild full array preserving empty slots
        const translations = texts.map((original, i) => {
            const found = toTranslate.findIndex(({ index }) => index === i);
            if (found === -1) return ""; // was empty
            return lines[found] ?? original; // fallback to original if parsing fails
        });

        return NextResponse.json({ translations });
    } catch (err) {
        console.error("[ai/translate] Unexpected error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
