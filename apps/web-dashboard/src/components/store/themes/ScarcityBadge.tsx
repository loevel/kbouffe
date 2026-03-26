"use client";

import { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";

interface ScarcityBadgeProps {
    isLimitedEdition?: boolean;
    stockQuantity?: number | null;
    availableUntil?: string | null;
    variant?: "default" | "overlay"; // overlay = for StoryTheme (white text)
}

function formatCountdown(targetDate: Date): string {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return "Terminé";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}j restant${days > 1 ? "s" : ""}`;
    }
    if (hours > 0) return `${hours}h${minutes.toString().padStart(2, "0")} restantes`;
    return `${minutes}min restantes`;
}

export function ScarcityBadge({ isLimitedEdition, stockQuantity, availableUntil, variant = "default" }: ScarcityBadgeProps) {
    const [countdown, setCountdown] = useState<string>("");

    useEffect(() => {
        if (!availableUntil) return;
        const target = new Date(availableUntil);
        if (isNaN(target.getTime())) return;

        const update = () => setCountdown(formatCountdown(target));
        update();
        const interval = setInterval(update, 60_000); // Update every minute
        return () => clearInterval(interval);
    }, [availableUntil]);

    if (!isLimitedEdition) return null;

    const isOverlay = variant === "overlay";
    const hasStock = stockQuantity !== null && stockQuantity !== undefined;
    const lowStock = hasStock && stockQuantity <= 5;
    const hasCountdown = availableUntil && countdown && countdown !== "Terminé";

    // Stock bar percentage
    const stockPercent = hasStock ? Math.min(100, Math.max(0, (stockQuantity / 30) * 100)) : null;

    return (
        <div className="space-y-1.5">
            {/* Limited edition badge */}
            <div className="flex items-center gap-2 flex-wrap">
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                        isOverlay
                            ? "bg-orange-500 text-white shadow-lg"
                            : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
                    }`}
                >
                    <Flame size={10} />
                    Édition limitée
                </span>

                {hasCountdown && (
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                            isOverlay
                                ? "bg-white/20 text-white backdrop-blur-sm"
                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}
                    >
                        <Clock size={10} />
                        {countdown}
                    </span>
                )}
            </div>

            {/* Stock bar */}
            {hasStock && (
                <div className={`flex items-center gap-2 ${isOverlay ? "text-white" : ""}`}>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isOverlay ? "bg-white/20" : "bg-surface-100 dark:bg-surface-800"}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                lowStock
                                    ? "bg-red-500 animate-pulse"
                                    : "bg-gradient-to-r from-orange-400 to-orange-500"
                            }`}
                            style={{ width: `${stockPercent}%` }}
                        />
                    </div>
                    <span
                        className={`text-[11px] font-bold shrink-0 ${
                            lowStock
                                ? isOverlay ? "text-red-300" : "text-red-500"
                                : isOverlay ? "text-white/80" : "text-surface-500 dark:text-surface-400"
                        }`}
                    >
                        {stockQuantity <= 0 ? "Épuisé !" : `${stockQuantity} restant${stockQuantity > 1 ? "s" : ""}`}
                    </span>
                </div>
            )}
        </div>
    );
}
