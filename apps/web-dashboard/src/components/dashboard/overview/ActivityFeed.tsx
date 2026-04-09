"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, MessageCircle, Star, Banknote, User, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";

interface ActivityEvent {
    id: string;
    type: "order_new" | "order_completed" | "review_new" | "message_new" | "payment_received" | "customer_new";
    title: string;
    description: string;
    created_at: string;
    meta?: { amount?: number; rating?: number };
}

const EVENT_CONFIG: Record<ActivityEvent["type"], { icon: any; color: string; bg: string }> = {
    order_new: { icon: ShoppingBag, color: "text-brand-500", bg: "bg-brand-500/10" },
    order_completed: { icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    review_new: { icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
    message_new: { icon: MessageCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
    payment_received: { icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    customer_new: { icon: User, color: "text-sky-500", bg: "bg-sky-500/10" },
};

function formatRelative(dateStr: string) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "date invalide";
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60_000);
        if (diffMin < 1) return "à l'instant";
        if (diffMin < 60) return `il y a ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `il y a ${diffH}h`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `il y a ${diffD}j`;
        return date.toLocaleDateString("fr-FR");
    } catch {
        return "date invalide";
    }
}

export function ActivityFeed() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await authFetch("/api/restaurant/activity");
                if (res.ok) {
                    const json = await res.json();
                    setEvents(json.events ?? []);
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
                <div className="p-5 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-xl bg-surface-200 dark:bg-surface-700 shrink-0" />
                            <div className="flex-1 space-y-1">
                                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
                                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    if (events.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
                <div className="p-8 text-center text-surface-400 dark:text-surface-500">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucune activité récente</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-surface-100 dark:bg-surface-800" />
                    <div className="space-y-4">
                        {events.map((event) => {
                            const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.order_new;
                            const Icon = cfg.icon;
                            return (
                                <div key={event.id} className="flex items-start gap-4 relative">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 ${cfg.bg}`}>
                                        <Icon size={16} className={cfg.color} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-sm font-medium text-surface-900 dark:text-white leading-snug">
                                            {event.title}
                                        </p>
                                        {event.description && (
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-surface-400 dark:text-surface-500 shrink-0 pt-0.5">
                                        {formatRelative(event.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
}
