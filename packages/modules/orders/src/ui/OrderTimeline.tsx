"use client";

import { Check, Clock, ChefHat, Package, CircleCheck, XCircle, Truck } from "lucide-react";
import type { OrderStatus } from "../lib/types";
import { cn, useLocale } from "@kbouffe/module-core/ui";

const steps: { status: OrderStatus; icon: React.ReactNode; color: string }[] = [
    { status: "pending", icon: <Clock size={16} />, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
    { status: "accepted", icon: <Check size={16} />, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
    { status: "preparing", icon: <ChefHat size={16} />, color: "text-brand-500 bg-brand-100 dark:bg-brand-900/30" },
    { status: "ready", icon: <Package size={16} />, color: "text-green-500 bg-green-100 dark:bg-green-900/30" },
    { status: "delivering", icon: <Truck size={16} />, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
    { status: "delivered", icon: <CircleCheck size={16} />, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
];

const statusOrder: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "delivering", "delivered"];

interface OrderTimelineProps {
    currentStatus: OrderStatus;
    createdAt: string;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
    const { t } = useLocale();
    if (currentStatus === "cancelled" || currentStatus === "refunded") {
        const isRefunded = currentStatus === "refunded";
        return (
            <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl border",
                isRefunded ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30"
            )}>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isRefunded ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500" : "bg-red-100 dark:bg-red-900/30 text-red-500"
                )}>
                    {isRefunded ? <Clock size={16} /> : <XCircle size={16} />}
                </div>
                <div>
                    <p className={cn(
                        "font-medium",
                        isRefunded ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"
                    )}>{isRefunded ? t.orders.orderRefunded : t.orders.orderCancelled}</p>
                    <p className={cn(
                        "text-sm",
                        isRefunded ? "text-amber-500 dark:text-amber-400/70" : "text-red-500 dark:text-red-400/70"
                    )}>{isRefunded ? t.orders.orderRefundedDesc : t.orders.orderCancelledDesc}</p>
                </div>
            </div>
        );
    }

    const currentIndex = statusOrder.indexOf(currentStatus);

    return (
        <div className="space-y-0">
            {steps.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.status} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    isCompleted ? step.color : "bg-surface-100 dark:bg-surface-800 text-surface-400"
                                )}
                            >
                                {step.icon}
                            </div>
                            {!isLast && (
                                <div
                                    className={cn(
                                        "w-0.5 h-8",
                                        isCompleted && !isCurrent ? "bg-green-300 dark:bg-green-700" : "bg-surface-200 dark:bg-surface-700"
                                    )}
                                />
                            )}
                        </div>
                        <div className="pt-1 pb-4">
                            <p className={cn(
                                "text-sm font-medium",
                                isCompleted ? "text-surface-900 dark:text-white" : "text-surface-400 dark:text-surface-500"
                            )}>
                                {t.orders[step.status]}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
