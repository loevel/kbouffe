"use client";

/**
 * StockAlertBadge -- Visual stock level indicator with tooltip
 *
 * Rules:
 *   - RED    if available_qty < min_order_qty           -> "Stock bas"
 *   - ORANGE if available_qty < min_order_qty * 2       -> "Stock moyen"
 *   - GREEN  otherwise                                  -> "{qty} disponible"
 *   - null available_qty -> dash
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StockAlertBadgeProps {
    availableQty: number | null;
    minOrderQty: number;
    unit: string;
    capacity?: number | null;
}

type StockLevel = "low" | "medium" | "good" | "unknown";

function getStockLevel(available: number | null, minOrder: number): StockLevel {
    if (available == null) return "unknown";
    if (available < minOrder) return "low";
    if (available < minOrder * 2) return "medium";
    return "good";
}

const LEVEL_CONFIG: Record<
    StockLevel,
    { bg: string; text: string; border: string; dot: string }
> = {
    low: {
        bg: "bg-red-500/15",
        text: "text-red-300",
        border: "border-red-500/20",
        dot: "bg-red-400",
    },
    medium: {
        bg: "bg-amber-500/15",
        text: "text-amber-300",
        border: "border-amber-500/20",
        dot: "bg-amber-400",
    },
    good: {
        bg: "bg-emerald-500/15",
        text: "text-emerald-300",
        border: "border-emerald-500/20",
        dot: "bg-emerald-400",
    },
    unknown: {
        bg: "bg-surface-800",
        text: "text-surface-500",
        border: "border-white/8",
        dot: "bg-surface-500",
    },
};

export function StockAlertBadge({
    availableQty,
    minOrderQty,
    unit,
    capacity,
}: StockAlertBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const level = getStockLevel(availableQty, minOrderQty);
    const cfg = LEVEL_CONFIG[level];

    function getLabel(): string {
        switch (level) {
            case "low":
                return "Stock bas";
            case "medium":
                return "Stock moyen";
            case "good":
                return `${availableQty} ${unit}`;
            case "unknown":
                return "\u2014";
        }
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
        >
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-default ${cfg.bg} ${cfg.text} ${cfg.border}`}
                role="status"
                aria-label={`Niveau de stock: ${getLabel()}`}
                tabIndex={0}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {getLabel()}
            </span>

            <AnimatePresence>
                {showTooltip && availableQty != null && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 rounded-xl bg-surface-800 border border-white/10 shadow-xl text-xs pointer-events-none"
                    >
                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-surface-500">Disponible</span>
                                <span className="text-white font-medium">
                                    {availableQty} {unit}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-500">Commande min.</span>
                                <span className="text-white font-medium">
                                    {minOrderQty} {unit}
                                </span>
                            </div>
                            {capacity != null && (
                                <div className="flex justify-between">
                                    <span className="text-surface-500">Capacite max.</span>
                                    <span className="text-white font-medium">
                                        {capacity} {unit}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="w-2 h-2 rotate-45 bg-surface-800 border-r border-b border-white/10" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
