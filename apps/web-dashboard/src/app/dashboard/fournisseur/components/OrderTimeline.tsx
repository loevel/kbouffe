"use client";

/**
 * OrderTimeline -- Vertical timeline for each order
 * Steps: Pending -> Confirmed -> Prepared -> In delivery -> Delivered
 */

import { motion } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    Package,
    Truck,
    PackageCheck,
    XCircle,
    AlertTriangle,
} from "lucide-react";

interface OrderTimelineProps {
    deliveryStatus: string;
    createdAt: string;
    expectedDeliveryDate: string | null;
    actualDeliveryDate: string | null;
}

interface TimelineStep {
    key: string;
    label: string;
    icon: React.ElementType;
    completed: boolean;
    active: boolean;
    timestamp?: string;
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

const STATUS_ORDER = ["pending", "confirmed", "prepared", "in_delivery", "delivered"];

export function OrderTimeline({
    deliveryStatus,
    createdAt,
    expectedDeliveryDate,
    actualDeliveryDate,
}: OrderTimelineProps) {
    const isCancelled = deliveryStatus === "cancelled";
    const isDisputed = deliveryStatus === "disputed";

    const currentIdx = STATUS_ORDER.indexOf(deliveryStatus);

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
        },
        {
            key: "prepared",
            label: "Preparee",
            icon: Package,
            completed: currentIdx > 2 || deliveryStatus === "delivered",
            active: deliveryStatus === "prepared",
        },
        {
            key: "in_delivery",
            label: "En livraison",
            icon: Truck,
            completed: currentIdx > 3 || deliveryStatus === "delivered",
            active: deliveryStatus === "in_delivery",
        },
        {
            key: "delivered",
            label: "Livree",
            icon: PackageCheck,
            completed: deliveryStatus === "delivered",
            active: false,
            timestamp: actualDeliveryDate ?? undefined,
        },
    ];

    // Check on-time delivery
    let onTime: boolean | null = null;
    if (deliveryStatus === "delivered" && expectedDeliveryDate && actualDeliveryDate) {
        onTime = new Date(actualDeliveryDate) <= new Date(expectedDeliveryDate);
    }

    if (isCancelled) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800 border border-white/8">
                <XCircle size={16} className="text-red-400" />
                <span className="text-sm text-red-300 font-medium">Commande annulee</span>
            </div>
        );
    }

    if (isDisputed) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={16} className="text-red-400" />
                <span className="text-sm text-red-300 font-medium">En litige</span>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                    <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3"
                    >
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    step.completed
                                        ? "bg-emerald-500/15 text-emerald-400"
                                        : step.active
                                        ? "bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30"
                                        : "bg-surface-800 text-surface-600"
                                }`}
                            >
                                <Icon size={13} />
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-px h-4 ${
                                        step.completed ? "bg-emerald-500/30" : "bg-white/8"
                                    }`}
                                />
                            )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                            <p
                                className={`text-xs font-medium ${
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
                                <p className="text-[10px] text-surface-600">
                                    {formatDateTime(step.timestamp)}
                                </p>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {/* On-time badge */}
            {onTime !== null && (
                <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    onTime
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-red-500/10 text-red-300 border-red-500/20"
                }`}>
                    {onTime ? (
                        <><CheckCircle2 size={11} /> Livre a temps</>
                    ) : (
                        <><Clock size={11} /> Retard de livraison</>
                    )}
                </div>
            )}

            {/* Expected delivery */}
            {expectedDeliveryDate && deliveryStatus !== "delivered" && (
                <p className="text-[10px] text-surface-500 mt-1">
                    Livraison prevue : {formatDateTime(expectedDeliveryDate)}
                </p>
            )}
        </div>
    );
}
