"use client";

/**
 * ActivityFeed -- Timeline verticale des 10 dernieres activites
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
    ShoppingCart,
    MessageCircle,
    Star,
    Package,
    CheckCircle2,
    Truck,
    type LucideIcon,
} from "lucide-react";

export interface ActivityItem {
    id: string;
    type: "new_order" | "message" | "rating" | "product_added" | "order_confirmed" | "order_delivered";
    title: string;
    description?: string;
    timestamp: string;
    href?: string;
}

const ICON_MAP: Record<ActivityItem["type"], { icon: LucideIcon; color: string; bg: string }> = {
    new_order:       { icon: ShoppingCart, color: "text-blue-400",    bg: "bg-blue-500/15" },
    message:         { icon: MessageCircle, color: "text-brand-400",  bg: "bg-brand-500/15" },
    rating:          { icon: Star,          color: "text-amber-400",  bg: "bg-amber-500/15" },
    product_added:   { icon: Package,       color: "text-violet-400", bg: "bg-violet-500/15" },
    order_confirmed: { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/15" },
    order_delivered: { icon: Truck,          color: "text-emerald-400", bg: "bg-emerald-500/15" },
};

function formatTimeAgo(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "A l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    loading?: boolean;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
    if (loading) {
        return (
            <div className="bg-surface-900 border border-white/8 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Activite recente</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-800 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-3/4 bg-surface-800 rounded animate-pulse" />
                                <div className="h-2 w-1/2 bg-surface-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="bg-surface-900 border border-white/8 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Activite recente</h3>
                <p className="text-sm text-surface-500 text-center py-6">
                    Aucune activite recente
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-900 border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Activite recente</h3>
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-white/8" />

                <div className="space-y-1">
                    {activities.slice(0, 10).map((activity, i) => {
                        const cfg = ICON_MAP[activity.type] ?? ICON_MAP.new_order;
                        const Icon = cfg.icon;

                        const content = (
                            <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-start gap-3 py-2.5 px-1 rounded-xl hover:bg-white/3 transition-colors group"
                            >
                                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 relative z-10`}>
                                    <Icon size={14} className={cfg.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate group-hover:text-brand-300 transition-colors">
                                        {activity.title}
                                    </p>
                                    {activity.description && (
                                        <p className="text-xs text-surface-500 truncate mt-0.5">
                                            {activity.description}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-surface-600 mt-1">
                                        {formatTimeAgo(activity.timestamp)}
                                    </p>
                                </div>
                            </motion.div>
                        );

                        if (activity.href) {
                            return (
                                <Link key={activity.id} href={activity.href} className="block">
                                    {content}
                                </Link>
                            );
                        }

                        return <div key={activity.id}>{content}</div>;
                    })}
                </div>
            </div>
        </div>
    );
}
