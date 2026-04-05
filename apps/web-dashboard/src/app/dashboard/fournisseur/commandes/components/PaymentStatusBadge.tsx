"use client";

/**
 * PaymentStatusBadge -- Payment status display for orders
 *
 * States: Pending | Paid | Failed | Refunded
 * With tooltip explanation on hover
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface PaymentStatusBadgeProps {
    status: PaymentStatus | string | null | undefined;
}

// ── Config ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    PaymentStatus,
    { label: string; bg: string; text: string; border: string; dot: string; tooltip: string }
> = {
    pending: {
        label: "En attente",
        bg: "bg-amber-500/15",
        text: "text-amber-300",
        border: "border-amber-500/20",
        dot: "bg-amber-400",
        tooltip: "Le restaurant n'a pas encore paye",
    },
    paid: {
        label: "Paye",
        bg: "bg-emerald-500/15",
        text: "text-emerald-300",
        border: "border-emerald-500/20",
        dot: "bg-emerald-400",
        tooltip: "Paiement recu et confirme",
    },
    failed: {
        label: "Echoue",
        bg: "bg-red-500/15",
        text: "text-red-300",
        border: "border-red-500/20",
        dot: "bg-red-400",
        tooltip: "Le paiement a echoue, contactez le restaurant",
    },
    refunded: {
        label: "Rembourse",
        bg: "bg-yellow-500/15",
        text: "text-yellow-300",
        border: "border-yellow-500/20",
        dot: "bg-yellow-400",
        tooltip: "Le paiement a ete rembourse au restaurant",
    },
};

// ── Component ────────────────────────────────────────────────────────────

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const normalizedStatus: PaymentStatus =
        status && status in STATUS_CONFIG
            ? (status as PaymentStatus)
            : "pending";

    const cfg = STATUS_CONFIG[normalizedStatus];

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
                aria-label={`Statut paiement: ${cfg.label}`}
                tabIndex={0}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
            </span>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-surface-800 border border-white/10 shadow-xl text-xs text-surface-300 pointer-events-none text-center"
                    >
                        {cfg.tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="w-2 h-2 rotate-45 bg-surface-800 border-r border-b border-white/10" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
