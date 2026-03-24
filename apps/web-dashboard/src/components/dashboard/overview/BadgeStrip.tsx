"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { BADGE_ICON_MAP } from "@/lib/badges/definitions";

interface Badge {
    id: string;
    badge_type: string;
    badge_name: string;
    earned_at: string;
    metadata: Record<string, unknown> | null;
}

export function BadgeStrip() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/restaurant/badges")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.badges) setBadges(data.badges);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;

    if (badges.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Trophy size={20} className="text-amber-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        Gagnez votre premier badge !
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        Atteignez 10 commandes livrees pour debloquer votre premiere recompense.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                    Vos badges
                </h3>
                <span className="text-xs text-surface-400 ml-auto">{badges.length} obtenu{badges.length > 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {badges.map((badge) => {
                    const icon = BADGE_ICON_MAP[(badge.metadata as any)?.icon ?? "medal"] ?? "🏅";
                    return (
                        <div
                            key={badge.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                            title={`Obtenu le ${new Date(badge.earned_at).toLocaleDateString("fr-FR")}`}
                        >
                            <span className="text-base">{icon}</span>
                            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                {badge.badge_name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
