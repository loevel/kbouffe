"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Store, Shield, LifeBuoy, X } from "lucide-react";
import { adminFetch, createClient } from "@kbouffe/module-core/ui";

interface AdminNotification {
    id: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, any>;
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
        case "new_restaurant":
            return <Store size={16} className="text-green-500" />;
        case "kyc_submitted":
            return <Shield size={16} className="text-blue-500" />;
        case "support_ticket":
            return <LifeBuoy size={16} className="text-orange-500" />;
        default:
            return <Bell size={16} className="text-surface-400" />;
    }
}

function getNotificationBg(type: string, isRead: boolean) {
    if (isRead) return "";
    switch (type) {
        case "new_restaurant":
            return "bg-green-50/50 dark:bg-green-500/5";
        case "kyc_submitted":
            return "bg-blue-50/50 dark:bg-blue-500/5";
        case "support_ticket":
            return "bg-orange-50/50 dark:bg-orange-500/5";
        default:
            return "bg-surface-50 dark:bg-surface-800/50";
    }
}

export function AdminNotificationBell() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await adminFetch("/api/admin/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch {
            // Silently fail on network errors
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Polling every 60s
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Realtime subscription
    useEffect(() => {
        const supabase = createClient();
        if (!supabase) return;

        const channel = supabase
            .channel("admin-notifications-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "admin_notifications",
                },
                (payload) => {
                    const newNotif = payload.new as AdminNotification;
                    setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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
            const res = await adminFetch("/api/admin/notifications/read", {
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
            setIsLoading(false);
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
                                    className={`flex items-start gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-800 last:border-b-0 transition-colors ${getNotificationBg(notif.type, notif.is_read)}`}
                                >
                                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                        {getNotificationIcon(notif.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                                            {notif.body}
                                        </p>
                                        <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-1">
                                            {timeAgo(notif.created_at)}
                                        </p>
                                    </div>
                                    {!notif.is_read && (
                                        <div className="mt-2 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
