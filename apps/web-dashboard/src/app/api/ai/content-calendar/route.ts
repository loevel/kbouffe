/**
 * POST /api/ai/content-calendar
 * Generates a week of social media content suggestions using Gemini.
 * Body: { weekStartDate?: string, focusProducts?: string[], platforms?: string[] }
 * Returns: { calendar: { day, platform, contentIdea, hashtags, bestTime }[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai-rate-limiter";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const VALID_PLATFORMS = ["facebook", "instagram", "tiktok", "telegram", "whatsapp"] as const;
const VALID_TYPES = ["product_highlight", "promo", "behind_scenes", "interactive", "storytelling", "motivation"] as const;
const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

type CalendarType = (typeof VALID_TYPES)[number];
type CalendarPlatform = (typeof VALID_PLATFORMS)[number];

interface CalendarEntry {
    day: string;
    date: string;
    platform: CalendarPlatform;
    type: CalendarType;
    contentIdea: string;
    caption: string;
    hashtags: string[];
    bestTime: string;
    productName?: string | null;
}

function normalizePlatforms(input: unknown): CalendarPlatform[] {
    if (!Array.isArray(input)) return ["facebook", "instagram", "tiktok"];
    const filtered = input
        .map((p) => String(p).toLowerCase().trim())
        .filter((p): p is CalendarPlatform => (VALID_PLATFORMS as readonly string[]).includes(p));
    return filtered.length > 0 ? filtered : ["facebook", "instagram", "tiktok"];
}

function parseWeekStart(input: unknown): string {
    const raw = typeof input === "string" ? input : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return new Date().toISOString().split("T")[0];
}

function sanitizeCalendarEntry(entry: any, index: number, weekStartDate: string, platforms: CalendarPlatform[]): CalendarEntry | null {
    const weekStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const candidateDate = typeof entry?.date === "string" ? entry.date : "";
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(candidateDate)
        ? candidateDate
        : new Date(weekStart.getTime() + (index % 7) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const dayFromDate = DAYS_FR[new Date(`${parsedDate}T00:00:00.000Z`).getUTCDay() === 0 ? 6 : new Date(`${parsedDate}T00:00:00.000Z`).getUTCDay() - 1];
    const day = typeof entry?.day === "string" && entry.day.trim() ? entry.day.trim() : dayFromDate;

    const platformRaw = String(entry?.platform ?? "").toLowerCase().trim();
    const platform = (VALID_PLATFORMS as readonly string[]).includes(platformRaw)
        ? (platformRaw as CalendarPlatform)
        : platforms[index % platforms.length];

    const typeRaw = String(entry?.type ?? "").toLowerCase().trim();
    const type = (VALID_TYPES as readonly string[]).includes(typeRaw)
        ? (typeRaw as CalendarType)
        : VALID_TYPES[index % VALID_TYPES.length];

    const contentIdea = String(entry?.contentIdea ?? "").trim();
    const caption = String(entry?.caption ?? "").trim();
    const hashtags = Array.isArray(entry?.hashtags)
        ? entry.hashtags.map((h: unknown) => String(h).trim()).filter(Boolean)
        : [];
    const bestTime = String(entry?.bestTime ?? "").trim() || "12:00";
    const productName = entry?.productName ? String(entry.productName) : null;

    if (!contentIdea && !caption) return null;

    return {
        day,
        date: parsedDate,
        platform,
        type,
        contentIdea: contentIdea || "Publication recommandee pour votre audience locale.",
        caption: caption || "Nouveau contenu recommande pour vos clients cette semaine.",
        hashtags,
        bestTime,
        productName,
    };
}

function buildFallbackCalendar(args: {
    weekStartDate: string;
    platforms: CalendarPlatform[];
    restaurantName: string;
    products: Array<{ name?: string | null; is_limited_edition?: boolean | null }>;
}): CalendarEntry[] {
    const { weekStartDate, platforms, restaurantName, products } = args;
    const weekStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const limited = products.find((p) => Boolean(p.is_limited_edition))?.name ?? null;
    const featured = products.find((p) => p.name)?.name ?? "plat signature";
    const ideas = [
        { type: "motivation", idea: "Message de debut de semaine et engagement local." },
        { type: "product_highlight", idea: `Mise en avant du produit ${featured}.` },
        { type: "promo", idea: "Promotion courte sur un menu populaire." },
        { type: "behind_scenes", idea: "Coulisses de la preparation en cuisine." },
        { type: "storytelling", idea: "Histoire du restaurant et de ses saveurs." },
        { type: "interactive", idea: "Sondage client sur le prochain plat a promouvoir." },
        { type: "product_highlight", idea: "Suggestion brunch / repas familial du dimanche." },
    ] as const;

    return DAYS_FR.map((day, i) => {
        const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const slot = ideas[i];
        const platform = platforms[i % platforms.length];
        const productMention = limited && i === 2 ? limited : featured;

        return {
            day,
            date,
            platform,
            type: slot.type,
            contentIdea: slot.idea,
            caption: `${day} chez ${restaurantName}: ${slot.idea} Venez decouvrir ${productMention} et profitez de nos offres de la semaine.`,
            hashtags: ["#Kbouffe", "#Restaurant", "#Cameroun", "#Food", "#BonPlan"],
            bestTime: i >= 5 ? "18:00" : "12:00",
            productName: productMention,
        };
    });
}

export async function POST(request: NextRequest) {
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
        const weekStartDate = parseWeekStart(body.weekStartDate);
        const platforms = normalizePlatforms(body.platforms);

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

        const fallbackCalendar = buildFallbackCalendar({
            weekStartDate,
            platforms,
            restaurantName: restaurant?.name ?? "Votre restaurant",
            products: products ?? [],
        });

        if (!GEMINI_API_KEY) {
            return NextResponse.json({
                calendar: fallbackCalendar,
                weekStartDate,
                total: fallbackCalendar.length,
                fallback: true,
                fallbackReason: "Gemini API key non configuree",
            });
        }

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
            return NextResponse.json({
                calendar: fallbackCalendar,
                weekStartDate,
                total: fallbackCalendar.length,
                fallback: true,
                fallbackReason: `Gemini indisponible (${res.status})`,
            });
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        let parsed;
        try {
            const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error("[ai/content-calendar] Parse error:", rawText);
            return NextResponse.json({
                calendar: fallbackCalendar,
                weekStartDate,
                total: fallbackCalendar.length,
                fallback: true,
                fallbackReason: "Reponse IA invalide",
            });
        }

        const normalizedCalendar = Array.isArray(parsed?.calendar)
            ? parsed.calendar
                .map((entry: unknown, idx: number) => sanitizeCalendarEntry(entry, idx, weekStartDate, platforms))
                .filter((entry: CalendarEntry | null): entry is CalendarEntry => Boolean(entry))
            : [];

        const finalCalendar = normalizedCalendar.length > 0 ? normalizedCalendar : fallbackCalendar;

        await logAiUsage(supabase, restaurantId, "ai_calendar");

        return NextResponse.json({
            calendar: finalCalendar,
            weekStartDate,
            total: finalCalendar.length,
        });
    } catch (error) {
        console.error("[ai/content-calendar] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
