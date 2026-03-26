"use client";

import { useState, useEffect } from "react";
import { Save, BarChart3, ExternalLink } from "lucide-react";
import { Card, Button, Input } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

export function TrackingPixelsForm() {
    const { restaurant, updateRestaurant, loading: dashboardLoading } = useDashboard();
    const { t } = useLocale();
    const [metaPixelId, setMetaPixelId] = useState("");
    const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (restaurant) {
            setMetaPixelId(restaurant.meta_pixel_id ?? "");
            setGoogleAnalyticsId(restaurant.google_analytics_id ?? "");
        }
    }, [restaurant]);

    const validateMetaPixelId = (id: string): boolean => {
        if (!id) return true; // Optional
        return /^\d{10,20}$/.test(id);
    };

    const validateGa4Id = (id: string): boolean => {
        if (!id) return true; // Optional
        return /^G-[A-Z0-9]{6,12}$/.test(id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedMeta = metaPixelId.trim();
        const trimmedGa = googleAnalyticsId.trim();

        if (trimmedMeta && !validateMetaPixelId(trimmedMeta)) {
            toast.error("Le Pixel ID Meta doit contenir uniquement des chiffres (10-20 caracteres)");
            return;
        }

        if (trimmedGa && !validateGa4Id(trimmedGa)) {
            toast.error("L'ID Google Analytics doit etre au format G-XXXXXXX");
            return;
        }

        setLoading(true);

        const { error } = await updateRestaurant({
            meta_pixel_id: trimmedMeta || null,
            google_analytics_id: trimmedGa || null,
        });

        if (error) {
            toast.error(`Erreur: ${error}`);
        } else {
            toast.success("Pixels de suivi mis a jour");
        }
        setLoading(false);
    };

    if (dashboardLoading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-48" />
                    <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
                    <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
                </div>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <div className="flex items-start gap-3 mb-6">
                    <BarChart3 size={20} className="text-brand-500 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-surface-900 dark:text-white">
                            Pixels & Analytics
                        </h3>
                        <p className="text-sm text-surface-500 mt-1">
                            Connectez vos pixels de retargeting pour suivre les conversions et recibler vos clients sur les reseaux sociaux.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Meta Pixel */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                            Meta Pixel ID (Facebook / Instagram)
                        </label>
                        <Input
                            type="text"
                            value={metaPixelId}
                            onChange={(e) => setMetaPixelId(e.target.value)}
                            placeholder="1234567890123456"
                            maxLength={20}
                        />
                        <p className="text-xs text-surface-400 flex items-center gap-1">
                            Trouvez votre Pixel ID dans{" "}
                            <a
                                href="https://business.facebook.com/events_manager"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:text-brand-600 inline-flex items-center gap-0.5"
                            >
                                Meta Events Manager <ExternalLink size={10} />
                            </a>
                        </p>
                        {metaPixelId && !validateMetaPixelId(metaPixelId.trim()) && (
                            <p className="text-xs text-red-500">
                                Format invalide. Le Pixel ID est un nombre de 10-20 chiffres.
                            </p>
                        )}
                    </div>

                    {/* Google Analytics 4 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                            Google Analytics 4 (Measurement ID)
                        </label>
                        <Input
                            type="text"
                            value={googleAnalyticsId}
                            onChange={(e) => setGoogleAnalyticsId(e.target.value.toUpperCase())}
                            placeholder="G-XXXXXXXXXX"
                            maxLength={14}
                        />
                        <p className="text-xs text-surface-400 flex items-center gap-1">
                            Trouvez votre ID dans{" "}
                            <a
                                href="https://analytics.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:text-brand-600 inline-flex items-center gap-0.5"
                            >
                                Google Analytics <ExternalLink size={10} />
                            </a>
                            {" "}→ Admin → Data Streams
                        </p>
                        {googleAnalyticsId && !validateGa4Id(googleAnalyticsId.trim()) && (
                            <p className="text-xs text-red-500">
                                Format invalide. L'ID doit etre au format G-XXXXXXX.
                            </p>
                        )}
                    </div>

                    {/* Info box */}
                    <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-brand-900 dark:text-brand-200 mb-2">
                            Comment ca marche ?
                        </h4>
                        <ul className="text-xs text-brand-700 dark:text-brand-300 space-y-1.5">
                            <li>Les scripts de tracking sont injectes automatiquement sur votre vitrine publique</li>
                            <li>Les evenements e-commerce sont suivis : vue produit, ajout au panier, achat</li>
                            <li>Vous pouvez creer des campagnes de retargeting sur Facebook/Instagram</li>
                            <li>Analysez le trafic de votre vitrine avec Google Analytics</li>
                        </ul>
                    </div>
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
