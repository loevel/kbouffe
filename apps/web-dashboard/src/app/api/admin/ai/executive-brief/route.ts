/**
 * POST /api/admin/ai/executive-brief
 * Generates a platform executive brief using live stats + Gemini.
 * Returns: { summary, highlights, risks, actions, generatedAt }
 */
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

export async function POST() {
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "Gemini non configuré" }, { status: 500 });

    const { ctx, error } = await withAdmin();
    if (error) return error;

    const db = ctx.supabase as any;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Gather platform stats in parallel
    const [
        { count: totalRestaurants },
        { count: activeRestaurants },
        { count: pendingRestaurants },
        { count: totalUsers },
        { count: totalOrders30d },
        { count: totalOrders7d },
        { data: revenueData },
        { count: openTickets },
        { count: aiCallsToday },
        { count: aiCallsMonth },
        { count: newRestaurants7d },
    ] = await Promise.all([
        db.from("restaurants").select("id", { count: "exact", head: true }),
        db.from("restaurants").select("id", { count: "exact", head: true }).eq("is_active", true),
        db.from("restaurants").select("id", { count: "exact", head: true }).eq("is_active", false).gte("created_at", thirtyDaysAgo),
        db.from("users").select("id", { count: "exact", head: true }),
        db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        db.from("orders").select("total_amount").in("status", ["delivered", "completed"]).gte("created_at", thirtyDaysAgo),
        db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
        db.from("ai_usage_logs").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        db.from("ai_usage_logs").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        db.from("restaurants").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    ]);

    const gmv30d = (revenueData ?? []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);

    const statsContext = `
STATISTIQUES PLATEFORME KBOUFFE — ${now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

Restaurants:
- Total: ${totalRestaurants ?? 0} restaurants inscrits
- Actifs: ${activeRestaurants ?? 0} boutiques publiées
- En attente d'activation: ${pendingRestaurants ?? 0}
- Nouveaux cette semaine: ${newRestaurants7d ?? 0}

Utilisateurs:
- Total: ${totalUsers ?? 0} comptes

Commandes (30 derniers jours):
- Volume: ${totalOrders30d ?? 0} commandes
- Cette semaine: ${totalOrders7d ?? 0} commandes
- GMV (CA): ${gmv30d.toLocaleString("fr-FR")} FCFA

Support:
- Tickets ouverts: ${openTickets ?? 0}

Usage IA (Gemini):
- Appels aujourd'hui: ${aiCallsToday ?? 0}
- Appels ce mois: ${aiCallsMonth ?? 0}
`.trim();

    const prompt = `Tu es le directeur général de KBouffe, une plateforme de commande de repas en Afrique.
Analyse ces données de plateforme et génère un executive brief concis et stratégique.

${statsContext}

Génère un brief exécutif structuré avec:
1. summary: résumé exécutif en 2-3 phrases (situation globale)
2. highlights: 3 points positifs notables (données chiffrées)
3. risks: 2-3 risques ou points d'attention identifiés
4. actions: 3 actions prioritaires recommandées cette semaine

Sois direct, factuel, basé sur les chiffres. Contexte africain/camerounais.

Réponds UNIQUEMENT avec ce JSON:
{
  "summary": "...",
  "highlights": ["...", "...", "..."],
  "risks": ["...", "..."],
  "actions": [
    { "priority": "high", "action": "...", "reason": "..." },
    { "priority": "medium", "action": "...", "reason": "..." },
    { "priority": "low", "action": "...", "reason": "..." }
  ]
}`;

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 800, responseMimeType: "application/json" },
            }),
        });

        if (!res.ok) return NextResponse.json({ error: "Erreur Gemini" }, { status: 502 });

        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        await ctx.supabase.from("ai_usage_logs").insert({
            restaurant_id: null,
            feature: "admin_executive_brief",
            tokens_used: 0,
        });

        return NextResponse.json({
            summary: parsed.summary ?? "",
            highlights: parsed.highlights ?? [],
            risks: parsed.risks ?? [],
            actions: parsed.actions ?? [],
            generatedAt: now.toISOString(),
            stats: { totalRestaurants, activeRestaurants, totalOrders30d, gmv30d, openTickets, aiCallsToday },
        });
    } catch {
        return NextResponse.json({ error: "Impossible de générer le brief" }, { status: 422 });
    }
}
