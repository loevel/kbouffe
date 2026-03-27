/**
 * POST /api/ai/ocr-menu
 * Takes a photo of a paper menu and extracts products using Gemini Flash Vision.
 * Body: FormData with "image" file
 * Returns: { products: { name, price, category, description }[] }
 */
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es un expert en extraction de menus de restaurant.
Tu reçois une photo d'un menu papier, tableau noir, affiche, ou document de restaurant.

Ta mission : extraire TOUS les plats/articles visibles avec leurs prix.

Retourne un JSON VALIDE (pas de markdown, pas de backticks) avec cette structure exacte :
{
  "products": [
    {
      "name": "Nom du plat",
      "price": 2500,
      "category": "Plats Principaux",
      "description": ""
    }
  ],
  "categories": ["Plats Principaux", "Boissons", "Desserts"]
}

Règles :
- Le prix doit être un nombre entier (en FCFA). Si le prix n'est pas visible, mets 0.
- Catégorise intelligemment : Entrées, Plats Principaux, Grillades, Boissons, Desserts, Accompagnements, etc.
- Si la catégorie n'est pas claire, utilise "Autres"
- La description est optionnelle — laisse vide si non visible
- Extrais TOUT ce qui ressemble à un article/plat avec un prix
- Gère les formats de prix variés : "2500", "2.500", "2500 FCFA", "2500F", etc.
- Si le texte est flou ou illisible, fais de ton mieux et note "?" dans le nom`;

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "Gemini API key non configurée" },
            { status: 500 },
        );
    }

    try {
        const formData = await request.formData();
        const imageFile = formData.get("image") as File | null;

        if (!imageFile) {
            return NextResponse.json({ error: "Image requise" }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await imageFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = imageFile.type || "image/jpeg";

        const geminiRes = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [
                    {
                        parts: [
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64,
                                },
                            },
                            {
                                text: "Analyse cette photo de menu et extrais tous les plats avec leurs prix. Retourne uniquement du JSON valide.",
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.2, // Low temperature for accuracy
                    maxOutputTokens: 4000,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            console.error("[ai/ocr-menu] Gemini error:", geminiRes.status, errBody);
            return NextResponse.json(
                { error: "Erreur du service IA de reconnaissance" },
                { status: 502 },
            );
        }

        const geminiData = await geminiRes.json();
        const rawText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        // Parse JSON response
        let parsed;
        try {
            // Clean potential markdown code blocks
            const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error("[ai/ocr-menu] Failed to parse JSON:", rawText);
            return NextResponse.json(
                { error: "Impossible de lire le menu. Essayez avec une photo plus nette." },
                { status: 422 },
            );
        }

        const products = (parsed.products ?? []).map((p: any) => ({
            name: String(p.name ?? "").trim(),
            price: typeof p.price === "number" ? p.price : parseInt(String(p.price).replace(/\D/g, ""), 10) || 0,
            category: String(p.category ?? "Autres").trim(),
            description: String(p.description ?? "").trim(),
        }));

        const categories = parsed.categories ?? [...new Set(products.map((p: any) => p.category))];

        return NextResponse.json({
            products,
            categories,
            total: products.length,
        });
    } catch (error) {
        console.error("[ai/ocr-menu] Unexpected error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
