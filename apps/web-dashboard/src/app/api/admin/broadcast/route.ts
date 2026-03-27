/**
 * POST /api/admin/broadcast — envoie un push FCM à une cible de restaurants
 * GET  /api/admin/broadcast — retourne l'historique des broadcasts
 *
 * Cibles : all | pack (by service_id) | city (by address keyword) | active (published=true)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";
import { sendFcmBatch } from "@/lib/firebase/admin";

function serviceDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

// ── POST — envoyer un broadcast ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { userId } = auth.ctx;

    const db = serviceDb() as any;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Body JSON invalide", 400);
    }

    const { title, bodyText, template, targetType, targetValue, link } = body;

    if (!title?.trim() || !bodyText?.trim()) {
        return apiError("Titre et message requis", 400);
    }
    const validTargets = ["all", "pack", "city", "active"];
    if (!validTargets.includes(targetType)) {
        return apiError("Cible invalide", 400);
    }
    if ((targetType === "pack" || targetType === "city") && !targetValue?.trim()) {
        return apiError("Valeur de ciblage requise", 400);
    }

    // ── Résolution des destinataires ──────────────────────────────────────────
    let ownerIds: string[] = [];

    if (targetType === "all") {
        // Tous les marchands avec un restaurant
        const { data: rests } = await db
            .from("restaurants")
            .select("owner_id")
            .not("owner_id", "is", null);
        ownerIds = [...new Set((rests ?? []).map((r: any) => r.owner_id as string).filter(Boolean))];

    } else if (targetType === "active") {
        // Restaurants publiés uniquement
        const { data: rests } = await db
            .from("restaurants")
            .select("owner_id")
            .eq("is_published", true)
            .not("owner_id", "is", null);
        ownerIds = [...new Set((rests ?? []).map((r: any) => r.owner_id as string).filter(Boolean))];

    } else if (targetType === "pack") {
        // Restaurants avec un abonnement actif à ce service (service_id = targetValue)
        const now = new Date().toISOString();
        const { data: purchases } = await db
            .from("marketplace_purchases")
            .select("restaurant_id")
            .eq("service_id", targetValue)
            .eq("status", "active")
            .or(`expires_at.is.null,expires_at.gt.${now}`);

        const restaurantIds = [...new Set((purchases ?? []).map((p: any) => p.restaurant_id as string))];
        if (restaurantIds.length > 0) {
            const { data: rests } = await db
                .from("restaurants")
                .select("owner_id")
                .in("id", restaurantIds)
                .not("owner_id", "is", null);
            ownerIds = [...new Set((rests ?? []).map((r: any) => r.owner_id as string).filter(Boolean))];
        }

    } else if (targetType === "city") {
        // Restaurants dont l'adresse contient la ville ciblée (insensible à la casse)
        const { data: rests } = await db
            .from("restaurants")
            .select("owner_id")
            .ilike("address", `%${targetValue.trim()}%`)
            .not("owner_id", "is", null);
        ownerIds = [...new Set((rests ?? []).map((r: any) => r.owner_id as string).filter(Boolean))];
    }

    if (ownerIds.length === 0) {
        return NextResponse.json({ success: true, tokensSent: 0, message: "Aucun destinataire trouvé pour cette cible." });
    }

    // ── Récupération des push tokens ──────────────────────────────────────────
    const { data: tokenRows } = await db
        .from("push_tokens")
        .select("token")
        .in("user_id", ownerIds);

    const tokens = (tokenRows ?? []).map((r: any) => r.token as string).filter(Boolean);

    let tokensSent = 0;

    if (tokens.length > 0) {
        try {
            await sendFcmBatch(
                tokens,
                title.trim(),
                bodyText.trim(),
                { type: "broadcast", template: template ?? "custom" },
                link ?? "/dashboard"
            );
            tokensSent = tokens.length;

            // Marquer comme utilisés
            await db
                .from("push_tokens")
                .update({ last_used_at: new Date().toISOString() })
                .in("token", tokens);
        } catch (err: any) {
            console.error("[broadcast] FCM error:", err?.message);
            // On continue pour logger même si FCM échoue
        }
    }

    // ── Log dans admin_broadcasts ─────────────────────────────────────────────
    await db.from("admin_broadcasts").insert({
        sent_by: userId,
        title: title.trim(),
        body: bodyText.trim(),
        template: template ?? "custom",
        target_type: targetType,
        target_value: targetValue ?? null,
        tokens_sent: tokensSent,
    });

    return NextResponse.json({
        success: true,
        tokensSent,
        recipientsCount: ownerIds.length,
        message: tokens.length === 0
            ? `${ownerIds.length} restaurant(s) ciblé(s) mais aucun token push enregistré.`
            : `Push envoyé à ${tokensSent} appareil(s) — ${ownerIds.length} restaurant(s) ciblé(s).`,
    });
}

// ── GET — historique des broadcasts ──────────────────────────────────────────
export async function GET() {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const db = serviceDb() as any;

    const { data, error } = await db
        .from("admin_broadcasts")
        .select("id, title, body, template, target_type, target_value, tokens_sent, sent_at, sent_by")
        .order("sent_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("[GET /api/admin/broadcast]", error);
        return apiError("Erreur lors du chargement de l'historique");
    }

    // Fetch marketplace services for pack targeting display
    const { data: services } = await db
        .from("marketplace_services")
        .select("id, name, category")
        .eq("is_active", true);

    const serviceMap: Record<string, string> = {};
    for (const s of services ?? []) {
        serviceMap[s.id] = s.name;
    }

    const history = (data ?? []).map((b: any) => ({
        id: b.id,
        title: b.title,
        body: b.body,
        template: b.template,
        targetType: b.target_type,
        targetValue: b.target_value,
        targetLabel: b.target_type === "pack" && b.target_value
            ? (serviceMap[b.target_value] ?? b.target_value)
            : null,
        tokensSent: b.tokens_sent,
        sentAt: b.sent_at,
    }));

    // Also fetch available packs for the composer
    const packsForComposer = (services ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
    }));

    return NextResponse.json({ history, packs: packsForComposer });
}
