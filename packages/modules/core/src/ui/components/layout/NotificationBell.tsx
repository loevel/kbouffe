"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, ShoppingBag, AlertCircle, Clock, X, BarChart3, Trophy, UserMinus, Megaphone, Trash2 } from "lucide-react";
import { authFetch } from "../../lib/auth-fetch";
import { createClient } from "../../lib/supabase-client";
import { useDashboard } from "../../contexts/DashboardContext";

interface KdsNotification {
    id: string;
    restaurant_id: string;
    order_id: string;
    event_type: string;
    payload: Record<string, any>;
    processed: boolean;
    created_at: string;
    _source?: "kds" | "engagement";
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
        case "new_order":
            return <ShoppingBag size={16} className="text-green-500" />;
        case "order_urgent":
            return <AlertCircle size={16} className="text-red-500" />;
        case "status_changed":
            return <Clock size={16} className="text-blue-500" />;
        case "daily_summary":
            return <BarChart3 size={16} className="text-blue-400" />;
        case "badge_earned":
            return <Trophy size={16} className="text-amber-400" />;
        case "inactive_customer":
            return <UserMinus size={16} className="text-orange-400" />;
        case "broadcast":
            return <Megaphone size={16} className="text-violet-400" />;
        default:
            return <Bell size={16} className="text-surface-400" />;
    }
}

function getNotificationTitle(notif: KdsNotification): string {
    // Engagement notifications carry title/body in payload
    if (notif.payload?.title) return String(notif.payload.title);
    switch (notif.event_type) {
        case "new_order":
            return `Nouvelle commande${notif.payload?.customer_name ? ` de ${notif.payload.customer_name}` : ""}`;
        case "order_urgent":
            return "Commande urgente !";
        case "status_changed":
            return "Statut de commande modifie";
        default:
            return "Notification";
    }
}

function getNotificationBg(type: string, processed: boolean) {
    if (processed) return "";
    switch (type) {
        case "new_order":
            return "bg-green-50/50 dark:bg-green-500/5";
        case "order_urgent":
            return "bg-red-50/50 dark:bg-red-500/5";
        case "status_changed":
            return "bg-blue-50/50 dark:bg-blue-500/5";
        case "daily_summary":
            return "bg-blue-50/50 dark:bg-blue-500/5";
        case "badge_earned":
            return "bg-amber-50/50 dark:bg-amber-500/5";
        case "inactive_customer":
            return "bg-orange-50/50 dark:bg-orange-500/5";
        case "broadcast":
            return "bg-violet-50/50 dark:bg-violet-500/5";
        default:
            return "bg-surface-50 dark:bg-surface-800/50";
    }
}

export function NotificationBell() {
    const { restaurant } = useDashboard();
    const restaurantId = restaurant?.id;
    const [notifications, setNotifications] = useState<KdsNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleting, setDeleting] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await authFetch("/api/notifications");
            if (res.ok) {
                const data = await res.json() as { notifications: KdsNotification[]; unreadCount: number };
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch {
            // Silently fail
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Polling every 30s
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Realtime subscription
    useEffect(() => {
        if (!restaurantId) return;
        const supabase = createClient();
        if (!supabase) return;

        const kdsChannel = supabase
            .channel(`kds-notifications-${restaurantId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "kds_notifications",
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    const newNotif = payload.new as KdsNotification;
                    setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        const engagementChannel = supabase
            .channel(`engagement-notifications-${restaurantId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "restaurant_notifications",
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    const n = payload.new as any;
                    const mapped: KdsNotification = {
                        id: n.id,
                        restaurant_id: n.restaurant_id,
                        order_id: "",
                        event_type: n.type,
                        payload: { ...(n.payload ?? {}), title: n.title, body: n.body },
                        processed: n.is_read,
                        created_at: n.created_at,
                    };
                    setNotifications((prev) => [mapped, ...prev].slice(0, 20));
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(kdsChannel);
            supabase.removeChannel(engagementChannel);
        };
    }, [restaurantId]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const markAllRead = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, processed: true }))
                );
                setUnreadCount(0);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    };

    const deleteNotification = async (id: string, source: string) => {
        // Optimistic update
        const wasUnread = notifications.find((n) => n.id === id)?.processed === false;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // API call
        setDeleting((prev) => new Set([...prev, id]));
        try {
            await authFetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: [id],
                    source: source === "kds" ? "kds" : "engagement",
                }),
            });
        } catch {
            // If fails, refetch to sync
            fetchNotifications();
        } finally {
            setDeleting((prev) => {
                const s = new Set(prev);
                s.delete(id);
                return s;
            });
        }
    };

    const deleteAll = async () => {
        setNotifications([]);
        setUnreadCount(0);
        try {
            await authFetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source: "all" }),
            });
        } catch {
            // If fails, refetch
            fetchNotifications();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="relative p-2 text-surface-500 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-brand-500 rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                            Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={deleteAll}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                                    title="Supprimer toutes les notifications"
                                >
                                    Tout supprimer
                                </button>
                            )}
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    disabled={isLoading}
                                    className="text-xs text-brand-500 hover:text-brand-600 font-medium disabled:opacity-50"
                                >
                                    Tout marquer lu
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-surface-500">
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`group flex items-start gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-800 last:border-b-0 transition-colors ${getNotificationBg(notif.event_type, notif.processed)}`}
                                >
                                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                        {getNotificationIcon(notif.event_type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                                            {getNotificationTitle(notif)}
                                        </p>
                                        {notif.payload?.body ? (
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                                                {String(notif.payload.body)}
                                            </p>
                                        ) : notif.payload?.order_number ? (
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                                Commande #{notif.payload.order_number}
                                            </p>
                                        ) : null}
                                        <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-1">
                                            {timeAgo(notif.created_at)}
                                        </p>
                                    </div>
                                    {!notif.processed && (
                                        <div className="mt-2 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notif.id, notif._source ?? "engagement")}
                                        disabled={deleting.has(notif.id)}
                                        className="mt-0.5 shrink-0 p-1.5 text-surface-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                        aria-label="Supprimer"
                                        title="Supprimer cette notification"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
