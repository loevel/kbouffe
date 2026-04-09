"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Bell,
    CheckCircle2,
    ChefHat,
    Package,
    Truck,
    X,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { createClient } from "@/lib/supabase/client";

interface ClientNotification {
    id: string;
    user_id: string;
    order_id: string | null;
    type: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
}

function timeAgo(dateStr: string): string {
    try {
        const now = Date.now();
        const then = new Date(dateStr).getTime();
        if (isNaN(then)) return "date invalide";
        const diff = Math.max(0, now - then);
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return "à l'instant";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `il y a ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `il y a ${days}j`;
        return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch {
        return "date invalide";
    }
}

function getNotificationIcon(type: string) {
    switch (type) {
        case "order_confirmed":
            return <CheckCircle2 size={18} className="text-blue-500" />;
        case "order_preparing":
            return <ChefHat size={18} className="text-orange-500" />;
        case "order_ready":
            return <Package size={18} className="text-green-500" />;
        case "order_delivered":
            return <Truck size={18} className="text-green-500" />;
        case "order_cancelled":
            return <X size={18} className="text-red-500" />;
        default:
            return <Bell size={18} className="text-surface-400" />;
    }
}

function getNotificationBg(type: string, isRead: boolean) {
    if (isRead) return "bg-white dark:bg-surface-900";
    switch (type) {
        case "order_confirmed":
            return "bg-blue-50/50 dark:bg-blue-500/5";
        case "order_preparing":
            return "bg-orange-50/50 dark:bg-orange-500/5";
        case "order_ready":
        case "order_delivered":
            return "bg-green-50/50 dark:bg-green-500/5";
        case "order_cancelled":
            return "bg-red-50/50 dark:bg-red-500/5";
        default:
            return "bg-surface-50 dark:bg-surface-800/50";
    }
}

export function ClientNotificationsPanel() {
    const [notifications, setNotifications] = useState<ClientNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [markingRead, setMarkingRead] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await authFetch("/api/auth/notifications");
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
                setIsAuthenticated(true);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Realtime subscription
    useEffect(() => {
        const supabase = createClient();
        if (!supabase) return;

        // Get current user for filter
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;

            const channel = supabase
                .channel(`client-notifications-${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "client_notifications",
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newNotif = payload.new as ClientNotification;
                        setNotifications((prev) => [newNotif, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        });
    }, []);

    const markAllRead = async () => {
        setMarkingRead(true);
        try {
            const res = await authFetch("/api/auth/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, is_read: true }))
                );
                setUnreadCount(0);
            }
        } catch {
            // Silently fail
        } finally {
            setMarkingRead(false);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                    Notifications
                </h2>
                <p className="text-surface-600 dark:text-surface-400 mb-5">
                    Suivez vos commandes en temps reel.
                </p>
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-surface-300 dark:border-surface-600 border-t-brand-500 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (isAuthenticated === false) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                    Notifications
                </h2>
                <p className="text-surface-600 dark:text-surface-400 mb-5">
                    Suivez vos commandes en temps reel.
                </p>
                <div className="text-center py-8">
                    <Bell size={32} className="mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        Connectez-vous pour voir vos notifications
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                        Notifications
                    </h2>
                    <p className="text-surface-600 dark:text-surface-400">
                        Suivez vos commandes en temps reel.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        disabled={markingRead}
                        className="text-sm font-semibold text-brand-500 hover:text-brand-600 disabled:opacity-50"
                    >
                        {markingRead ? "..." : "Marquer tout comme lu"}
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-8">
                    <Bell size={32} className="mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        Aucune notification pour le moment
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-700 transition-colors ${getNotificationBg(notif.type, notif.is_read)}`}
                        >
                            <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                {getNotificationIcon(notif.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                                        {notif.title}
                                    </p>
                                    {!notif.is_read && (
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                    )}
                                </div>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                                    {notif.body}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs text-surface-400 dark:text-surface-500">
                                        {timeAgo(notif.created_at)}
                                    </span>
                                    {notif.order_id && (
                                        <Link
                                            href={`/stores/orders`}
                                            className="text-xs font-medium text-brand-500 hover:text-brand-600"
                                        >
                                            Voir la commande
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
