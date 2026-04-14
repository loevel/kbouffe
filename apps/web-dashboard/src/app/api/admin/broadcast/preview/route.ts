/**
 * POST /api/admin/broadcast/preview — preview du count de destinataires
 *
 * Permet de voir combien de restaurants/appareils seront ciblés avant l'envoi
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";

function serviceDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const db = serviceDb() as any;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Body JSON invalide", 400);
    }

    const { targetType, targetValue } = body;

    const validTargets = ["all", "pack", "city", "active"];
    if (!validTargets.includes(targetType)) {
        return apiError("Cible invalide", 400);
    }

    try {
        let targetedRestaurants: Array<{ id: string; owner_id: string }> = [];

        if (targetType === "all") {
            const { data: rests } = await db
                .from("restaurants")
                .select("id, owner_id", { count: "exact" })
                .not("owner_id", "is", null);
            targetedRestaurants = (rests ?? []).map((r: any) => ({ id: r.id, owner_id: r.owner_id }));

        } else if (targetType === "active") {
            const { data: rests } = await db
                .from("restaurants")
                .select("id, owner_id", { count: "exact" })
                .eq("is_published", true)
                .not("owner_id", "is", null);
            targetedRestaurants = (rests ?? []).map((r: any) => ({ id: r.id, owner_id: r.owner_id }));

        } else if (targetType === "pack" && targetValue) {
            const now = new Date().toISOString();
            const { data: purchases } = await db
                .from("marketplace_purchases")
                .select("restaurant_id")
                .eq("service_id", targetValue)
                .eq("status", "active")
                .or(`expires_at.is.null,expires_at.gt.${now}`);

            const packRestaurantIds: string[] = (purchases ?? [])
                .map((p: any) => p.restaurant_id as string)
                .filter(Boolean);
            const uniqueIds = [...new Set(packRestaurantIds)];

            if (uniqueIds.length > 0) {
                const { data: rests } = await db
                    .from("restaurants")
                    .select("id, owner_id")
                    .in("id", uniqueIds)
                    .not("owner_id", "is", null);
                targetedRestaurants = (rests ?? []).map((r: any) => ({ id: r.id, owner_id: r.owner_id }));
            }

        } else if (targetType === "city" && targetValue) {
            const { data: rests } = await db
                .from("restaurants")
                .select("id, owner_id", { count: "exact" })
                .ilike("address", `%${targetValue.trim()}%`)
                .not("owner_id", "is", null);
            targetedRestaurants = (rests ?? []).map((r: any) => ({ id: r.id, owner_id: r.owner_id }));
        }

        const uniqueOwnerIds = [...new Set(targetedRestaurants.map((r) => r.owner_id))];

        // Récupérer les tokens uniques
        const { data: tokenRows } = await db
            .from("push_tokens")
            .select("token")
            .in("user_id", uniqueOwnerIds);

        const tokensSet = new Set(
            (tokenRows ?? [])
                .map((r: any) => r.token as string)
                .filter((t: string) => Boolean(t))
        );

        return NextResponse.json({
            restaurantCount: targetedRestaurants.length,
            deviceCount: tokensSet.size,
        });
    } catch (err: any) {
        console.error("[broadcast preview] error:", err?.message);
        return apiError("Erreur lors du calcul du preview");
    }
}
