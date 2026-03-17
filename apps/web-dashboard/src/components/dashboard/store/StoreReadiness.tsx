"use client";

import { useState } from "react";
import { CircleCheck, CircleAlert, Pencil } from "lucide-react";
import { Card, Badge, Button } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { EditStoreProfileModal } from "./EditStoreProfileModal";

export function StoreReadiness() {
    const { restaurant, loading } = useDashboard();
    const { t } = useLocale();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (loading || !restaurant) {
        return (
            <Card>
                <div className="space-y-3 animate-pulse">
                    <div className="h-5 rounded bg-surface-200 dark:bg-surface-700 w-44" />
                    <div className="h-2 rounded bg-surface-200 dark:bg-surface-700" />
                    <div className="h-4 rounded bg-surface-200 dark:bg-surface-700 w-full" />
                </div>
            </Card>
        );
    }

    const checklist = [
        { key: "description", label: t.store.itemDescription, ok: Boolean(restaurant.description?.trim()) },
        { key: "address", label: t.store.itemAddress, ok: Boolean(restaurant.address?.trim()) },
        { key: "city", label: t.store.itemCity, ok: Boolean(restaurant.city?.trim()) },
        { key: "phone", label: t.store.itemPhone, ok: Boolean(restaurant.phone?.trim()) },
        { key: "published", label: t.store.itemPublished, ok: Boolean(restaurant.is_published) },
    ];

    const completed = checklist.filter((item) => item.ok).length;
    const total = checklist.length;
    const score = Math.round((completed / total) * 100);

    return (
        <>
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-surface-900 dark:text-white">{t.store.readinessTitle}</h3>
                    <Badge variant={score >= 80 ? "success" : score >= 50 ? "warning" : "danger"}>{score}%</Badge>
                </div>

                <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden mb-4">
                    <div className="h-full bg-brand-500 transition-all" style={{ width: `${score}%` }} />
                </div>

                <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                    {completed}/{total} {t.store.readinessDone}
                </p>

                <ul className="space-y-2">
                    {checklist.map((item) => (
                        <li key={item.key} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                {item.ok ? (
                                    <CircleCheck size={16} className="text-green-500" />
                                ) : (
                                    <CircleAlert size={16} className="text-amber-500" />
                                )}
                                <span className={item.ok ? "text-surface-700 dark:text-surface-300" : "text-surface-500 dark:text-surface-400"}>
                                    {item.label}
                                </span>
                            </div>
                            {!item.ok && item.key !== "published" && (
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                                >
                                    <Pencil size={12} />
                                    {t.common.edit}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </Card>

            <EditStoreProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
            />
        </>
    );
}
