import { Hono } from "hono";
import { requireDomain } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";
import { escapeIlike } from "../../lib/search";

export const adminCopilotRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const SYSTEM_PROMPT = `Tu es un assistant IA intégré au panel d'administration de KBouffe, une plateforme food-tech au Cameroun.
Tu reçois une question ou commande en français d'un administrateur et tu dois retourner UNIQUEMENT un objet JSON valide (sans texte avant ou après).

Actions disponibles :
- list_restaurants : Lister des restaurants. Params: { q?: string, status?: "active"|"inactive", verified?: "true"|"false", kyc?: "pending"|"approved"|"rejected", limit?: number }
- list_users       : Lister des utilisateurs. Params: { q?: string, role?: "client"|"merchant"|"admin"|"livreur", limit?: number }
- list_orders      : Lister des commandes. Params: { status?: string, limit?: number }
- list_tickets     : Lister des tickets support. Params: { status?: "open"|"in_progress"|"resolved"|"closed", priority?: "low"|"medium"|"high"|"urgent", limit?: number }
- list_payouts     : Lister des virements. Params: { status?: "pending"|"processing"|"completed"|"failed", limit?: number }
- list_reviews     : Lister des avis clients. Params: { visible?: "false", limit?: number }
- list_onboarding  : Restaurants en cours d'onboarding (non publiés). Params: { limit?: number }
- get_stats        : Statistiques globales de la plateforme. Params: {}
- navigate         : Rediriger vers une page du panel. Params: { path: string }
- unknown          : Requête non reconnue ou hors périmètre.

Format de réponse JSON attendu :
{
  "intent": "nom_action",
  "params": { ... },
  "summary": "Phrase courte décrivant ce que tu vas faire"
}`;

adminCopilotRoutes.post("/", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const body = await parseBody<{ query: string }>(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const query = body?.query?.trim();
    if (!query) return c.json({ error: "Question requise" }, 400);

    if (!c.env.AI) {
        return c.json({ error: "Workers AI non configuré sur ce Worker" }, 503);
    }

    // ── Step 1: Parse intent via Workers AI ──────────────────────────
    let intent = "unknown";
    let params: Record<string, any> = {};
    let summary = "Recherche en cours…";

    try {
        const aiResp = await (c.env.AI as any).run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: query },
            ],
            max_tokens: 300,
        });

        const raw: string = aiResp?.response ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            intent = parsed.intent ?? "unknown";
            params = parsed.params ?? {};
            summary = parsed.summary ?? "";
        }
    } catch {
        return c.json({ error: "Erreur lors de l'analyse de la requête" }, 500);
    }

    // ── Step 2: Execute intent against Supabase ───────────────────────
    const supabase = c.var.supabase;

    let data: any[] = [];
    let count: number | null = null;
    let navigateTo: string | null = null;
    const limit = Math.min(Number(params.limit) || 20, 50);

    try {
        switch (intent) {
            case "list_restaurants": {
                let q = supabase
                    .from("restaurants")
                    .select("id,name,slug,city,is_published,is_verified,kyc_status,rating,order_count,created_at", { count: "exact" });
                if (params.status === "active")   q = q.eq("is_published", true);
                if (params.status === "inactive") q = q.eq("is_published", false);
                if (params.verified === "true")   q = q.eq("is_verified", true);
                if (params.verified === "false")  q = q.eq("is_verified", false);
                if (params.kyc)                   q = q.eq("kyc_status", params.kyc);
                if (params.q) { const qs = escapeIlike(String(params.q).slice(0, 100)); q = q.or(`name.ilike.%${qs}%,city.ilike.%${qs}%`); }
                q = q.order("created_at", { ascending: false }).limit(limit);
                const r = await q;
                data = r.data ?? [];
                count = r.count;
                navigateTo = "/admin/restaurants";
                break;
            }

            case "list_users": {
                let q = supabase
                    .from("users")
                    .select("id,full_name,email,phone,role,created_at", { count: "exact" });
                if (params.role) q = q.eq("role", params.role);
                if (params.q) { const qs = escapeIlike(String(params.q).slice(0, 100)); q = q.or(`full_name.ilike.%${qs}%,email.ilike.%${qs}%`); }
                q = q.order("created_at", { ascending: false }).limit(limit);
                const r = await q;
                data = r.data ?? [];
                count = r.count;
                navigateTo = "/admin/users";
                break;
            }

            case "list_orders": {
                let q = supabase
                    .from("orders")
                    .select("id,status,delivery_type,created_at,restaurant_id", { count: "exact" });
                if (params.status) q = q.eq("status", params.status);
                q = q.order("created_at", { ascending: false }).limit(limit);
                const r = await q;
                data = r.data ?? [];
                count = r.count;
                navigateTo = "/admin/orders";
                break;
            }

            case "list_tickets": {
                let q = supabase
                    .from("support_tickets")
                    .select("id,subject,status,priority,created_at", { count: "exact" });
                if (params.status)   q = q.eq("status", params.status);
                if (params.priority) q = q.eq("priority", params.priority);
                q = q.order("created_at", { ascending: false }).limit(limit);
                const r = await q;
                data = r.data ?? [];
                count = r.count;
                navigateTo = "/admin/support";
                break;
            }

            case "list_payouts": {
                let q = supabase
                    .from("payouts")
                    .select("id,restaurant_id,amount,status,created_at", { count: "exact" });
                if (params.status) q = q.eq("status", params.status);
                q = q.order("created_at", { ascending: false }).limit(limit);
                const r = await q;
                data = r.data ?? [];
                count = r.count;
                navigateTo = "/admin/billing/payouts";
                break;
            }

            case "list_reviews": {
                let q = supabase
                    .from("reviews")
                    .select("id,restaurant_id,rating,comment,is_visible,created_at", { count: "exact" });
                if (params.visible === "false") q = q.eq("is_visible", false);
                q = q.order("created_at", { ascending: false }).limit(limit);
                const r = await q;
                data = r.data ?? [];
                count = r.count;
                navigateTo = "/admin/moderation";
                break;
            }

            case "list_onboarding": {
                const r = await supabase
                    .from("restaurants")
                    .select("id,name,slug,city,is_published,logo_url,cuisine_type,created_at", { count: "exact" })
                    .eq("is_published", false)
                    .order("created_at", { ascending: false })
                    .limit(limit);
                data = r.data ?? [];
                count = r.count;
                navigateTo = "/admin/onboarding";
                break;
            }

            case "get_stats": {
                const [r, u, o, p] = await Promise.all([
                    supabase.from("restaurants").select("id", { count: "exact", head: true }),
                    supabase.from("users").select("id", { count: "exact", head: true }),
                    supabase.from("orders").select("id", { count: "exact", head: true }),
                    supabase.from("payouts").select("amount").eq("status", "completed"),
                ]);
                const totalRevenue = (p.data ?? []).reduce((s: number, row: any) => s + (row.amount ?? 0), 0);
                data = [{
                    totalRestaurants: r.count ?? 0,
                    totalUsers: u.count ?? 0,
                    totalOrders: o.count ?? 0,
                    totalRevenue,
                }];
                navigateTo = "/admin";
                break;
            }

            case "navigate": {
                navigateTo = params.path ?? null;
                data = [];
                break;
            }

            default:
                data = [];
        }
    } catch (err: any) {
        return c.json({ error: err.message ?? "Erreur d'exécution" }, 500);
    }

    return c.json({ intent, summary, data, count, navigateTo });
});
