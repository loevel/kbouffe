/**
 * send-push.ts — helpers serveur pour envoyer des push FCM.
 * Compatible Edge/Cloudflare (pas de firebase-admin).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendFcmMessage, sendFcmBatch } from "./admin";

interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    link?: string;
}

/**
 * Envoie une push à un utilisateur identifié par son ID.
 * Récupère tous ses tokens depuis la table push_tokens (multi-device).
 * Met à jour last_used_at pour les tokens valides.
 * Silencieux si pas de token ou si FCM échoue.
 */
export async function sendPushToUser(
    adminDb: SupabaseClient,
    userId: string,
    payload: PushPayload
): Promise<void> {
    try {
        const { data: rows } = await adminDb
            .from("push_tokens")
            .select("token")
            .eq("user_id", userId);

        const tokens = (rows ?? []).map((r: any) => r.token as string).filter(Boolean);
        if (!tokens.length) return;

        if (tokens.length === 1) {
            await sendFcmMessage({ token: tokens[0], ...payload });
        } else {
            await sendFcmBatch(tokens, payload.title, payload.body, payload.data, payload.link);
        }

        // Marquer les tokens comme utilisés récemment
        await adminDb
            .from("push_tokens")
            .update({ last_used_at: new Date().toISOString() })
            .in("token", tokens);
    } catch (err: any) {
        console.error("[sendPushToUser]", err?.message ?? err);
    }
}

/**
 * Envoie une push à tous les membres actifs d'un restaurant.
 */
export async function sendPushToRestaurant(
    adminDb: SupabaseClient,
    restaurantId: string,
    payload: PushPayload
): Promise<void> {
    try {
        // Récupère le owner + les membres actifs
        const { data: restaurant } = await adminDb
            .from("restaurants")
            .select("owner_id")
            .eq("id", restaurantId)
            .maybeSingle();

        const ownerIds: string[] = restaurant?.owner_id ? [restaurant.owner_id] : [];

        const { data: members } = await adminDb
            .from("restaurant_members")
            .select("user_id")
            .eq("restaurant_id", restaurantId)
            .eq("status", "active") as any;

        const memberIds: string[] = (members ?? []).map((m: any) => m.user_id);
        const userIds = [...new Set([...ownerIds, ...memberIds])];
        if (!userIds.length) return;

        // Récupère les tokens depuis push_tokens (multi-device)
        const { data: tokenRows } = await adminDb
            .from("push_tokens")
            .select("token")
            .in("user_id", userIds);

        const tokens = (tokenRows ?? [])
            .map((r: any) => r.token as string)
            .filter(Boolean);

        if (!tokens.length) return;
        await sendFcmBatch(tokens, payload.title, payload.body, payload.data, payload.link);

        // Marquer les tokens comme utilisés récemment
        await adminDb
            .from("push_tokens")
            .update({ last_used_at: new Date().toISOString() })
            .in("token", tokens);
    } catch (err: any) {
        console.error("[sendPushToRestaurant]", err?.message ?? err);
    }
}
