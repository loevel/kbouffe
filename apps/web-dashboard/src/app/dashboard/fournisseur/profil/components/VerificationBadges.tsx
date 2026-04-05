"use client";

/**
 * VerificationBadges -- Badges de verification + Upgrade prompts
 *
 * Badges:
 * - Verified seller (always if KYC approved)
 * - Certified organic (if is_organic products > 50%)
 * - Fast delivery (if delivery_rate > 95%)
 * - Responsive (if response_time < 2h)
 * - Highly rated (if rating > 4.5)
 *
 * Upgrade prompt if tier = "free" -> "basic", or "basic" -> "premium"
 */

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    Leaf,
    Zap,
    MessageCircle,
    Star,
    Crown,
    ArrowRight,
    TrendingUp,
    Shield,
    Sparkles,
    BarChart3,
    Headphones,
    Eye,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import type { SupplierProfile } from "../../SupplierContext";

// ── Types ──────────────────────────────────────────────────────────────────

interface BadgeConfig {
    id: string;
    label: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    description: string;
    check: (supplier: SupplierProfile, metrics: BadgeMetrics) => number; // 0-100 progress
}

interface BadgeMetrics {
    organic_pct: number;
    delivery_rate: number;
    response_time_hours: number;
    rating: number;
}

interface UpgradeTier {
    from: string;
    to: string;
    title: string;
    price: string;
    benefits: string[];
}

// ── Mock metrics (fallback) ───────────────────────────────────────────────

const MOCK_METRICS: BadgeMetrics = {
    organic_pct: 35,
    delivery_rate: 92,
    response_time_hours: 1.5,
    rating: 4.3,
};

// ── Badge configurations ──────────────────────────────────────────────────

const BADGES: BadgeConfig[] = [
    {
        id: "verified_seller",
        label: "Vendeur verifie",
        icon: CheckCircle2,
        iconColor: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/25",
        description: "Compte valide par l'equipe KBouffe",
        check: (s) => (s.kyc_status === "approved" ? 100 : 0),
    },
    {
        id: "certified_organic",
        label: "Certifie bio",
        icon: Leaf,
        iconColor: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/25",
        description: "Plus de 50% de produits biologiques",
        check: (_s, m) => Math.min(100, (m.organic_pct / 50) * 100),
    },
    {
        id: "fast_delivery",
        label: "Livraison rapide",
        icon: Zap,
        iconColor: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/25",
        description: "Taux de livraison a temps > 95%",
        check: (_s, m) => Math.min(100, (m.delivery_rate / 95) * 100),
    },
    {
        id: "responsive",
        label: "Reactif",
        icon: MessageCircle,
        iconColor: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/25",
        description: "Temps de reponse moyen < 2h",
        check: (_s, m) => {
            if (m.response_time_hours <= 0) return 0;
            if (m.response_time_hours <= 2) return 100;
            // Inverse scale: further from 2h = less progress
            return Math.max(0, Math.min(100, (2 / m.response_time_hours) * 100));
        },
    },
    {
        id: "highly_rated",
        label: "Tres bien note",
        icon: Star,
        iconColor: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/25",
        description: "Note moyenne superieure a 4.5/5",
        check: (_s, m) => Math.min(100, (m.rating / 4.5) * 100),
    },
];

// ── Upgrade configurations ────────────────────────────────────────────────

const UPGRADES: Record<string, UpgradeTier> = {
    free: {
        from: "free",
        to: "Basic",
        title: "Passez au plan Basic",
        price: "5 000 FCFA/mois",
        benefits: [
            "Mise en avant dans les resultats de recherche",
            "Analytics detailles sur vos ventes",
            "Support prioritaire par email",
            "Badge 'Basic' sur votre profil",
            "Jusqu'a 50 produits",
        ],
    },
    basic: {
        from: "basic",
        to: "Premium",
        title: "Passez au plan Premium",
        price: "15 000 FCFA/mois",
        benefits: [
            "Position premium dans les recherches",
            "Analytics avances + rapports export",
            "Support prioritaire telephone + email",
            "Badge 'Premium' dore sur votre profil",
            "Produits illimites",
            "Promotions et offres speciales",
        ],
    },
};

// ── Badge component ───────────────────────────────────────────────────────

function BadgeItem({
    config,
    progress,
    delay,
}: {
    config: BadgeConfig;
    progress: number;
    delay: number;
}) {
    const Icon = config.icon;
    const isEarned = progress >= 100;
    const progressPct = Math.round(Math.min(100, Math.max(0, progress)));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isEarned
                    ? `${config.bgColor} ${config.borderColor}`
                    : "bg-surface-800/40 border-white/5"
            }`}
        >
            {/* Icon */}
            <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isEarned
                        ? `${config.bgColor} ${config.borderColor} border`
                        : "bg-surface-800 border border-white/8"
                }`}
            >
                <Icon
                    size={16}
                    className={isEarned ? config.iconColor : "text-surface-600"}
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-xs font-semibold ${
                            isEarned ? "text-white" : "text-surface-400"
                        }`}
                    >
                        {config.label}
                    </span>
                    {isEarned && (
                        <CheckCircle2 size={12} className={config.iconColor} />
                    )}
                </div>
                <p className={`text-[10px] mt-0.5 ${isEarned ? "text-surface-400" : "text-surface-600"}`}>
                    {config.description}
                </p>

                {/* Progress bar for non-earned badges */}
                {!isEarned && (
                    <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ delay: delay + 0.2, duration: 0.6 }}
                                className="h-full rounded-full bg-surface-500"
                            />
                        </div>
                        <span className="text-[9px] font-semibold text-surface-600 shrink-0">
                            {progressPct}%
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ── Upgrade card ──────────────────────────────────────────────────────────

function UpgradeCard({ tier }: { tier: UpgradeTier }) {
    const isPremium = tier.to === "Premium";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border overflow-hidden ${
                isPremium
                    ? "bg-gradient-to-br from-amber-500/10 via-surface-900 to-purple-500/10 border-amber-500/20"
                    : "bg-gradient-to-br from-brand-500/10 via-surface-900 to-blue-500/10 border-brand-500/20"
            }`}
        >
            <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    {isPremium ? (
                        <Crown size={18} className="text-amber-400" />
                    ) : (
                        <Sparkles size={18} className="text-brand-400" />
                    )}
                    <h3 className="text-sm font-bold text-white">{tier.title}</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-2xl font-extrabold ${isPremium ? "text-amber-300" : "text-brand-300"}`}>
                        {tier.price.split("/")[0]}
                    </span>
                    <span className="text-xs text-surface-500">
                        /{tier.price.split("/")[1]}
                    </span>
                </div>

                <ul className="space-y-2 mb-5">
                    {tier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-surface-300">
                            <CheckCircle2
                                size={13}
                                className={`shrink-0 mt-0.5 ${isPremium ? "text-amber-400" : "text-brand-400"}`}
                            />
                            {benefit}
                        </li>
                    ))}
                </ul>

                <a
                    href="/dashboard/fournisseur/billing"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isPremium
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                            : "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                    }`}
                >
                    Upgrade now
                    <ArrowRight size={14} />
                </a>
            </div>
        </motion.div>
    );
}

// ── Main component ────────────────────────────────────────────────────────

export function VerificationBadges({ supplier }: { supplier: SupplierProfile }) {
    const [metrics, setMetrics] = useState<BadgeMetrics>(MOCK_METRICS);

    // Try to fetch real metrics
    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await authFetch("/api/marketplace/suppliers/me/metrics");
                if (res.ok) {
                    const data = await res.json();
                    const m = data.metrics ?? data;
                    setMetrics({
                        organic_pct: m.organic_pct ?? MOCK_METRICS.organic_pct,
                        delivery_rate: m.delivery_rate ?? MOCK_METRICS.delivery_rate,
                        response_time_hours: m.response_time?.current ?? MOCK_METRICS.response_time_hours,
                        rating: m.ratings?.current ?? MOCK_METRICS.rating,
                    });
                }
            } catch {
                // keep mock
            }
        }
        fetchMetrics();
    }, []);

    const badgeProgress = useMemo(
        () =>
            BADGES.map((badge) => ({
                config: badge,
                progress: badge.check(supplier, metrics),
            })),
        [supplier, metrics]
    );

    const earnedCount = badgeProgress.filter((b) => b.progress >= 100).length;
    const upgradeTier = UPGRADES[supplier.listing_tier];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            {/* Badges section */}
            <div className="bg-surface-900 rounded-2xl border border-white/8 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
                            <Shield size={14} className="text-brand-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Badges</h3>
                            <p className="text-[10px] text-surface-500">
                                {earnedCount}/{BADGES.length} obtenus
                            </p>
                        </div>
                    </div>

                    {/* Progress circle */}
                    <div className="relative w-10 h-10">
                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                            <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-surface-800"
                            />
                            <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${(earnedCount / BADGES.length) * 100.5} 100.5`}
                                strokeLinecap="round"
                                className="text-brand-400"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                            {earnedCount}
                        </span>
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    {badgeProgress.map((item, i) => (
                        <BadgeItem
                            key={item.config.id}
                            config={item.config}
                            progress={item.progress}
                            delay={i * 0.06}
                        />
                    ))}
                </div>
            </div>

            {/* Upgrade prompt */}
            {upgradeTier && <UpgradeCard tier={upgradeTier} />}
        </motion.div>
    );
}
