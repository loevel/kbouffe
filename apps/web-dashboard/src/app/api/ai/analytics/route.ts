/**
 * POST /api/ai/analytics
 * AI-powered business advisor. Analyzes restaurant data and gives actionable insights.
 * Body: { question?: string }
 * Returns: { insights: { title, description, action, priority }[], summary: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API key non configuree" }, { status: 500 });
    }

    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    try {
        const body = await request.json().catch(() => ({}));
        const userQuestion = body.question?.trim() ?? "";

        // Gather restaurant data for context
        const [
            { data: restaurant },
            { data: products },
            { data: orders },
            { data: categories },
            { data: orderItems },
        ] = await Promise.all([
            supabase
                .from("restaurants")
                .select("name, description, is_published, primary_color, delivery_fee, minimum_order, created_at")
                .eq("id", restaurantId)
                .single(),
            supabase
                .from("products")
                .select("id, name, price, compare_at_price, is_available, is_limited_edition, category_id, created_at")
                .eq("restaurant_id", restaurantId)
                .order("price", { ascending: false }),
            supabase
                .from("orders")
                .select("id, total_amount, status, delivery_method, created_at")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false })
                .limit(200),
            supabase
                .from("categories")
                .select("id, name, is_active")
                .eq("restaurant_id", restaurantId),
            // Best-sellers: order items with product names
            supabase
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
        const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
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
            .reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const prevWeekRevenue = prevWeekOrders
            .filter((o: any) => o.status === "delivered" || o.status === "completed")
            .reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
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
- Commande minimum: ${restaurant?.minimum_order ?? "N/A"} FCFA
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
            return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        let parsed;
        try {
            const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error("[ai/analytics] Parse error:", rawText);
            return NextResponse.json({ error: "Impossible de generer l'analyse" }, { status: 422 });
        }

        return NextResponse.json({
            summary: parsed.summary ?? "",
            insights: parsed.insights ?? [],
            stats: {
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
            },
        });
    } catch (error) {
        console.error("[ai/analytics] Unexpected:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
