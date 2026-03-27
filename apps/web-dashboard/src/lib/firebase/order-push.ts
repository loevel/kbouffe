/**
 * order-push.ts — Push notifications pour le processus de commande.
 * Envoie des notifications FCM aux clients, restaurants et livreurs
 * à chaque étape du cycle de vie d'une commande.
 *
 * Toutes les fonctions sont fire-and-forget et silencieuses en cas d'erreur.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser, sendPushToRestaurant } from "./send-push";

interface OrderContext {
    orderId: string;
    orderRef: string; // e.g. "KB-A1B2"
    restaurantId: string;
    restaurantName: string;
    customerId?: string | null;
    driverId?: string | null;
    total?: number;
    deliveryType?: string;
}

function formatOrderId(id: string): string {
    return `#KB-${id.slice(-4).toUpperCase()}`;
}

function formatPrice(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

// ── Push messages per status ──────────────────────────────────────────────

const STATUS_PUSH: Record<string, {
    client?: (ctx: OrderContext) => { title: string; body: string };
    restaurant?: (ctx: OrderContext) => { title: string; body: string };
    driver?: (ctx: OrderContext) => { title: string; body: string };
}> = {
    pending: {
        restaurant: (ctx) => ({
            title: `🔔 Nouvelle commande ${ctx.orderRef}`,
            body: `Commande de ${ctx.total ? formatPrice(ctx.total) : "—"} reçue. Consultez-la maintenant !`,
        }),
    },
    accepted: {
        client: (ctx) => ({
            title: `✅ Commande ${ctx.orderRef} acceptée`,
            body: `${ctx.restaurantName} a accepté votre commande et va la préparer.`,
        }),
    },
    preparing: {
        client: (ctx) => ({
            title: `👨‍🍳 Commande ${ctx.orderRef} en préparation`,
            body: `${ctx.restaurantName} prépare votre commande.`,
        }),
    },
    ready: {
        client: (ctx) => ({
            title: ctx.deliveryType === "delivery"
                ? `📦 Commande ${ctx.orderRef} prête`
                : `📦 Commande ${ctx.orderRef} prête à retirer`,
            body: ctx.deliveryType === "delivery"
                ? `Votre commande est prête et en attente du livreur.`
                : `Vous pouvez venir récupérer votre commande chez ${ctx.restaurantName}.`,
        }),
        driver: (ctx) => ({
            title: `📦 Commande ${ctx.orderRef} prête à récupérer`,
            body: `Rendez-vous chez ${ctx.restaurantName} pour récupérer la commande.`,
        }),
    },
    out_for_delivery: {
        client: (ctx) => ({
            title: `🛵 Commande ${ctx.orderRef} en livraison`,
            body: `Votre livreur est en route ! Suivez sa position en temps réel.`,
        }),
    },
    delivered: {
        client: (ctx) => ({
            title: `🎉 Commande ${ctx.orderRef} livrée`,
            body: `Votre commande a été livrée. Bon appétit !`,
        }),
        restaurant: (ctx) => ({
            title: `✅ Commande ${ctx.orderRef} livrée`,
            body: `La commande a été livrée avec succès.`,
        }),
    },
    cancelled: {
        client: (ctx) => ({
            title: `❌ Commande ${ctx.orderRef} annulée`,
            body: `Votre commande chez ${ctx.restaurantName} a été annulée.`,
        }),
        restaurant: (ctx) => ({
            title: `❌ Commande ${ctx.orderRef} annulée`,
            body: `Le client a annulé sa commande${ctx.total ? ` de ${formatPrice(ctx.total)}` : ""}.`,
        }),
    },
};

/**
 * Envoie les notifications push appropriées lors d'un changement de statut.
 * Fire-and-forget : ne bloque pas et ne throw jamais.
 */
export async function pushOrderStatusChange(
    adminDb: SupabaseClient,
    status: string,
    ctx: OrderContext
): Promise<void> {
    const config = STATUS_PUSH[status];
    if (!config) return;

    const orderRef = ctx.orderRef || formatOrderId(ctx.orderId);
    const context = { ...ctx, orderRef };
    const link = `/dashboard/orders/${ctx.orderId}`;
    const clientLink = `/order/${ctx.orderId}`;

    const promises: Promise<void>[] = [];

    // Notify restaurant
    if (config.restaurant) {
        const msg = config.restaurant(context);
        promises.push(
            sendPushToRestaurant(adminDb, ctx.restaurantId, {
                ...msg,
                data: { orderId: ctx.orderId, status, type: "order_status" },
                link,
            })
        );
    }

    // Notify client
    if (config.client && ctx.customerId) {
        const msg = config.client(context);
        promises.push(
            sendPushToUser(adminDb, ctx.customerId, {
                ...msg,
                data: { orderId: ctx.orderId, status, type: "order_status" },
                link: clientLink,
            })
        );
    }

    // Notify driver (only if assigned)
    if (config.driver && ctx.driverId) {
        const msg = config.driver(context);
        promises.push(
            sendPushToUser(adminDb, ctx.driverId, {
                ...msg,
                data: { orderId: ctx.orderId, status, type: "order_status" },
                link: "/driver",
            })
        );
    }

    try {
        await Promise.allSettled(promises);
    } catch {
        // Silently ignore — individual errors logged inside helpers
    }
}

/**
 * Notifie un livreur qu'une commande lui a été assignée.
 */
export async function pushDriverAssigned(
    adminDb: SupabaseClient,
    driverId: string,
    ctx: OrderContext
): Promise<void> {
    const orderRef = ctx.orderRef || formatOrderId(ctx.orderId);
    try {
        await sendPushToUser(adminDb, driverId, {
            title: `🚗 Nouvelle livraison assignée`,
            body: `La commande ${orderRef} chez ${ctx.restaurantName} vous a été assignée.`,
            data: { orderId: ctx.orderId, type: "driver_assigned" },
            link: "/driver",
        });
    } catch {
        // Silently ignore
    }
}
