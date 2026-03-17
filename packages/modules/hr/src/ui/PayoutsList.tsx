"use client";

import { Card, Badge, useLocale, formatCFA, formatDate } from "@kbouffe/module-core/ui";
import { usePayouts } from "./hooks";

export function PayoutsList() {
    const { t } = useLocale();
    const { payouts, isLoading } = usePayouts();

    if (isLoading && !payouts.length) {
        return (
            <Card padding="none">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 animate-pulse">
                    <div className="h-4 w-32 bg-surface-200 dark:bg-surface-700 rounded mb-2" />
                    <div className="h-3 w-48 bg-surface-100 dark:bg-surface-800 rounded" />
                </div>
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                <h3 className="font-semibold text-surface-900 dark:text-white">{t.finances.payouts}</h3>
                <p className="text-sm text-surface-500 mt-0.5">{t.finances.payoutsDesc}</p>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {payouts.map((payout) => (
                    <div key={payout.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-surface-900 dark:text-white">{formatCFA(payout.amount)}</p>
                            <p className="text-sm text-surface-500 mt-0.5">
                                {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                            </p>
                        </div>
                        <div className="text-right">
                            <Badge variant={payout.status === "paid" ? "success" : payout.status === "pending" ? "warning" : "danger"}>
                                {payout.status === "paid" ? t.finances.paid : payout.status === "pending" ? t.finances.pending : payout.status}
                            </Badge>
                            {payout.paid_at && (
                                <p className="text-xs text-surface-500 mt-1">{t.finances.paidOn}{formatDate(payout.paid_at)}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
