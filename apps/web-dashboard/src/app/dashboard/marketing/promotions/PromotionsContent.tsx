"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    Tag,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    Info,
    Copy,
    Check,
} from "lucide-react";
import { Card, Button } from "@kbouffe/module-core/ui";
import { CouponsTable, useCoupons } from "@kbouffe/module-marketing";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color = "text-brand-500",
    bgColor = "bg-brand-50 dark:bg-brand-900/20",
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
    bgColor?: string;
}) {
    return (
        <Card>
            <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={color} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-surface-400 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-0.5">{value}</p>
                    {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
                </div>
            </div>
        </Card>
    );
}

// ── Tip card ──────────────────────────────────────────────────────────────────

function CopyableCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 font-mono text-sm font-bold bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-brand-400 transition-colors"
        >
            <span>{code}</span>
            {copied ? (
                <Check size={12} className="text-green-500" />
            ) : (
                <Copy size={12} className="text-surface-400" />
            )}
        </button>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PromotionsContent() {
    const { coupons, isLoading } = useCoupons();

    const stats = useMemo(() => {
        const now = new Date();
        const active = coupons.filter(
            (c: any) =>
                c.is_active &&
                (!c.starts_at || new Date(c.starts_at) <= now) &&
                (!c.expires_at || new Date(c.expires_at) >= now),
        );
        const expired = coupons.filter(
            (c: any) => c.expires_at && new Date(c.expires_at) < now,
        );
        const totalUses = coupons.reduce((sum: number, c: any) => sum + (c.current_uses ?? 0), 0);
        const mostUsed = [...coupons].sort((a: any, b: any) => (b.current_uses ?? 0) - (a.current_uses ?? 0))[0];

        return {
            total: coupons.length,
            active: active.length,
            expired: expired.length,
            totalUses,
            mostUsed: mostUsed as any,
        };
    }, [coupons]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/marketing"
                        className="w-9 h-9 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
                    >
                        <ChevronLeft size={18} className="text-surface-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                <Tag size={20} className="text-white" />
                            </div>
                            Codes Promo
                        </h1>
                        <p className="text-surface-500 dark:text-surface-400 mt-1">
                            Créez et gérez vos réductions pour fidéliser vos clients
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Tag}
                    label="Codes actifs"
                    value={isLoading ? "…" : stats.active}
                    sub={`${stats.total} codes au total`}
                    color="text-green-500"
                    bgColor="bg-green-50 dark:bg-green-900/20"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Utilisations totales"
                    value={isLoading ? "…" : stats.totalUses}
                    sub="Toutes périodes confondues"
                    color="text-brand-500"
                    bgColor="bg-brand-50 dark:bg-brand-900/20"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Code le + utilisé"
                    value={isLoading ? "…" : stats.mostUsed?.code ?? "—"}
                    sub={
                        stats.mostUsed
                            ? `${stats.mostUsed.current_uses} utilisation${stats.mostUsed.current_uses !== 1 ? "s" : ""}`
                            : "Aucun code"
                    }
                    color="text-purple-500"
                    bgColor="bg-purple-50 dark:bg-purple-900/20"
                />
                <StatCard
                    icon={Clock}
                    label="Codes expirés"
                    value={isLoading ? "…" : stats.expired}
                    sub="À renouveler si besoin"
                    color={stats.expired > 0 ? "text-amber-500" : "text-surface-400"}
                    bgColor={stats.expired > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-surface-50 dark:bg-surface-800"}
                />
            </div>

            {/* Quick Tips */}
            <Card>
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info size={16} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-3">
                            Conseils pour maximiser vos codes promo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Bienvenue</p>
                                <p className="text-sm text-surface-600 dark:text-surface-400">
                                    Offrez <strong className="text-surface-900 dark:text-white">-10%</strong> sur la 1ère commande avec un code court et mémorable.
                                </p>
                                <CopyableCode code="BIENVENUE10" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Fidélité</p>
                                <p className="text-sm text-surface-600 dark:text-surface-400">
                                    Récompensez vos habitués avec un code à usage unique envoyé après 5 commandes.
                                </p>
                                <CopyableCode code="MERCI500" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Événement</p>
                                <p className="text-sm text-surface-600 dark:text-surface-400">
                                    Créez un code limité dans le temps pour le week-end, une fête ou les fêtes.
                                </p>
                                <CopyableCode code="NOEL2025" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Coupons Table */}
            <CouponsTable />

            {/* Footer tip */}
            <p className="text-center text-xs text-surface-400 pb-2">
                Les codes promo s'appliquent automatiquement lors de la commande. Le client entre le code sur votre vitrine en ligne.
            </p>
        </div>
    );
}
