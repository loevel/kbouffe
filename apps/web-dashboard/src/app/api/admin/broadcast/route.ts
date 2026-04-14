/**
 * POST /api/admin/broadcast — envoie un push FCM à une cible de restaurants
 * GET  /api/admin/broadcast — retourne l'historique des broadcasts
 *
 * Cibles : all | pack (by service_id) | city (by address keyword) | active (published=true)
 *
 * Protections:
 * - Rate limiting: max 1 broadcast par heure par admin
 * - Chunking FCM: max 500 tokens par batch (FCM limit)
 * - Deduplication: tokens uniques uniquement
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";
import { sendFcmBatch } from "@/lib/firebase/admin";

// ── Utilitaires ─────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function checkRateLimit(db: any, userId: string): Promise<{ allowed: boolean; message?: string }> {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data, error } = await db
        .from("admin_broadcasts")
        .select("id", { count: "exact" })
        .eq("sent_by", userId)
        .gte("sent_at", oneHourAgo);

    if (error) {
        console.error("[broadcast rate limit check error]", error);
        // En cas d'erreur, on laisse passer (fail-open)
        return { allowed: true };
    }

    const count = data?.length ?? 0;
    if (count >= 5) {
        return {
            allowed: false,
            message: `Limite atteinte: 5 broadcasts par heure. Réessayez plus tard.`
        };
    }

    return { allowed: true };
}

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

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const rateLimitCheck = await checkRateLimit(db, userId);
    if (!rateLimitCheck.allowed) {
        return apiError(rateLimitCheck.message ?? "Rate limited", 429);
    }

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
    // On collecte { id, owner_id } pour chaque restaurant ciblé
    let targetedRestaurants: Array<{ id: string; owner_id: string }> = [];

    function toRestaurants(rows: any[]): Array<{ id: string; owner_id: string }> {
        return (rows ?? [])
            .filter((r: any) => r.id && r.owner_id)
            .map((r: any) => ({ id: r.id as string, owner_id: r.owner_id as string }));
    }

    if (targetType === "all") {
        const { data: rests } = await db
            .from("restaurants")
            .select("id, owner_id")
            .not("owner_id", "is", null);
        targetedRestaurants = toRestaurants(rests);

    } else if (targetType === "active") {
        const { data: rests } = await db
            .from("restaurants")
            .select("id, owner_id")
            .eq("is_published", true)
            .not("owner_id", "is", null);
        targetedRestaurants = toRestaurants(rests);

    } else if (targetType === "pack") {
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
            targetedRestaurants = toRestaurants(rests);
        }

    } else if (targetType === "city") {
        const { data: rests } = await db
            .from("restaurants")
            .select("id, owner_id")
            .ilike("address", `%${targetValue.trim()}%`)
            .not("owner_id", "is", null);
        targetedRestaurants = toRestaurants(rests);
    }

    if (targetedRestaurants.length === 0) {
        return NextResponse.json({ success: true, tokensSent: 0, message: "Aucun destinataire trouvé pour cette cible." });
    }

    const uniqueOwnerIds = [...new Set(targetedRestaurants.map((r) => r.owner_id))];

    // ── Récupération des push tokens ──────────────────────────────────────────
    const { data: tokenRows } = await db
        .from("push_tokens")
        .select("token")
        .in("user_id", uniqueOwnerIds);

    // Déduplication + filtre des tokens vides
    const tokensSet = new Set(
        (tokenRows ?? [])
            .map((r: any) => r.token as string)
            .filter((t: string) => Boolean(t))
    );
    const tokens = Array.from(tokensSet);

    let tokensSent = 0;

    if (tokens.length > 0) {
        try {
            // Chunking FCM: max 500 tokens par batch
            const chunks = chunkArray(tokens, 500);
            const invalidTokensCollected: Set<string> = new Set();
            console.log(`[broadcast] Envoi de ${tokens.length} tokens en ${chunks.length} chunk(s)`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`[broadcast] Chunk ${i + 1}/${chunks.length}: ${chunk.length} tokens`);

                try {
                    const { invalidTokens } = await sendFcmBatch(
                        chunk,
                        title.trim(),
                        bodyText.trim(),
                        { type: "broadcast", template: template ?? "custom" },
                        link ?? "/dashboard"
                    );

                    tokensSent += chunk.length;

                    // Tracker les tokens invalides pour suppression
                    invalidTokens.forEach(t => invalidTokensCollected.add(t));
                    if (invalidTokens.length > 0) {
                        console.warn(`[broadcast] ${invalidTokens.length} invalid tokens in chunk ${i + 1}`);
                    }
                } catch (err: any) {
                    console.error(`[broadcast] FCM error chunk ${i + 1}:`, err?.message);
                    // Continue avec les chunks suivants même si un échoue
                }

                // Petit délai entre les chunks pour éviter le rate limiting
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Marquer les tokens comme utilisés
            if (tokens.length > 0) {
                await db
                    .from("push_tokens")
                    .update({ last_used_at: new Date().toISOString() })
                    .in("token", tokens);
            }

            // Nettoyer les tokens invalides
            if (invalidTokensCollected.size > 0) {
                const invalidTokensArray = Array.from(invalidTokensCollected);
                console.log(`[broadcast] Cleaning up ${invalidTokensArray.length} invalid tokens...`);

                await db
                    .from("push_tokens")
                    .delete()
                    .in("token", invalidTokensArray);

                console.log(`[broadcast] Cleaned up ${invalidTokensArray.length} invalid tokens`);
            }
        } catch (err: any) {
            console.error("[broadcast] Unexpected FCM error:", err?.message);
        }
    }

    // ── Insertion dans restaurant_notifications (zone cloche) ─────────────────
    // Chaque restaurant ciblé reçoit une entrée visible dans son dashboard
    const notifRows = targetedRestaurants.map((r) => ({
        restaurant_id: r.id,
        type: "broadcast",
        title: title.trim(),
        body: bodyText.trim(),
        payload: { template: template ?? "custom", sentBy: userId, link: link ?? "/dashboard" },
        is_read: false,
    }));

    if (notifRows.length > 0) {
        // Insérer par lots de 200 pour éviter les limites de payload
        for (let i = 0; i < notifRows.length; i += 200) {
            await db.from("restaurant_notifications").insert(notifRows.slice(i, i + 200));
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
        recipientsCount: targetedRestaurants.length,
        message: tokens.length === 0
            ? `${targetedRestaurants.length} restaurant(s) ciblé(s) mais aucun token push enregistré.`
            : `Push envoyé à ${tokensSent} appareil(s) — ${targetedRestaurants.length} restaurant(s) ciblé(s).`,
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
