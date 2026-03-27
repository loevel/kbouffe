/**
 * POST /api/ai/enhance-photo
 * Uses Gemini to generate an enhanced/stylized food image description,
 * or generates a food image from text using Gemini Imagen.
 *
 * Mode 1: "describe" — Takes a product name and generates a prompt for image generation
 * Mode 2: "generate" — Generates an image from a text description using Gemini Imagen
 *
 * Body: { mode: "describe" | "generate", productName: string, style?: string }
 * Returns: { imageUrl: string } or { prompt: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai-rate-limiter";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const IMAGEN_MODEL = "imagen-4.0-fast-generate-001";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${GEMINI_API_KEY}`;

const STYLES: Record<string, string> = {
    rustic: "on a rustic wooden table, warm lighting, cozy restaurant ambiance",
    modern: "on a clean white plate, minimalist presentation, professional food photography",
    vibrant: "colorful, vibrant presentation, fresh ingredients visible, bright natural lighting",
    street: "street food style, authentic preparation, bustling market atmosphere",
};

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "Gemini API key non configurée" },
            { status: 500 },
        );
    }

    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const rateCheck = await checkAiRateLimit(supabase, restaurantId, "ai_photo");
    if (!rateCheck.allowed) {
        return NextResponse.json({
            error: `Limite quotidienne atteinte (${rateCheck.limit}/jour). Reessayez demain.`,
            usage: rateCheck,
        }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { mode = "generate", productName, style = "rustic" } = body;

        if (!productName?.trim()) {
            return NextResponse.json({ error: "Nom du produit requis" }, { status: 400 });
        }

        if (mode === "describe") {
            // Generate a detailed food photography prompt
            const res = await fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Generate a detailed food photography prompt for "${productName}" (African/Cameroonian dish). Style: ${STYLES[style] ?? STYLES.rustic}. The prompt should describe the dish, plating, lighting, and camera angle. Return ONLY the prompt text, nothing else. Max 100 words.`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 200,
                    },
                }),
            });

            if (!res.ok) {
                return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
            }

            const data = await res.json();
            const prompt = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

            await logAiUsage(supabase, restaurantId, "ai_photo");
            return NextResponse.json({ prompt: prompt.trim() });
        }

        if (mode === "generate") {
            // Generate image using Imagen 3
            const styleDesc = STYLES[style] ?? STYLES.rustic;
            const imagePrompt = `Professional food photography of ${productName}, a delicious African/Cameroonian dish. ${styleDesc}. Appetizing, high quality, restaurant menu photo, 4K, shallow depth of field.`;

            const res = await fetch(IMAGEN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instances: [{ prompt: imagePrompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1",
                        safetyFilterLevel: "block_few",
                    },
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error("[ai/enhance-photo] Imagen error:", res.status, errText);

                // Fallback: return the prompt so user can use it elsewhere
                return NextResponse.json({
                    error: "Génération d'image indisponible. Utilisez le prompt ci-dessous avec un autre outil.",
                    prompt: imagePrompt,
                    fallback: true,
                });
            }

            const data = await res.json();
            const imageBytes = data?.predictions?.[0]?.bytesBase64Encoded;

            if (!imageBytes) {
                return NextResponse.json({
                    error: "Aucune image générée",
                    prompt: imagePrompt,
                    fallback: true,
                });
            }

            await logAiUsage(supabase, restaurantId, "ai_photo");

            // Return base64 image
            return NextResponse.json({
                imageUrl: `data:image/png;base64,${imageBytes}`,
                prompt: imagePrompt,
            });
        }

        return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
    } catch (error) {
        console.error("[ai/enhance-photo] Unexpected error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
