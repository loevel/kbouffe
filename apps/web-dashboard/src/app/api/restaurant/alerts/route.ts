/**
 * GET /api/restaurant/alerts — bandeau d'alertes de l'accueil restaurateur
 *
 * Cette route n'existait pas : le composant OperationalAlerts l'appelait, ne
 * recevait qu'un 404, et se rendait donc invisible en permanence. Il visait
 * `technical_logs`, une table qu'aucun code du dépôt n'écrit — la brancher
 * dessus n'aurait fait que remplacer un panneau vide par un autre.
 *
 * Le bandeau sert donc ce qui bloque réellement un restaurateur : les
 * notifications non lues qui appellent une action de sa part (dossier KYC
 * rejeté, pièce complémentaire demandée, accès à un pack modifié). Le reste du
 * flux — résumés quotidiens, rappels, campagnes — reste dans la cloche, qui
 * l'affiche déjà.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/** Types de notification qui demandent une action, avec leur gravité. */
const TYPES_ACTIONNABLES: Record<string, "warn" | "error"> = {
    kyc_review: "warn",
    kyc_request_info: "warn",
    module_access: "warn",
};

export async function GET(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const limit = Math.min(
            Math.max(parseInt(request.nextUrl.searchParams.get("limit") ?? "5", 10) || 5, 1),
            20
        );

        const { data, error } = await ctx.supabase
            .from("restaurant_notifications")
            .select("id, type, title, body, payload, created_at")
            .eq("restaurant_id", ctx.restaurantId)
            .eq("is_read", false)
            .in("type", Object.keys(TYPES_ACTIONNABLES))
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Alerts query error:", error);
            return apiError("Erreur lors du chargement des alertes");
        }

        const alerts = (data ?? []).map((n: any) => ({
            id: n.id,
            level: TYPES_ACTIONNABLES[n.type] ?? "warn",
            message: n.body ? `${n.title} — ${n.body}` : n.title,
            created_at: n.created_at,
            metadata: { ...(n.payload ?? {}), type: n.type },
        }));

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("GET /api/restaurant/alerts error:", error);
        return apiError("Erreur serveur");
    }
}
