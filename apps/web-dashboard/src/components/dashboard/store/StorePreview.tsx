"use client";

import { useState } from "react";
import { ExternalLink, ChefHat, Pencil } from "lucide-react";
import { Card, Badge, Button } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { EditStoreProfileModal } from "./EditStoreProfileModal";

export function StorePreview() {
    const { restaurant, loading } = useDashboard();
    const { t } = useLocale();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (loading || !restaurant) {
        return (
            <Card padding="none" className="overflow-hidden animate-pulse">
                <div className="h-32 bg-surface-200 dark:bg-surface-800" />
                <div className="px-6 pt-12 pb-6 space-y-3">
                    <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-48" />
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-32" />
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card padding="none" className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-600 relative">
                    <div className="absolute bottom-0 left-6 translate-y-1/2">
                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-900 border-4 border-white dark:border-surface-900 flex items-center justify-center shadow-lg">
                            <ChefHat size={28} className="text-brand-500" />
                        </div>
                    </div>
                </div>
                <div className="px-6 pt-12 pb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 group">
                                <h3 className="text-xl font-bold text-surface-900 dark:text-white">{restaurant.name}</h3>
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title={t.common?.edit || "Modifier"}
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                            <p className="text-sm text-surface-500 mt-0.5">{restaurant.city} · {restaurant.address}</p>
                        </div>
                        <Badge variant={restaurant.is_published ? "success" : "warning"}>
                            {restaurant.is_published ? t.store.published : t.store.unpublished}
                        </Badge>
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{restaurant.description}</p>
                    
                    <div className="flex items-center justify-between">
                        <a
                            href={`/r/${restaurant.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
                        >
                            <ExternalLink size={14} />
                            {t.store.viewOnline}
                        </a>
                        
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            leftIcon={<Pencil size={14} />}
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            {t.common?.edit || "Modifier"}
                        </Button>
                    </div>
                </div>
            </Card>

            <EditStoreProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
            />
        </>
    );
}
