"use client";

/**
 * Tableau de bord Fournisseur — Page d'accueil
 *
 * Affiche :
 *   - Bannière statut KYC (couleur selon statut)
 *   - 4 cartes de stats (produits, commandes, CA, dernière commande)
 *   - CTA "Ajouter un produit" (désactivé si KYC non approuvé)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Package,
    ShoppingCart,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Info,
    Plus,
    Loader2,
    ArrowRight,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { useSupplier } from "./SupplierContext";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(dateStr));
}

// ── KYC banner ─────────────────────────────────────────────────────────────

interface KycBannerProps {
    status: string;
    rejectionReason?: string | null;
}

function KycBanner({ status, rejectionReason }: KycBannerProps) {
    const configs = {
        pending: {
            bg: "bg-amber-500/10 border-amber-500/25",
            icon: <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />,
            text: "text-amber-300",
            message:
                "Votre dossier est en cours de vérification. Ce processus prend généralement 48h ouvrables.",
        },
        documents_submitted: {
            bg: "bg-blue-500/10 border-blue-500/25",
            icon: <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />,
            text: "text-blue-300",
            message: "Dossier soumis. Il est en attente d'approbation par notre équipe.",
        },
        approved: {
            bg: "bg-emerald-500/10 border-emerald-500/25",
            icon: <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />,
            text: "text-emerald-300",
            message: "✅ Compte validé. Votre catalogue est visible par tous les restaurants de votre région.",
        },
        rejected: {
            bg: "bg-red-500/10 border-red-500/25",
            icon: <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />,
            text: "text-red-300",
            message: rejectionReason
                ? `Dossier refusé — ${rejectionReason}`
                : "Dossier refusé. Contactez support@kbouffe.com pour plus d'informations.",
        },
        suspended: {
            bg: "bg-red-500/10 border-red-500/25",
            icon: <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />,
            text: "text-red-300",
            message:
                "Votre compte est suspendu. Contactez support@kbouffe.com pour le rétablissement.",
        },
    } as const;

    const config =
        configs[status as keyof typeof configs] ?? configs.pending;

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg}`}
            role="status"
            aria-live="polite"
        >
            {config.icon}
            <p className={`text-sm font-medium ${config.text}`}>{config.message}</p>
        </div>
    );
}

// ── Stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    loading?: boolean;
    delay?: number;
}

function StatCard({
    label,
    value,
    icon: Icon,
    iconColor,
    iconBg,
    loading,
    delay = 0,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            className="bg-surface-900 border border-white/8 rounded-2xl p-5"
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                        {label}
                    </p>
                    {loading ? (
                        <div className="h-7 w-20 rounded-lg bg-surface-800 animate-pulse" />
                    ) : (
                        <p className="text-2xl font-bold text-white truncate">{value}</p>
                    )}
                </div>
                <div
                    className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ml-3`}
                >
                    <Icon size={20} className={iconColor} />
                </div>
            </div>
        </motion.div>
    );
}

// ── Order summary type ─────────────────────────────────────────────────────

interface OrderSummary {
    total_orders: number;
    total_revenue: number;
    last_order_date: string | null;
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function FournisseurDashboardPage() {
    const { supplier, loading: supplierLoading } = useSupplier();

    const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        if (!supplier) return;

        async function fetchOrders() {
            setOrdersLoading(true);
            try {
                const res = await authFetch("/api/marketplace/suppliers/me/orders");
                if (res.ok) {
                    const data = (await res.json()) as any;
                    // Compute summary from orders array or use summary object
                    if (Array.isArray(data)) {
                        const orders = data as any[];
                        const total_revenue = orders
                            .filter((o) => o.delivery_status !== "cancelled")
                            .reduce((acc: number, o: any) => acc + (o.total_price ?? 0), 0);
                        const last = orders.sort(
                            (a: any, b: any) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime()
                        )[0];
                        setOrderSummary({
                            total_orders: orders.length,
                            total_revenue,
                            last_order_date: last?.created_at ?? null,
                        });
                    } else if (data?.orders) {
                        const orders = data.orders as any[];
                        const total_revenue = orders
                            .filter((o) => o.delivery_status !== "cancelled")
                            .reduce((acc: number, o: any) => acc + (o.total_price ?? 0), 0);
                        const last = [...orders].sort(
                            (a: any, b: any) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime()
                        )[0];
                        setOrderSummary({
                            total_orders: orders.length,
                            total_revenue,
                            last_order_date: last?.created_at ?? null,
                        });
                    } else {
                        setOrderSummary(data as OrderSummary);
                    }
                }
            } catch (err) {
                console.error("Orders fetch error:", err);
            } finally {
                setOrdersLoading(false);
            }
        }

        fetchOrders();
    }, [supplier]);

    const isApproved = supplier?.kyc_status === "approved";

    const stats = [
        {
            label: "Produits actifs",
            value: supplier?.product_count != null ? String(supplier.product_count) : "0",
            icon: Package,
            iconColor: "text-violet-400",
            iconBg: "bg-violet-500/15",
            delay: 0.1,
        },
        {
            label: "Commandes reçues",
            value: orderSummary ? String(orderSummary.total_orders) : "0",
            icon: ShoppingCart,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/15",
            delay: 0.15,
        },
        {
            label: "Chiffre d'affaires",
            value: orderSummary ? formatFCFA(orderSummary.total_revenue) : "0 FCFA",
            icon: TrendingUp,
            iconColor: "text-emerald-400",
            iconBg: "bg-emerald-500/15",
            delay: 0.2,
        },
        {
            label: "Dernière commande",
            value: orderSummary ? formatDate(orderSummary.last_order_date) : "—",
            icon: Clock,
            iconColor: "text-amber-400",
            iconBg: "bg-amber-500/15",
            delay: 0.25,
        },
    ];

    // Overall loading state for initial supplier profile fetch
    if (supplierLoading) return null; // layout handles skeleton

    return (
        <div className="space-y-6">
            {/* ── Page header ─────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Tableau de bord
                </h1>
                <p className="text-surface-400 text-sm mt-1">
                    Bienvenue,{" "}
                    <span className="text-white font-medium">
                        {supplier?.contact_name ?? supplier?.name ?? ""}
                    </span>{" "}
                    👋
                </p>
            </motion.div>

            {/* ── KYC banner ───────────────────────────────────────────── */}
            {supplier && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.35 }}
                >
                    <KycBanner
                        status={supplier.kyc_status}
                        rejectionReason={supplier.kyc_rejection_reason}
                    />
                </motion.div>
            )}

            {/* ── Stats grid ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        {...stat}
                        loading={ordersLoading && stat.label !== "Produits actifs"}
                    />
                ))}
            </div>

            {/* ── CTA ──────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 pt-2"
            >
                {isApproved ? (
                    <Link
                        href="/dashboard/fournisseur/produits"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35"
                    >
                        <Plus size={17} />
                        Ajouter un produit
                    </Link>
                ) : (
                    <div className="relative group">
                        <button
                            disabled
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-800 text-surface-500 font-semibold text-sm cursor-not-allowed border border-white/5"
                            aria-describedby="kyc-tooltip"
                        >
                            <Plus size={17} />
                            Ajouter un produit
                        </button>
                        <div
                            id="kyc-tooltip"
                            role="tooltip"
                            className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-surface-800 text-white text-xs rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl"
                        >
                            Validez votre KYC d'abord
                        </div>
                    </div>
                )}

                <Link
                    href="/dashboard/fournisseur/commandes"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/8 text-surface-300 hover:text-white font-semibold text-sm transition-all"
                >
                    Voir mes commandes
                    <ArrowRight size={16} />
                </Link>
            </motion.div>

            {/* ── Quick links ──────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"
            >
                {[
                    {
                        href: "/dashboard/fournisseur/produits",
                        label: "Gérer mes produits",
                        icon: Package,
                        color: "text-violet-400",
                    },
                    {
                        href: "/dashboard/fournisseur/commandes",
                        label: "Commandes reçues",
                        icon: ShoppingCart,
                        color: "text-blue-400",
                    },
                    {
                        href: "/dashboard/fournisseur/profil",
                        label: "Mon profil & KYC",
                        icon: TrendingUp,
                        color: "text-emerald-400",
                    },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 p-4 rounded-xl bg-surface-900 border border-white/8 hover:border-white/15 hover:bg-surface-800 transition-all group"
                    >
                        <item.icon size={18} className={item.color} />
                        <span className="text-sm font-medium text-surface-300 group-hover:text-white transition-colors">
                            {item.label}
                        </span>
                        <ArrowRight
                            size={14}
                            className="ml-auto text-surface-600 group-hover:text-surface-400 group-hover:translate-x-0.5 transition-all"
                        />
                    </Link>
                ))}
            </motion.div>
        </div>
    );
}
