"use client";

import { useState, useEffect } from "react";
import { Save, LayoutGrid, GalleryVertical, BookImage, Check } from "lucide-react";
import { Card, Button } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

const THEMES = [
    {
        id: "grid" as const,
        name: "Fast-Food",
        description: "Grille compacte avec gros boutons. Ideal pour commande rapide.",
        icon: LayoutGrid,
        preview: (
            <div className="grid grid-cols-2 gap-1.5 p-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-surface-200 dark:bg-surface-600 rounded-lg aspect-square flex flex-col">
                        <div className="flex-1 bg-surface-300 dark:bg-surface-500 rounded-t-lg" />
                        <div className="p-1.5 space-y-1">
                            <div className="h-1.5 bg-surface-300 dark:bg-surface-500 rounded w-3/4" />
                            <div className="h-1.5 bg-surface-300 dark:bg-surface-500 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: "luxury" as const,
        name: "Gastronomique",
        description: "Grandes photos, typographie elegante. Pour restaurants haut de gamme.",
        icon: BookImage,
        preview: (
            <div className="p-3 space-y-2">
                {[1, 2].map((i) => (
                    <div key={i}>
                        <div className="bg-surface-300 dark:bg-surface-500 rounded-lg aspect-[16/9]" />
                        <div className="mt-1.5 flex justify-between items-center px-0.5">
                            <div className="space-y-1">
                                <div className="h-1.5 bg-surface-300 dark:bg-surface-500 rounded w-16" />
                                <div className="h-1 bg-surface-200 dark:bg-surface-600 rounded w-24 italic" />
                            </div>
                            <div className="h-1.5 bg-surface-300 dark:bg-surface-500 rounded w-8" />
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: "story" as const,
        name: "Instagram",
        description: "Cards plein ecran avec texte en overlay. Moderne et audacieux.",
        icon: GalleryVertical,
        preview: (
            <div className="p-3 space-y-2">
                <div className="relative bg-surface-300 dark:bg-surface-500 rounded-2xl aspect-[4/5]">
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-surface-900/60 to-transparent rounded-b-2xl">
                        <div className="h-2 bg-white/80 rounded w-16 mb-1" />
                        <div className="h-1.5 bg-white/50 rounded w-10" />
                    </div>
                    <div className="absolute top-2 left-2 h-3 w-8 bg-red-400 rounded-full" />
                </div>
            </div>
        ),
    },
];

export function ThemePickerForm() {
    const { restaurant, updateRestaurant, loading: dashboardLoading } = useDashboard();
    const { t } = useLocale();
    const [selected, setSelected] = useState<"grid" | "luxury" | "story">("grid");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (restaurant) {
            setSelected((restaurant as any).theme_layout ?? "grid");
        }
    }, [restaurant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await updateRestaurant({
            theme_layout: selected,
        });

        if (error) {
            toast.error(`Erreur: ${error}`);
        } else {
            toast.success("Theme mis a jour");
        }
        setLoading(false);
    };

    if (dashboardLoading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-48" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-surface-200 dark:bg-surface-700 rounded-xl" />
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
                    Theme du menu
                </h3>
                <p className="text-sm text-surface-500 mb-6">
                    Choisissez le style visuel de votre vitrine. Le theme affecte la presentation des produits pour vos clients.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {THEMES.map((theme) => {
                        const isSelected = selected === theme.id;
                        const Icon = theme.icon;

                        return (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => setSelected(theme.id)}
                                className={`relative text-left rounded-xl border-2 transition-all overflow-hidden ${
                                    isSelected
                                        ? "border-brand-500 ring-2 ring-brand-500/20 shadow-lg"
                                        : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                                }`}
                            >
                                {/* Check badge */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-white" strokeWidth={3} />
                                    </div>
                                )}

                                {/* Preview */}
                                <div className="bg-surface-100 dark:bg-surface-800 aspect-[3/4]">
                                    {theme.preview}
                                </div>

                                {/* Info */}
                                <div className="p-3 border-t border-surface-200 dark:border-surface-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon size={16} className={isSelected ? "text-brand-500" : "text-surface-400"} />
                                        <span className="text-sm font-semibold text-surface-900 dark:text-white">
                                            {theme.name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-surface-500 leading-relaxed">
                                        {theme.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>
                        {t.common.save}
                    </Button>
                </div>
            </Card>
        </form>
    );
}
