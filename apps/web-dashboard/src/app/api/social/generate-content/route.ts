/**
 * POST /api/social/generate-content
 * Uses Gemini to generate social media content for a product or promotion.
 * Body: { productName, description?, platform, tone?, promoText? }
 * Returns: { posts: { platform, content, hashtags }[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai-rate-limiter";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const PLATFORM_SPECS: Record<string, { maxChars: number; style: string }> = {
    facebook: {
        maxChars: 500,
        style: "Post Facebook engageant, ton chaleureux et communautaire, avec emojis. Inclure un appel a l'action (CTA). Peut etre plus long.",
    },
    instagram: {
        maxChars: 2200,
        style: "Legende Instagram captivante. Commencer par un hook accrocheur. Utiliser des emojis strategiquement. Terminer par 15-20 hashtags pertinents sur une ligne separee.",
    },
    tiktok: {
        maxChars: 300,
        style: "Description TikTok ultra-courte et percutante. Ton jeune et dynamique. 3-5 hashtags tendance max. Emojis. Hook en premiere ligne.",
    },
    telegram: {
        maxChars: 4096,
        style: "Message Telegram informatif et direct. Format structure avec emojis comme bullet points. Inclure prix et details pratiques.",
    },
    whatsapp: {
        maxChars: 1000,
        style: "Message WhatsApp Business professionnel mais convivial. Format liste avec emojis. Court et actionnable. Inclure prix.",
    },
};

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "Gemini API key non configuree" },
            { status: 500 }
        );
    }

    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const rateCheck = await checkAiRateLimit(supabase, restaurantId, "ai_social");
    if (!rateCheck.allowed) {
        return NextResponse.json({
            error: `Limite quotidienne atteinte (${rateCheck.limit}/jour). Reessayez demain.`,
            usage: rateCheck,
        }, { status: 429 });
    }

    try {
        const body = await request.json();
        const {
            productName,
            description = "",
            platform = "all",
            tone = "engageant",
            promoText = "",
            price,
            restaurantName = "",
        } = body;

        if (!productName?.trim()) {
            return NextResponse.json({ error: "Nom du produit requis" }, { status: 400 });
        }

        const platforms = platform === "all"
            ? Object.keys(PLATFORM_SPECS)
            : [platform].filter((p: string) => PLATFORM_SPECS[p]);

        if (platforms.length === 0) {
            return NextResponse.json({ error: "Plateforme invalide" }, { status: 400 });
        }

        const platformInstructions = platforms.map((p: string) => {
            const spec = PLATFORM_SPECS[p];
            return `### ${p.toUpperCase()}
Style : ${spec.style}
Longueur max : ${spec.maxChars} caracteres`;
        }).join("\n\n");

        const systemPrompt = `Tu es un expert en marketing digital pour la restauration africaine/camerounaise.
Tu crees du contenu social media engageant qui donne faim et genere des commandes.

Contexte :
- Restaurant : ${restaurantName || "Restaurant camerounais"}
- Plat : ${productName}
${description ? `- Description : ${description}` : ""}
${price ? `- Prix : ${price} FCFA` : ""}
${promoText ? `- Promotion : ${promoText}` : ""}
- Ton souhaite : ${tone}

Genere un post pour CHAQUE plateforme demandee ci-dessous.
${platformInstructions}

IMPORTANT :
- Ecris en francais
- Adapte le style a chaque plateforme
- Utilise des emojis pertinents
- Mentionne le prix si disponible
- Si c'est une promo, mets-la en avant

Retourne un JSON VALIDE (pas de markdown, pas de backticks) :
{
  "posts": [
    {
      "platform": "facebook",
      "content": "Le texte du post...",
      "hashtags": ["#tag1", "#tag2"]
    }
  ]
}`;

        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2000,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("[social/generate-content] Gemini error:", res.status, errText);
            return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        let parsed;
        try {
            const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error("[social/generate-content] Parse error:", rawText);
            return NextResponse.json(
                { error: "Impossible de generer le contenu. Reessayez." },
                { status: 422 }
            );
        }

        await logAiUsage(supabase, restaurantId, "ai_social");

        return NextResponse.json({
            posts: parsed.posts ?? [],
            total: (parsed.posts ?? []).length,
        });
    } catch (error) {
        console.error("[social/generate-content] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
