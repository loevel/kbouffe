"use client";

import { CheckCircle2, Clock, ChefHat, Package, Truck, XCircle } from "lucide-react";

type OrderStatus =
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivering"
    | "delivered"
    | "completed"
    | "cancelled";

interface OrderTimelineProps {
    status: OrderStatus;
    createdAt: string;
    updatedAt?: string;
    compact?: boolean;
}

const STEPS: { status: OrderStatus; label: string; icon: any }[] = [
    { status: "pending",    label: "Reçue",       icon: Clock },
    { status: "confirmed",  label: "Confirmée",   icon: CheckCircle2 },
    { status: "preparing",  label: "Préparation", icon: ChefHat },
    { status: "ready",      label: "Prête",       icon: Package },
    { status: "delivering", label: "Livraison",   icon: Truck },
    { status: "delivered",  label: "Livrée",      icon: CheckCircle2 },
];

const STATUS_ORDER: Record<string, number> = {
    pending: 0, confirmed: 1, preparing: 2, ready: 3,
    delivering: 4, delivered: 5, completed: 5, cancelled: -1,
};

export function OrderTimeline({ status, createdAt, compact = false }: OrderTimelineProps) {
    if (status === "cancelled") {
        return (
            <div className="flex items-center gap-2 text-rose-500">
                <XCircle size={16} />
                <span className="text-sm font-medium">Commande annulée</span>
            </div>
        );
    }

    const currentIdx = STATUS_ORDER[status] ?? 0;

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {STEPS.slice(0, 5).map((step, i) => {
                    const done = i < currentIdx;
                    const active = i === currentIdx;
                    const Icon = step.icon;
                    return (
                        <div key={step.status} className="flex items-center">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                    done    ? "bg-emerald-500 text-white" :
                                    active  ? "bg-brand-500 text-white ring-2 ring-brand-300" :
                                              "bg-surface-100 dark:bg-surface-800 text-surface-400"
                                }`}
                                title={step.label}
                            >
                                <Icon size={12} />
                            </div>
                            {i < 4 && (
                                <div className={`w-4 h-0.5 ${done ? "bg-emerald-500" : "bg-surface-100 dark:bg-surface-800"}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0">
            {STEPS.map((step, i) => {
                const done = i < currentIdx;
                const active = i === currentIdx;
                const Icon = step.icon;
                return (
                    <div key={step.status} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    done    ? "bg-emerald-500 text-white" :
                                    active  ? "bg-brand-500 text-white shadow-md shadow-brand-500/30" :
                                              "bg-surface-100 dark:bg-surface-800 text-surface-400"
                                }`}
                            >
                                <Icon size={16} />
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-0.5 h-6 mt-1 ${done ? "bg-emerald-500" : "bg-surface-100 dark:bg-surface-800"}`} />
                            )}
                        </div>
                        <div className="pt-1.5 pb-2">
                            <p className={`text-sm font-medium leading-none ${active ? "text-brand-500" : done ? "text-surface-500 dark:text-surface-400" : "text-surface-400 dark:text-surface-600"}`}>
                                {step.label}
                            </p>
                            {active && (
                                <p className="text-xs text-surface-400 mt-0.5">En cours…</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
