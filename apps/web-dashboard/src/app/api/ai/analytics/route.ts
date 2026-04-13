/**
 * POST /api/ai/analytics
 * AI-powered business advisor. Analyzes restaurant data and gives actionable insights.
 * Body: { question?: string }
 * Returns: { insights: { title, description, action, priority }[], summary: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai-rate-limiter";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

type AdvisorPriority = "high" | "medium" | "low";
type AdvisorCategory = "revenue" | "menu" | "marketing" | "operations" | "pricing";

interface AdvisorInsight {
    title: string;
    description: string;
    action: string;
    priority: AdvisorPriority;
    category: AdvisorCategory;
}

type AdvisorStatsPayload = {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    cancelRate: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgPrice: number;
    recentOrders: number;
    thisWeekRevenue: number;
    prevWeekRevenue: number;
    revenueGrowth: number;
    peakHour: string | null;
    bestSellers: Array<{ name: string; qty: number; revenue: number }>;
    productsWithoutImages: number;
    ordersByDay: Record<string, number>;
};

function buildFallbackInsights(args: {
    stats: AdvisorStatsPayload;
    promoProductsCount: number;
    bestSellerName: string | null;
}): { summary: string; insights: AdvisorInsight[] } {
    const { stats, promoProductsCount, bestSellerName } = args;
    const insights: AdvisorInsight[] = [];

    if (stats.totalOrders < 20) {
        insights.push({
            title: "Acquisition client a renforcer",
            description: "Le volume de commandes est encore faible. Il faut concentrer les efforts sur la visibilite locale et les offres d'appel.",
            action: "Lancer une offre premiere commande et 2 campagnes WhatsApp/SMS geo-ciblees cette semaine.",
            priority: "high",
            category: "marketing",
        });
    }

    if (stats.cancelRate >= 12) {
        insights.push({
            title: "Taux d'annulation eleve",
            description: `Votre taux d'annulation (${stats.cancelRate}%) reduit directement la satisfaction client et le chiffre d'affaires.`,
            action: "Verifier les delais de preparation, confirmer les ruptures en amont et activer un script de confirmation des commandes sensibles.",
            priority: "high",
            category: "operations",
        });
    }

    if (stats.avgOrderValue > 0 && stats.avgOrderValue < 5000) {
        insights.push({
            title: "Panier moyen ameliorable",
            description: `Le panier moyen (${stats.avgOrderValue} FCFA) peut etre augmente avec des combinaisons plat + boisson + dessert.`,
            action: "Creer 2 menus combo avec remise legere (5-8%) et proposer l'upsell au checkout.",
            priority: "medium",
            category: "pricing",
        });
    }

    if (stats.productsWithoutImages > 0) {
        insights.push({
            title: "Produits sans photo",
            description: `${stats.productsWithoutImages} produit(s) n'ont pas d'image, ce qui penalise le taux de conversion.`,
            action: "Ajouter des photos sur les top ventes en priorite pour augmenter les clics et commandes.",
            priority: "medium",
            category: "menu",
        });
    }

    if (promoProductsCount === 0 && stats.activeProducts >= 8) {
        insights.push({
            title: "Aucune promotion active",
            description: "Sans offre visible, il est plus difficile de declencher des commandes impulsives.",
            action: "Mettre 2 produits en promotion courte (48h) avec badge visible sur le menu.",
            priority: "medium",
            category: "revenue",
        });
    }

    if (bestSellerName) {
        insights.push({
            title: "Capitaliser sur vos meilleures ventes",
            description: `${bestSellerName} performe deja bien. Vous pouvez augmenter sa marge et son volume via des variantes premium.`,
            action: `Creer une variante premium de ${bestSellerName} et la placer en tete de categorie.`,
            priority: "low",
            category: "menu",
        });
    }

    if (stats.revenueGrowth < 0) {
        insights.push({
            title: "Croissance hebdomadaire negative",
            description: `Le CA semaine sur semaine est en baisse (${stats.revenueGrowth}%). Une action rapide est recommandee.`,
            action: "Planifier une campagne weekend + relance clients inactifs avec code promo limite.",
            priority: "high",
            category: "revenue",
        });
    }

    const prioritized = insights
        .sort((a, b) => {
            const rank = { high: 0, medium: 1, low: 2 } as const;
            return rank[a.priority] - rank[b.priority];
        })
        .slice(0, 6);

    if (prioritized.length === 0) {
        prioritized.push({
            title: "Performance stable a optimiser",
            description: "Les indicateurs sont globalement stables. Vous pouvez maintenant optimiser l'execution commerciale pour accelerer la croissance.",
            action: "Tester une offre hebdomadaire marquee et suivre l'evolution du panier moyen sur 14 jours.",
            priority: "medium",
            category: "revenue",
        });
    }

    const summary =
        stats.totalOrders === 0
            ? "Pas assez de commandes pour une analyse predictive complete. Voici des recommandations prioritaires basees sur votre catalogue actuel."
            : `Analyse automatique basee sur ${stats.totalOrders} commandes recentes. Priorite: stabiliser les operations puis accelerer la croissance du chiffre d'affaires.`;

    return { summary, insights: prioritized };
}

export async function POST(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const rateCheck = await checkAiRateLimit(supabase, restaurantId, "ai_analytics");
    if (!rateCheck.allowed) {
        return NextResponse.json({
            error: `Limite quotidienne atteinte (${rateCheck.limit}/jour). Reessayez demain.`,
            usage: rateCheck,
        }, { status: 429 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const userQuestion = body.question?.trim() ?? "";

        // Gather restaurant data for context
        const db = supabase as any;
        const [
            { data: restaurant },
            { data: products },
            { data: orders },
            { data: categories },
            { data: orderItems },
        ] = await Promise.all([
            db
                .from("restaurants")
                .select("name, description, is_published, primary_color, delivery_fee, min_order_amount, created_at")
                .eq("id", restaurantId)
                .single(),
            db
                .from("products")
                .select("id, name, price, compare_at_price, is_available, is_limited_edition, category_id, image_url, created_at")
                .eq("restaurant_id", restaurantId)
                .order("price", { ascending: false }),
            db
                .from("orders")
                .select("id, total, status, delivery_method, created_at")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false })
                .limit(200),
            db
                .from("categories")
                .select("id, name, is_active")
                .eq("restaurant_id", restaurantId),
            db
                .from("order_items")
                .select("product_id, quantity, unit_price, product_name")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false })
                .limit(500),
        ]);

        // Compute basic stats
        const totalProducts = products?.length ?? 0;
        const activeProducts = products?.filter((p: any) => p.is_available)?.length ?? 0;
        const totalOrders = orders?.length ?? 0;
        const avgPrice = totalProducts > 0
            ? Math.round((products?.reduce((sum: number, p: any) => sum + (p.price || 0), 0) ?? 0) / totalProducts)
            : 0;

        const completedOrders = orders?.filter((o: any) => o.status === "delivered" || o.status === "completed") ?? [];
        const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentOrders = orders?.filter((o: any) => new Date(o.created_at) >= oneWeekAgo) ?? [];
        const prevWeekOrders = orders?.filter((o: any) => {
            const d = new Date(o.created_at);
            return d >= twoWeeksAgo && d < oneWeekAgo;
        }) ?? [];
        const monthOrders = orders?.filter((o: any) => new Date(o.created_at) >= oneMonthAgo) ?? [];

        // Revenue trends
        const thisWeekRevenue = recentOrders
            .filter((o: any) => o.status === "delivered" || o.status === "completed")
            .reduce((s: number, o: any) => s + (o.total || 0), 0);
        const prevWeekRevenue = prevWeekOrders
            .filter((o: any) => o.status === "delivered" || o.status === "completed")
            .reduce((s: number, o: any) => s + (o.total || 0), 0);
        const revenueGrowth = prevWeekRevenue > 0
            ? Math.round(((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
            : 0;

        // Orders by day of week
        const ordersByDay: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 };
        const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        for (const o of monthOrders) {
            const day = dayNames[new Date(o.created_at).getDay()];
            ordersByDay[day] = (ordersByDay[day] || 0) + 1;
        }

        // Orders by hour
        const ordersByHour: Record<number, number> = {};
        for (const o of monthOrders) {
            const hour = new Date(o.created_at).getHours();
            ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
        }
        const peakHour = Object.entries(ordersByHour).sort(([, a], [, b]) => b - a)[0];

        // Delivery method breakdown
        const deliveryBreakdown: Record<string, number> = {};
        for (const o of orders ?? []) {
            const m = (o as any).delivery_method || "unknown";
            deliveryBreakdown[m] = (deliveryBreakdown[m] || 0) + 1;
        }

        // Best-selling products
        const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
        for (const item of orderItems ?? []) {
            const id = (item as any).product_id || "unknown";
            if (!productSales[id]) {
                productSales[id] = { name: (item as any).product_name || "Produit inconnu", qty: 0, revenue: 0 };
            }
            productSales[id].qty += (item as any).quantity || 1;
            productSales[id].revenue += ((item as any).unit_price || 0) * ((item as any).quantity || 1);
        }
        const bestSellers = Object.values(productSales)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        // Products without images
        const productsWithoutImages = products?.filter((p: any) => !p.image_url)?.length ?? 0;

        const promoProducts = products?.filter((p: any) => p.compare_at_price && p.compare_at_price > p.price) ?? [];
        const limitedProducts = products?.filter((p: any) => p.is_limited_edition) ?? [];

        // Cancellation / failure rate
        const cancelledOrders = orders?.filter((o: any) => o.status === "cancelled")?.length ?? 0;
        const cancelRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

        const statsPayload: AdvisorStatsPayload = {
            totalProducts,
            activeProducts,
            totalOrders,
            completedOrders: completedOrders.length,
            cancelledOrders,
            cancelRate,
            totalRevenue,
            avgOrderValue,
            avgPrice,
            recentOrders: recentOrders.length,
            thisWeekRevenue,
            prevWeekRevenue,
            revenueGrowth,
            peakHour: peakHour ? `${peakHour[0]}h` : null,
            bestSellers,
            productsWithoutImages,
            ordersByDay,
        };

        const fallbackPayload = buildFallbackInsights({
            stats: statsPayload,
            promoProductsCount: promoProducts.length,
            bestSellerName: bestSellers[0]?.name ?? null,
        });

        if (!GEMINI_API_KEY) {
            return NextResponse.json({
                summary: fallbackPayload.summary,
                insights: fallbackPayload.insights,
                stats: statsPayload,
                fallback: true,
                fallbackReason: "Gemini API key non configuree",
            });
        }

        // Build context for Gemini
        const dataContext = `
DONNEES DU RESTAURANT "${restaurant?.name ?? "Restaurant"}":

Menu:
- ${totalProducts} produits au total (${activeProducts} actifs)
- Prix moyen: ${avgPrice} FCFA
- Produit le plus cher: ${products?.[0]?.name ?? "N/A"} (${products?.[0]?.price ?? 0} FCFA)
- Produit le moins cher: ${products?.[products.length - 1]?.name ?? "N/A"} (${products?.[products.length - 1]?.price ?? 0} FCFA)
- ${promoProducts.length} produit(s) en promotion
- ${limitedProducts.length} produit(s) en edition limitee
- ${productsWithoutImages} produit(s) sans photo
- ${categories?.length ?? 0} categories

Best-sellers (par quantite vendue):
${bestSellers.map((b, i) => `${i + 1}. ${b.name} — ${b.qty} vendus, ${b.revenue} FCFA de CA`).join("\n") || "Pas assez de donnees"}

Commandes (dernieres 200):
- ${totalOrders} commandes totales
- ${completedOrders.length} completees, ${cancelledOrders} annulees (taux annulation: ${cancelRate}%)
- Chiffre d'affaires total: ${totalRevenue} FCFA
- Panier moyen: ${avgOrderValue} FCFA
- Cette semaine: ${recentOrders.length} commandes, ${thisWeekRevenue} FCFA
- Semaine precedente: ${prevWeekOrders.length} commandes, ${prevWeekRevenue} FCFA
- Croissance semaine/semaine: ${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}%
- Commandes par jour (30j): ${JSON.stringify(ordersByDay)}
- Heure de pointe: ${peakHour ? `${peakHour[0]}h (${peakHour[1]} commandes)` : "N/A"}
- Methodes: ${JSON.stringify(deliveryBreakdown)}

Configuration:
- Frais de livraison: ${restaurant?.delivery_fee ?? "N/A"} FCFA
- Commande minimum: ${restaurant?.min_order_amount ?? "N/A"} FCFA
- Boutique publiee: ${restaurant?.is_published ? "Oui" : "Non"}
- Inscrit depuis: ${restaurant?.created_at ? new Date(restaurant.created_at).toLocaleDateString("fr-FR") : "N/A"}
`;

        const systemPrompt = `Tu es un conseiller business expert pour les restaurateurs africains/camerounais.
Tu analyses les donnees du restaurant et donnes des conseils CONCRETS et ACTIONNABLES.

${dataContext}

${userQuestion ? `QUESTION DU RESTAURATEUR: "${userQuestion}"` : "Donne une analyse globale avec les insights les plus importants."}

Retourne un JSON VALIDE avec cette structure :
{
  "summary": "Resume en 1-2 phrases de la situation globale",
  "insights": [
    {
      "title": "Titre court de l'insight",
      "description": "Explication detaillee (2-3 phrases max)",
      "action": "Action concrete a prendre",
      "priority": "high" | "medium" | "low",
      "category": "revenue" | "menu" | "marketing" | "operations" | "pricing"
    }
  ]
}

Regles:
- 3 a 6 insights maximum
- Sois specifique au contexte camerounais (FCFA, habitudes locales)
- Priorite aux actions qui augmentent le chiffre d'affaires
- Si le restaurant a peu de commandes, concentre-toi sur l'acquisition
- Si le panier moyen est bas, propose des upsells/combos
- Utilise des chiffres concrets quand possible`;

        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("[ai/analytics] Gemini error:", res.status, errText);
            return NextResponse.json({
                summary: fallbackPayload.summary,
                insights: fallbackPayload.insights,
                stats: statsPayload,
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
            console.error("[ai/analytics] Parse error:", rawText);
            return NextResponse.json({
                summary: fallbackPayload.summary,
                insights: fallbackPayload.insights,
                stats: statsPayload,
                fallback: true,
                fallbackReason: "Reponse IA invalide",
            });
        }

        await logAiUsage(supabase, restaurantId, "ai_analytics");

        return NextResponse.json({
            summary: parsed.summary ?? "",
            insights: parsed.insights ?? [],
            stats: statsPayload,
        });
    } catch (error) {
        console.error("[ai/analytics] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
