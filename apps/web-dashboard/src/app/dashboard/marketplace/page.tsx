"use client";

import { useEffect, useState } from "react";
import { Star, Megaphone, TrendingUp, CheckCircle2, Crown, Calendar, Image, Heart, Share2, Package, X, AlertCircle, CheckCircle, MapPin, Sparkles, Brain, Zap } from "lucide-react";
import { Button, Card } from "@kbouffe/module-core/ui";
import { AnimatePresence, motion } from "framer-motion";

const ICON_MAP: Record<string, any> = {
    Star, Megaphone, TrendingUp, Crown, Calendar, Image, Heart, Share2, Package, MapPin, Sparkles, Brain, Zap,
};

interface MarketplaceService {
    id: string;
    name: string;
    description: string | null;
    category: string;
    price: number;
    duration_days: number | null;
    features: string[];
    icon: string;
    is_active: boolean;
    sort_order: number;
}

export default function MarketplacePage() {
    const [packs, setPacks] = useState<MarketplaceService[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<MarketplaceService | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch restaurant info for current user
                const restaurantRes = await fetch("/api/restaurant");
                if (restaurantRes.ok) {
                    const restaurantData = await restaurantRes.json();
                    setRestaurantId(restaurantData.id);
                }

                // Fetch packs
                const response = await fetch("/api/marketplace/services");
                if (response.ok) {
                    const data = await response.json();
                    setPacks(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePurchase = async (pack: MarketplaceService) => {
        if (!restaurantId) {
            setPurchaseStatus({ type: "error", message: "Restaurant non trouvé" });
            return;
        }

        setPurchasing(true);
        setPurchaseStatus(null);

        try {
            const response = await fetch("/api/marketplace/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceId: pack.id,
                    restaurantId: restaurantId,
                }),
            });

            if (response.ok) {
                setPurchaseStatus({
                    type: "success",
                    message: `${pack.name} activé avec succès ! ✨`,
                });
                setSelectedPack(null);
                // Optionally refresh packs or show purchase confirmation
                setTimeout(() => setPurchaseStatus(null), 5000);
            } else {
                const error = await response.json();
                setPurchaseStatus({
                    type: "error",
                    message: error.error || "Erreur lors de l'achat",
                });
            }
        } catch (error) {
            setPurchaseStatus({
                type: "error",
                message: "Erreur serveur",
            });
        } finally {
            setPurchasing(false);
        }
    };

    // Fallback mock data in case API fails
    const defaultPacks = [
        // ── Essentials ──
        {
            id: "1",
            name: "Pack Visibilité Top 3",
            description: "Apparaissez dans le Top 3 des recherches de votre ville et attirez plus de clients.",
            price: 15000,
            duration_days: 7,
            category: "visibility",
            features: ["Position garantie dans le Top 3", "Badge Sponsorisé visible", "Jusqu'à 3x plus de visites"],
            icon: "Star",
            is_active: true,
            sort_order: 1,
        },
        {
            id: "2",
            name: "Campagne Push SMS",
            description: "Relancez vos anciens clients et informez-les de vos nouvelles offres par SMS.",
            price: 25000,
            duration_days: null,
            category: "communication",
            features: ["Envoi à 1000 clients locaux", "Message personnalisé", "Lien direct vers votre menu"],
            icon: "Megaphone",
            is_active: true,
            sort_order: 2,
        },
        {
            id: "3",
            name: "Pack Boost Continu",
            description: "La solution ultime pour maximiser vos commandes tous les jours.",
            price: 50000,
            duration_days: 30,
            category: "visibility",
            features: ["Visibilité Top 3 pendant 1 mois", "1 Campagne SMS incluse", "Support marketing dédié"],
            icon: "TrendingUp",
            is_active: true,
            sort_order: 3,
        },
    ];

    const displayPacks = packs.length > 0 ? packs : defaultPacks;

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            visibility: "Visibilité",
            communication: "Communication",
            advertising: "Publicité",
            analytics: "Analytics",
            premium: "Premium",
            ai: "Intelligence Artificielle",
            ai_bundle: "Bundle IA",
        };
        return labels[category] || category;
    };

    const getColorByCategory = (category: string) => {
        const colors: Record<string, { color: string; bgColor: string; buttonVariant: "primary" | "outline" }> = {
            visibility: { color: "text-amber-500", bgColor: "bg-amber-500/10", buttonVariant: "primary" },
            communication: { color: "text-blue-500", bgColor: "bg-blue-500/10", buttonVariant: "outline" },
            advertising: { color: "text-pink-500", bgColor: "bg-pink-500/10", buttonVariant: "primary" },
            analytics: { color: "text-yellow-500", bgColor: "bg-yellow-500/10", buttonVariant: "outline" },
            premium: { color: "text-amber-500", bgColor: "bg-gradient-to-br from-amber-500/10 to-orange-500/10", buttonVariant: "primary" },
            ai: { color: "text-purple-500", bgColor: "bg-purple-500/10", buttonVariant: "primary" },
            ai_bundle: { color: "text-violet-500", bgColor: "bg-gradient-to-br from-violet-500/10 to-purple-500/10", buttonVariant: "primary" },
        };
        return colors[category] || { color: "text-brand-500", bgColor: "bg-brand-500/10", buttonVariant: "primary" as const };
    };

    const getIconComponent = (iconName: string) => {
        return ICON_MAP[iconName] || Package;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto pt-8">
                <h1 className="text-3xl md:text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                    Boutique & <span className="text-brand-500">Services</span>
                </h1>
                <p className="text-surface-500 mt-4 text-lg">
                    Boostez vos ventes et développez votre restaurant avec nos packs de visibilité et outils marketing conçus pour vous.
                </p>
            </div>

            {/* Quick Comparison Banner */}
            {!loading && displayPacks.length > 0 && (
                <div className="bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border border-brand-500/20 rounded-2xl p-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="font-black text-lg mb-3">💰 Budget limité ?</h3>
                            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                                Commencez avec <strong>Visibilité Top 3</strong> ou <strong>SMS</strong> pour tester l'efficacité.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-black text-lg mb-3">🚀 Veut croître vite ?</h3>
                            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                                Optez pour <strong>Boost Continu</strong> ou <strong>Premium Dominance</strong> pour la performance maximale.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-black text-lg mb-3">👥 Fidéliser clients ?</h3>
                            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                                Combinez <strong>Avis & Réputation</strong>, <strong>Fidélité+</strong> et <strong>Social Amplifier</strong>.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-black text-lg mb-3">🤖 Automatiser avec l'IA ?</h3>
                            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                                Le <strong>Pack IA Complet</strong> regroupe marketing, photos et conseils IA. Economisez 30 000 FCFA.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-96 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />)}
                </div>
            )}

            {/* Packs Grid - Organized by sections */}
            {!loading && displayPacks.length > 0 && (
                <>
                    {/* Essentials Section */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">📌 Packs Essentiels</h2>
                            <p className="text-surface-500 text-sm mt-2">Les bases pour démarrer et booster vos ventes</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {displayPacks.filter(p => [1, 2, 3].includes(p.sort_order)).map((pack) => {
                                const colors = getColorByCategory(pack.category);
                                const IconComponent = getIconComponent(pack.icon);
                                const durationText = pack.duration_days ? `${pack.duration_days} jour${pack.duration_days > 1 ? 's' : ''}` : 'Permanent';
                                return (
                                    <Card key={pack.id} className="relative flex flex-col p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-surface-200 dark:border-surface-800">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors.bgColor} ${colors.color}`}>
                                            <IconComponent className="w-7 h-7" />
                                        </div>

                                        <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                                        <p className="text-surface-500 text-sm mb-6 flex-1">{pack.description}</p>

                                        <div className="mb-6">
                                            <span className="text-3xl font-black">{pack.price.toLocaleString()}</span>
                                            <span className="text-surface-500 text-sm ml-1">FCFA / {durationText}</span>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            {(pack.features || []).map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <Button
                                                onClick={() => setSelectedPack(pack)}
                                                variant={colors.buttonVariant}
                                                className="w-full py-6 text-base rounded-xl font-bold shadow-lg shadow-brand-500/20"
                                            >
                                                Acheter ce pack
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* Premium Section */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">👑 Packs Premium</h2>
                            <p className="text-surface-500 text-sm mt-2">Dominez votre marché avec des solutions haut de gamme</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {displayPacks.filter(p => [4, 5, 6].includes(p.sort_order)).map((pack) => {
                                const colors = getColorByCategory(pack.category);
                                const IconComponent = getIconComponent(pack.icon);
                                const durationText = pack.duration_days ? `${pack.duration_days} jour${pack.duration_days > 1 ? 's' : ''}` : 'Permanent';
                                return (
                                    <Card key={pack.id} className="relative flex flex-col p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-surface-200 dark:border-surface-800">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors.bgColor} ${colors.color}`}>
                                            <IconComponent className="w-7 h-7" />
                                        </div>

                                        <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                                        <p className="text-surface-500 text-sm mb-6 flex-1">{pack.description}</p>

                                        <div className="mb-6">
                                            <span className="text-3xl font-black">{pack.price.toLocaleString()}</span>
                                            <span className="text-surface-500 text-sm ml-1">FCFA / {durationText}</span>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            {(pack.features || []).map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <Button
                                                onClick={() => setSelectedPack(pack)}
                                                variant={colors.buttonVariant}
                                                className="w-full py-6 text-base rounded-xl font-bold shadow-lg shadow-brand-500/20"
                                            >
                                                Acheter ce pack
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* Engagement Section */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">💎 Packs Engagement</h2>
                            <p className="text-surface-500 text-sm mt-2">Fidélisez vos clients et augmentez vos avis</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {displayPacks.filter(p => [7, 8, 9].includes(p.sort_order)).map((pack) => {
                                const colors = getColorByCategory(pack.category);
                                const IconComponent = getIconComponent(pack.icon);
                                const durationText = pack.duration_days ? `${pack.duration_days} jour${pack.duration_days > 1 ? 's' : ''}` : 'Permanent';
                                return (
                                    <Card key={pack.id} className="relative flex flex-col p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-surface-200 dark:border-surface-800">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors.bgColor} ${colors.color}`}>
                                            <IconComponent className="w-7 h-7" />
                                        </div>

                                        <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                                        <p className="text-surface-500 text-sm mb-6 flex-1">{pack.description}</p>

                                        <div className="mb-6">
                                            <span className="text-3xl font-black">{pack.price.toLocaleString()}</span>
                                            <span className="text-surface-500 text-sm ml-1">FCFA / {durationText}</span>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            {(pack.features || []).map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <Button
                                                onClick={() => setSelectedPack(pack)}
                                                variant={colors.buttonVariant}
                                                className="w-full py-6 text-base rounded-xl font-bold shadow-lg shadow-brand-500/20"
                                            >
                                                Acheter ce pack
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* Advanced Solutions Section (sort_order 10) */}
                    {displayPacks.filter(p => p.sort_order === 10).length > 0 && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">🚀 Solutions Avancées</h2>
                                <p className="text-surface-500 text-sm mt-2">Services spécialisés pour transformer votre présence digitale</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {displayPacks.filter(p => p.sort_order === 10).map((pack) => {
                                    const colors = getColorByCategory(pack.category);
                                    const IconComponent = getIconComponent(pack.icon);
                                    const durationText = pack.duration_days ? `${pack.duration_days} jour${pack.duration_days > 1 ? 's' : ''}` : 'Permanent';
                                    return (
                                        <Card key={pack.id} className="relative flex flex-col p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-surface-200 dark:border-surface-800">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors.bgColor} ${colors.color}`}>
                                                <IconComponent className="w-7 h-7" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                                            <p className="text-surface-500 text-sm mb-6 flex-1">{pack.description}</p>
                                            <div className="mb-6">
                                                <span className="text-3xl font-black">{pack.price.toLocaleString()}</span>
                                                <span className="text-surface-500 text-sm ml-1">FCFA / {durationText}</span>
                                            </div>
                                            <div className="space-y-3 mb-8">
                                                {(pack.features || []).map((feature, idx) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-auto">
                                                <Button
                                                    onClick={() => setSelectedPack(pack)}
                                                    variant={colors.buttonVariant}
                                                    className="w-full py-6 text-base rounded-xl font-bold shadow-lg shadow-brand-500/20"
                                                >
                                                    Acheter ce pack
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* IA & Automatisation Section (sort_order 11-14) */}
                    {displayPacks.filter(p => p.sort_order >= 11).length > 0 && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">🤖 IA & Automatisation</h2>
                                <p className="text-surface-500 text-sm mt-2">Propulsez votre restaurant avec l'intelligence artificielle Gemini</p>
                            </div>

                            {/* Hero banner for Pack IA Complet */}
                            {(() => {
                                const bundlePack = displayPacks.find(p => p.sort_order === 14);
                                if (!bundlePack) return null;
                                return (
                                    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 md:p-10 text-white shadow-2xl shadow-purple-500/20">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                                        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                                <Zap className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-2xl font-black">{bundlePack.name}</h3>
                                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                                                        -30 000 FCFA
                                                    </span>
                                                </div>
                                                <p className="text-white/80 text-sm max-w-xl">{bundlePack.description}</p>
                                                <div className="flex flex-wrap gap-3 mt-4">
                                                    {(bundlePack.features || []).slice(0, 4).map((f, i) => (
                                                        <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <div>
                                                    <span className="text-sm text-white/60 line-through">180 000</span>
                                                    <span className="text-3xl font-black ml-2">{bundlePack.price.toLocaleString()}</span>
                                                    <span className="text-sm text-white/60 ml-1">FCFA/mois</span>
                                                </div>
                                                <Button
                                                    onClick={() => setSelectedPack(bundlePack)}
                                                    className="bg-white text-purple-700 hover:bg-white/90 font-black px-8 py-3 rounded-xl shadow-lg"
                                                >
                                                    Tout débloquer
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Individual AI packs (sort_order 11-13) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {displayPacks.filter(p => p.sort_order >= 11 && p.sort_order <= 13).map((pack) => {
                                    const colors = getColorByCategory(pack.category);
                                    const IconComponent = getIconComponent(pack.icon);
                                    const durationText = pack.duration_days ? `${pack.duration_days} jour${pack.duration_days > 1 ? 's' : ''}` : 'Permanent';
                                    return (
                                        <Card key={pack.id} className="relative flex flex-col p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-purple-200 dark:border-purple-500/20">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors.bgColor} ${colors.color}`}>
                                                <IconComponent className="w-7 h-7" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                                            <p className="text-surface-500 text-sm mb-6 flex-1">{pack.description}</p>
                                            <div className="mb-6">
                                                <span className="text-3xl font-black">{pack.price.toLocaleString()}</span>
                                                <span className="text-surface-500 text-sm ml-1">FCFA / {durationText}</span>
                                            </div>
                                            <div className="space-y-3 mb-8">
                                                {(pack.features || []).map((feature, idx) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-auto">
                                                <Button
                                                    onClick={() => setSelectedPack(pack)}
                                                    className="w-full py-6 text-base rounded-xl font-bold bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-500/20"
                                                >
                                                    Activer l'IA
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Purchase Confirmation Modal */}
            <AnimatePresence>
                {selectedPack && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSelectedPack(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-8 text-white relative">
                                <button
                                    onClick={() => setSelectedPack(null)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X size={18} />
                                </button>
                                <h2 className="text-2xl font-black">Confirmer l'achat</h2>
                                <p className="text-white/80 text-sm mt-1">Activez ce pack pour votre restaurant</p>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6">
                                {/* Pack Summary */}
                                <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getColorByCategory(selectedPack.category).bgColor} ${getColorByCategory(selectedPack.category).color}`}>
                                            {(() => {
                                                const IconComponent = getIconComponent(selectedPack.icon);
                                                return IconComponent ? <IconComponent size={24} /> : null;
                                            })()}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-lg">{selectedPack.name}</h3>
                                            <p className="text-sm text-surface-500 mt-1">{selectedPack.description}</p>
                                        </div>
                                    </div>

                                    {/* Price and Duration */}
                                    <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-3xl font-black text-brand-500">
                                                {selectedPack.price.toLocaleString()}
                                            </span>
                                            <span className="text-surface-500 text-sm">
                                                FCFA {selectedPack.duration_days ? `/ ${selectedPack.duration_days} jour${selectedPack.duration_days > 1 ? 's' : ''}` : '/ Permanent'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Features Preview */}
                                <div>
                                    <h4 className="font-bold text-sm text-surface-500 uppercase mb-3">Inclus dans ce pack :</h4>
                                    <ul className="space-y-2">
                                        {(selectedPack.features || []).slice(0, 3).map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {(selectedPack.features?.length || 0) > 3 && (
                                            <li className="text-xs text-surface-400 italic">+ {(selectedPack.features?.length || 0) - 3} autres fonctionnalités</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Status Messages */}
                                {purchaseStatus && (
                                    <div
                                        className={`rounded-lg p-4 flex items-start gap-3 ${
                                            purchaseStatus.type === "success"
                                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                        }`}
                                    >
                                        {purchaseStatus.type === "success" ? (
                                            <CheckCircle size={18} className="shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        )}
                                        <span className="text-sm font-medium">{purchaseStatus.message}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 p-6 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedPack(null)}
                                    className="flex-1 rounded-xl"
                                    disabled={purchasing}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={() => handlePurchase(selectedPack)}
                                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-500/20"
                                    disabled={purchasing}
                                >
                                    {purchasing ? "Traitement..." : "Confirmer l'achat"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Information Banner */}
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-6 text-center mt-12">
                <h3 className="text-brand-600 dark:text-brand-400 font-bold mb-2">Besoin d'un accompagnement sur mesure ?</h3>
                <p className="text-brand-600/80 dark:text-brand-400/80 text-sm mb-4">
                    Notre équipe d'experts peut créer une stratégie marketing adaptée à votre restaurant.
                </p>
                <Button variant="outline" className="border-brand-500 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white">
                    Contacter notre équipe
                </Button>
            </div>
        </div>
    );
}
