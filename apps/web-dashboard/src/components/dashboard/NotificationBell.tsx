"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, MessageSquare, Trophy, BarChart3, UserMinus, Megaphone } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/restaurant/notifications?limit=15");
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unreadCount ?? 0);
        } catch {
            // silent
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const markAllRead = async () => {
        setLoading(true);
        try {
            await fetch("/api/restaurant/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch {
            // silent
        }
        setLoading(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "daily_summary":
                return <BarChart3 size={16} className="text-blue-400" />;
            case "badge_earned":
                return <Trophy size={16} className="text-amber-400" />;
            case "inactive_customer":
                return <UserMinus size={16} className="text-orange-400" />;
            case "broadcast":
                return <Megaphone size={16} className="text-violet-400" />;
            default:
                return <MessageSquare size={16} className="text-surface-400" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60_000);
        if (mins < 1) return "A l'instant";
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}j`;
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                        <h3 className="font-semibold text-sm text-surface-900 dark:text-white">
                            Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    disabled={loading}
                                    className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                                >
                                    <CheckCheck size={14} />
                                    Tout lire
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-surface-400">
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`px-4 py-3 flex gap-3 transition-colors ${
                                        notif.is_read
                                            ? "bg-transparent"
                                            : "bg-brand-50/50 dark:bg-brand-500/5"
                                    }`}
                                >
                                    <div className="mt-0.5 flex-shrink-0">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                                            {notif.body}
                                        </p>
                                        {notif.type === "inactive_customer" && (
                                            <Link
                                                href="/dashboard/marketplace"
                                                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-500 hover:text-brand-600"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                Envoyer une promo SMS →
                                            </Link>
                                        )}
                                        <p className="text-[10px] text-surface-400 mt-1">
                                            {formatTime(notif.created_at)}
                                        </p>
                                    </div>
                                    {!notif.is_read && (
                                        <div className="mt-1.5 flex-shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-brand-500" />
                                        </div>
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
