/**
 * POST /api/ai/content-calendar
 * Generates a week of social media content suggestions using Gemini.
 * Body: { weekStartDate?: string, focusProducts?: string[], platforms?: string[] }
 * Returns: { calendar: { day, platform, contentIdea, hashtags, bestTime }[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai-rate-limiter";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API key non configuree" }, { status: 500 });
    }

    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const rateCheck = await checkAiRateLimit(supabase, restaurantId, "ai_calendar");
    if (!rateCheck.allowed) {
        return NextResponse.json({
            error: `Limite quotidienne atteinte (${rateCheck.limit}/jour). Reessayez demain.`,
            usage: rateCheck,
        }, { status: 429 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const {
            weekStartDate = new Date().toISOString().split("T")[0],
            platforms = ["facebook", "instagram", "tiktok"],
        } = body;

        // Get restaurant info and products
        const [{ data: restaurant }, { data: products }] = await Promise.all([
            supabase
                .from("restaurants")
                .select("name, description")
                .eq("id", restaurantId)
                .single(),
            supabase
                .from("products")
                .select("name, price, description, is_limited_edition")
                .eq("restaurant_id", restaurantId)
                .eq("is_available", true)
                .order("price", { ascending: false })
                .limit(20),
        ]);

        const productList = (products ?? []).map((p: any) =>
            `- ${p.name} (${p.price} FCFA)${p.is_limited_edition ? " [EDITION LIMITEE]" : ""}${p.description ? `: ${p.description}` : ""}`
        ).join("\n");

        const prompt = `Tu es un expert en marketing digital pour la restauration africaine/camerounaise.

RESTAURANT: ${restaurant?.name ?? "Restaurant camerounais"}
${restaurant?.description ? `Description: ${restaurant.description}` : ""}

MENU (produits disponibles):
${productList || "Pas de produits specifiques"}

PLATEFORMES: ${platforms.join(", ")}
SEMAINE COMMENCANT LE: ${weekStartDate}

Genere un calendrier de contenu pour 7 jours (lundi a dimanche).
Pour chaque jour, propose 1 a 2 publications adaptees aux plateformes.

Varie les types de contenu:
- Lundi: Motivation / "Bon debut de semaine"
- Mardi: Mise en avant d'un plat specifique
- Mercredi: Promotion / offre speciale
- Jeudi: Behind-the-scenes / coulisses
- Vendredi: Plat du week-end / offre speciale vendredi
- Samedi: Contenu interactif (sondage, quiz)
- Dimanche: Brunch / repas en famille / recette

Retourne un JSON VALIDE:
{
  "calendar": [
    {
      "day": "Lundi",
      "date": "2026-03-25",
      "platform": "instagram",
      "type": "product_highlight" | "promo" | "behind_scenes" | "interactive" | "storytelling" | "motivation",
      "contentIdea": "Description courte de l'idee de publication",
      "caption": "Le texte complet du post (avec emojis)",
      "hashtags": ["#tag1", "#tag2"],
      "bestTime": "12:00",
      "productName": "Ndole" | null
    }
  ]
}

Regles:
- 7 a 14 entrees (1-2 par jour)
- Alterner les plateformes
- Mettre en avant les produits en edition limitee en priorite
- Heures de publication adaptees a l'Afrique centrale (GMT+1)
- Tout en francais`;

        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 3000,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("[ai/content-calendar] Gemini error:", res.status, errText);
            return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        let parsed;
        try {
            const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error("[ai/content-calendar] Parse error:", rawText);
            return NextResponse.json({ error: "Impossible de generer le calendrier" }, { status: 422 });
        }

        await logAiUsage(supabase, restaurantId, "ai_calendar");

        return NextResponse.json({
            calendar: parsed.calendar ?? [],
            weekStartDate,
            total: (parsed.calendar ?? []).length,
        });
    } catch (error) {
        console.error("[ai/content-calendar] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
