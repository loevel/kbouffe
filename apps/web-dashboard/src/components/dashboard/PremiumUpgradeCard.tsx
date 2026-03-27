"use client";

import { Crown, ArrowRight, Sparkles, Lock } from "lucide-react";
import { Card, Button } from "@kbouffe/module-core/ui";
import Link from "next/link";

interface PremiumUpgradeCardProps {
    feature: string;
    description?: string;
    /** "page" = full-page upsell, "inline" = small banner */
    variant?: "page" | "inline";
}

const BENEFITS: Record<string, string[]> = {
    "Pixels & Analytics": [
        "Integrez votre Meta Pixel et Google Analytics",
        "Suivez les conversions e-commerce automatiquement",
        "Optimisez vos campagnes publicitaires",
    ],
    "Themes": [
        "3 themes professionnels (Grille, Luxe, Story)",
        "Personnalisez l'apparence de votre vitrine",
        "Demarquez-vous de la concurrence",
    ],
    "Annonces": [
        "Affichez des bandeaux sur votre vitrine en temps reel",
        "3 niveaux : info, warning, urgent",
        "Programmation par date de debut/fin",
    ],
    "Social Publisher": [
        "Publiez sur Facebook, Instagram, TikTok & Telegram",
        "Generation de contenu par IA",
        "Programmation et historique des publications",
    ],
    "Conseiller IA": [
        "Analyse intelligente de votre restaurant",
        "Recommandations personnalisees pour augmenter vos revenus",
        "Posez des questions en langage naturel",
    ],
    "Calendrier de Contenu": [
        "Planifiez une semaine de publications en 1 clic",
        "Contenu adapte a chaque plateforme",
        "Suggestions basees sur votre menu",
    ],
    "Feed Produits": [
        "Synchronisez vos plats sur Instagram Shopping",
        "Compatible Facebook Commerce Manager & Google Merchant",
        "Mise a jour automatique toutes les 30 minutes",
    ],
};

/**
 * Generic upsell card shown when a premium feature is locked.
 */
export function PremiumUpgradeCard({ feature, description, variant = "page" }: PremiumUpgradeCardProps) {
    const benefits = BENEFITS[feature] ?? [];

    if (variant === "inline") {
        return (
            <div className="p-4 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                    <Lock size={14} className="text-amber-500" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        Fonctionnalite Premium
                    </span>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">
                    {description ?? `Activez le pack Premium Storefront pour debloquer "${feature}".`}
                </p>
                <Link href="/dashboard/marketplace">
                    <Button variant="outline" className="text-xs h-8">
                        <Crown size={12} className="mr-1.5 text-amber-500" />
                        Voir les offres
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <Card>
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-orange-500/25">
                    <Crown size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                    {feature}
                </h3>
                <p className="text-sm text-surface-500 max-w-md mx-auto mb-6">
                    {description ??
                        "Cette fonctionnalite est disponible avec le pack Vitrine Premium. Debloquez-la pour offrir une experience professionnelle a vos clients."}
                </p>

                {benefits.length > 0 && (
                    <div className="text-left max-w-sm mx-auto space-y-2 mb-6 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Sparkles size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-surface-600 dark:text-surface-400">{b}</span>
                            </div>
                        ))}
                    </div>
                )}

                <Link href="/dashboard/marketplace">
                    <Button leftIcon={<Crown size={16} />}>
                        Debloquer avec Premium
                        <ArrowRight size={14} className="ml-1" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
