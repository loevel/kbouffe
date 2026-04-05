"use client";

import { useState, useEffect } from "react";
import { Star, Zap } from "lucide-react";
import { Card, Button, formatCFA } from "@kbouffe/module-core/ui";
import { useLocale, useDashboard } from "@kbouffe/module-core/ui";

interface RestaurantMetrics {
    totalOrders: number;
    totalRevenue: number;
    avgRating: number;
    totalReviews: number;
    totalCustomers: number;
    avgOrderValue: number;
    completionRate: number;
    avgDeliveryTime: number;
}

export default function BusinessOverviewPage() {
    const { restaurant } = useDashboard();
    const [metrics, setMetrics] = useState<RestaurantMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch("/api/restaurant/metrics");
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data.metrics);
                }
            } catch (error) {
                console.error("Error fetching metrics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Vue d'ensemble affaires</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Métriques clés et aperçu de votre restaurant
                </p>
            </div>

            {/* Info de base */}
            <Card className="mb-6 p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white">{restaurant?.name}</h2>
                        <p className="text-surface-500 dark:text-surface-400 mt-1">{restaurant?.description}</p>
                    </div>
                </div>

                {/* Stats principales */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-20 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : metrics ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-surface-100 dark:border-surface-800 rounded-lg">
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                                Commandes
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">{metrics.totalOrders}</p>
                        </div>
                        <div className="p-4 border border-surface-100 dark:border-surface-800 rounded-lg">
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                                Chiffre d'affaires
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">
                                {formatCFA(metrics.totalRevenue)}
                            </p>
                        </div>
                        <div className="p-4 border border-surface-100 dark:border-surface-800 rounded-lg">
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                                Panier moyen
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">
                                {formatCFA(metrics.avgOrderValue)}
                            </p>
                        </div>
                        <div className="p-4 border border-surface-100 dark:border-surface-800 rounded-lg">
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                                Note
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-2xl font-bold text-surface-900 dark:text-white">
                                    {metrics.avgRating.toFixed(1)}
                                </span>
                                <Star size={18} className="fill-brand-400 text-brand-400" />
                            </div>
                        </div>
                        <div className="p-4 border border-surface-100 dark:border-surface-800 rounded-lg">
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                                Clients
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">{metrics.totalCustomers}</p>
                        </div>
                        <div className="p-4 border border-surface-100 dark:border-surface-800 rounded-lg">
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                                Taux complétion
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">{metrics.completionRate}%</p>
                        </div>
                    </div>
                ) : null}
            </Card>

            {/* Section premium features */}
            <Card className="p-6 border-l-4 border-brand-500 bg-brand-50/30 dark:bg-brand-900/10">
                <div className="flex items-start gap-4">
                    <Zap className="text-brand-500 flex-shrink-0 mt-1" size={24} />
                    <div className="flex-1">
                        <h3 className="font-bold text-surface-900 dark:text-white">Débloquez plus de fonctionnalités</h3>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                            Passez à un plan premium pour accéder à des outils avancés, l'analyse IA et les intégrations.
                        </p>
                        <Button className="mt-4 bg-brand-500 hover:bg-brand-600 text-white">
                            Voir les plans
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
}
