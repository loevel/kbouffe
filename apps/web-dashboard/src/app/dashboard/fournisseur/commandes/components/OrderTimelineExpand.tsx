"use client";

/**
 * OrderTimelineExpand -- Expandable order timeline visualization
 *
 * Compact mode: horizontal dots
 * Expanded mode: vertical timeline with labels + timestamps
 *
 * Steps: Pending -> Confirmed -> Prepared -> In delivery -> Delivered
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    Package,
    Truck,
    PackageCheck,
    XCircle,
    AlertTriangle,
    ChevronDown,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface OrderTimelineExpandProps {
    deliveryStatus: string;
    createdAt: string;
    confirmedAt?: string | null;
    preparedAt?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    expectedDeliveryDate: string | null;
    actualDeliveryDate: string | null;
}

interface TimelineStep {
    key: string;
    label: string;
    icon: React.ElementType;
    completed: boolean;
    active: boolean;
    timestamp?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const STATUS_ORDER = ["pending", "confirmed", "prepared", "in_delivery", "delivered"];

function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

// ── Component ────────────────────────────────────────────────────────────

export function OrderTimelineExpand({
    deliveryStatus,
    createdAt,
    confirmedAt,
    preparedAt,
    shippedAt,
    deliveredAt,
    expectedDeliveryDate,
    actualDeliveryDate,
}: OrderTimelineExpandProps) {
    const [expanded, setExpanded] = useState(false);

    const isCancelled = deliveryStatus === "cancelled";
    const isDisputed = deliveryStatus === "disputed";
    const currentIdx = STATUS_ORDER.indexOf(deliveryStatus);

    // Check delayed delivery
    const isDelayed =
        expectedDeliveryDate &&
        actualDeliveryDate &&
        new Date(actualDeliveryDate) > new Date(expectedDeliveryDate);

    const isOverdue =
        expectedDeliveryDate &&
        !actualDeliveryDate &&
        deliveryStatus !== "delivered" &&
        deliveryStatus !== "cancelled" &&
        new Date() > new Date(expectedDeliveryDate);

    const steps: TimelineStep[] = [
        {
            key: "pending",
            label: "En attente",
            icon: Clock,
            completed: currentIdx > 0 || deliveryStatus === "delivered",
            active: deliveryStatus === "pending",
            timestamp: createdAt,
        },
        {
            key: "confirmed",
            label: "Confirmee",
            icon: CheckCircle2,
            completed: currentIdx > 1 || deliveryStatus === "delivered",
            active: deliveryStatus === "confirmed",
            timestamp: confirmedAt,
        },
        {
            key: "prepared",
            label: "Preparee",
            icon: Package,
            completed: currentIdx > 2 || deliveryStatus === "delivered",
            active: deliveryStatus === "prepared",
            timestamp: preparedAt,
        },
        {
            key: "in_delivery",
            label: "En livraison",
            icon: Truck,
            completed: currentIdx > 3 || deliveryStatus === "delivered",
            active: deliveryStatus === "in_delivery",
            timestamp: shippedAt,
        },
        {
            key: "delivered",
            label: "Livree",
            icon: PackageCheck,
            completed: deliveryStatus === "delivered",
            active: false,
            timestamp: actualDeliveryDate ?? deliveredAt,
        },
    ];

    // Special statuses
    if (isCancelled) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800 border border-white/8">
                <XCircle size={14} className="text-red-400" />
                <span className="text-xs text-red-300 font-medium">Annulee</span>
            </div>
        );
    }

    if (isDisputed) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs text-red-300 font-medium">En litige</span>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {/* Compact mode: horizontal dots */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 group cursor-pointer"
                aria-expanded={expanded}
                aria-label="Voir le detail de la timeline"
            >
                <div className="flex items-center gap-1">
                    {steps.map((step, i) => (
                        <div key={step.key} className="flex items-center">
                            <div
                                className={`w-3 h-3 rounded-full transition-all ${
                                    step.completed
                                        ? "bg-emerald-400"
                                        : step.active
                                        ? "bg-amber-400 ring-2 ring-amber-400/30"
                                        : "bg-surface-700"
                                }`}
                                title={step.label}
                            />
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-2.5 h-0.5 ${
                                        step.completed ? "bg-emerald-400/40" : "bg-surface-700"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Delayed badge */}
                {(isDelayed || isOverdue) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/20">
                        <Clock size={9} />
                        Retard
                    </span>
                )}

                <ChevronDown
                    size={12}
                    className={`text-surface-500 transition-transform group-hover:text-white ${
                        expanded ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Expanded mode: vertical timeline */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 pl-1 space-y-0.5">
                            {steps.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.key} className="flex items-start gap-2.5">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                                    step.completed
                                                        ? "bg-emerald-500/15 text-emerald-400"
                                                        : step.active
                                                        ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                                                        : "bg-surface-800 text-surface-600"
                                                }`}
                                            >
                                                <Icon size={11} />
                                            </div>
                                            {i < steps.length - 1 && (
                                                <div
                                                    className={`w-px h-3 ${
                                                        step.completed
                                                            ? "bg-emerald-500/30"
                                                            : "bg-white/8"
                                                    }`}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pb-0.5">
                                            <p
                                                className={`text-[11px] font-medium leading-tight ${
                                                    step.completed
                                                        ? "text-emerald-400"
                                                        : step.active
                                                        ? "text-white"
                                                        : "text-surface-600"
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                            {step.timestamp && (
                                                <p className="text-[9px] text-surface-600">
                                                    {formatDateTime(step.timestamp)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Expected delivery info */}
                            {expectedDeliveryDate && deliveryStatus !== "delivered" && (
                                <p className="text-[10px] text-surface-500 pl-8 pt-1">
                                    Prevue : {formatDateTime(expectedDeliveryDate)}
                                </p>
                            )}

                            {/* Delayed badge in expanded */}
                            {isDelayed && (
                                <div className="pl-8 pt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-300 border border-red-500/20">
                                        <Clock size={9} />
                                        Livraison en retard
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
