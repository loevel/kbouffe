"use client";

import React from "react";

type StatCardProps = {
    label: string;
    value: string | number;
    description?: string;
};

export function ReportStatCard({ label, value, description }: StatCardProps) {
    return (
        <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 bg-white dark:bg-surface-900 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-semibold">
                {label}
            </p>
            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{value}</p>
            {description && (
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                    {description}
                </p>
            )}
        </div>
    );
}

export function ReportPlaceholder() {
    return (
        <div className="p-6 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 text-center text-surface-500 dark:text-surface-400">
            Module rapports prêt : branchez vos données pour afficher un tableau de bord (synthèse, top produits, séries temporelles).
        </div>
    );
}
