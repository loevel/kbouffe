"use client";

import { useState } from "react";
import { Rss, Copy, Check, ExternalLink } from "lucide-react";
import { Card, Button } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

export function ProductFeedCard() {
    const { restaurant, loading } = useDashboard();
    const [copied, setCopied] = useState(false);

    if (loading || !restaurant) {
        return (
            <Card>
                <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-40" />
                    <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
                </div>
            </Card>
        );
    }

    const slug = restaurant.slug;
    const feedUrl = `https://kbouffe.com/api/store/${slug}/product-feed.xml`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(feedUrl);
            setCopied(true);
            toast.success("URL copiee !");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Impossible de copier");
        }
    };

    return (
        <Card>
            <div className="flex items-start gap-3 mb-4">
                <Rss size={20} className="text-brand-500 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">
                        Feed produits (Instagram Shopping / Google)
                    </h3>
                    <p className="text-sm text-surface-500 mt-1">
                        Copiez cette URL et collez-la dans votre Facebook Commerce Manager
                        pour synchroniser automatiquement vos plats sur Instagram Shopping.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2.5 text-sm font-mono text-surface-600 dark:text-surface-400 truncate">
                    {feedUrl}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                >
                    {copied ? "Copie" : "Copier"}
                </Button>
                <a
                    href={feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                    <ExternalLink size={16} />
                </a>
            </div>

            <div className="mt-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg p-3 text-xs text-surface-500 space-y-1.5">
                <p><strong>Facebook :</strong> Commerce Manager → Catalogues → Ajouter des articles → Flux de donnees → Coller l'URL</p>
                <p><strong>Google :</strong> Merchant Center → Produits → Flux → Ajouter un flux → URL planifiee → Coller l'URL</p>
                <p>Le flux se met a jour automatiquement quand vous modifiez vos produits.</p>
            </div>
        </Card>
    );
}
