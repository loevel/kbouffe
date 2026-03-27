"use client";

import { useEffect, useRef } from "react";
import { createClient, playOrderNotificationSound, playMessageSound, playNotificationSound } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";

/**
 * Global dashboard notification hook.
 * Listens via Supabase Realtime for:
 * - New orders → sound + toast + browser notification
 * - New chat messages → sound + toast
 *
 * Mount this once at the dashboard layout level.
 */
export function useDashboardNotifications() {
    const { user, restaurant } = useDashboard();
    const supabase = createClient();
    const notifiedRef = useRef<Set<string>>(new Set());

    // Request browser notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Subscribe to new orders
    useEffect(() => {
        if (!supabase || !restaurant?.id) return;

        const channel = supabase
            .channel("dashboard-order-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "orders",
                    filter: `restaurant_id=eq.${restaurant.id}`,
                },
                (payload) => {
                    const order = payload.new as {
                        id: string;
                        delivery_type?: string;
                        customer_name?: string;
                        total_amount?: number;
                    };

                    if (notifiedRef.current.has(order.id)) return;
                    notifiedRef.current.add(order.id);

                    // Keep bounded
                    if (notifiedRef.current.size > 200) {
                        const entries = Array.from(notifiedRef.current);
                        notifiedRef.current = new Set(entries.slice(-100));
                    }

                    // Sound
                    playOrderNotificationSound();

                    // Toast
                    const shortId = order.id.slice(-6).toUpperCase();
                    const deliveryLabel =
                        order.delivery_type === "dine_in" ? "Sur place" :
                        order.delivery_type === "delivery" ? "Livraison" :
                        "À emporter";

                    toast.success(
                        `🔔 Nouvelle commande #${shortId} — ${deliveryLabel}`,
                    );

                    // Browser notification
                    showBrowserNotif(
                        `Nouvelle commande #${shortId}`,
                        `${order.customer_name ?? "Client"} — ${deliveryLabel}`,
                        `new-order-${order.id}`,
                    );
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, restaurant?.id]);

    // Subscribe to new chat messages for this restaurant's conversations
    useEffect(() => {
        if (!supabase || !restaurant?.id || !user?.id) return;

        const channel = supabase
            .channel("dashboard-chat-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    const msg = payload.new as {
                        id: string;
                        conversation_id: string;
                        sender_id: string;
                        content: string;
                    };

                    // Ignore own messages
                    if (msg.sender_id === user.id) return;

                    // Deduplicate
                    const key = `msg-${msg.id}`;
                    if (notifiedRef.current.has(key)) return;
                    notifiedRef.current.add(key);

                    // Sound
                    playMessageSound();

                    // Toast
                    const preview = msg.content.length > 60
                        ? msg.content.slice(0, 57) + "…"
                        : msg.content;
                    toast.info("💬 Nouveau message : " + preview);

                    // Browser notification
                    showBrowserNotif(
                        "Nouveau message",
                        preview,
                        `chat-${msg.id}`,
                    );
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, restaurant?.id, user?.id]);
}

function showBrowserNotif(title: string, body: string, tag: string) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
        new Notification(title, { body, icon: "/logo-icon.svg", tag });
    } catch {
        // Safari/iOS may not support Notification constructor
    }
}
