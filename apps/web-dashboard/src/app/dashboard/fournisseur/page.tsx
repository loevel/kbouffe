"use client";

/**
 * Tableau de bord Fournisseur — Page d'accueil (Phase 1)
 *
 * Sections (top to bottom):
 *   1. AlertBadges — Smart alert system
 *   2. Page header + Export Report button
 *   3. KYCProgress — Interactive KYC stepper (replaces old banner)
 *   4. RevenueChart — 30-day revenue line chart
 *   5. 4 original stat cards + 4 performance metric cards
 *   6. ActivityFeed — Recent activity timeline
 *   7. CTA buttons + Quick links
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Package,
    ShoppingCart,
    TrendingUp,
    Clock,
    Plus,
    ArrowRight,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { useSupplier } from "./SupplierContext";

// ── Phase 1 Components ───────────────────────────────────────────────────
import { RevenueChart } from "./components/RevenueChart";
import { PerformanceMetrics } from "./components/PerformanceMetrics";
import { AlertBadges } from "./components/AlertBadges";
import { ActivityFeed, type ActivityItem } from "./components/ActivityFeed";
import { KYCProgress } from "./components/KYCProgress";
import { ExportReport } from "./components/ExportReport";

// ── Helpers ──────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "\u2014";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(dateStr));
}

// ── Stat card (same style as before) ─────────────────────────────────────

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

// ── Types ────────────────────────────────────────────────────────────────

interface OrderData {
    id?: string;
    delivery_status: string;
    total_price: number;
    created_at: string;
    restaurant_id?: string;
    restaurant_name?: string;
    expected_delivery_date?: string | null;
    actual_delivery_date?: string | null;
    items?: { product_name?: string; product_id?: string; quantity?: number; unit_price?: number }[];
}

interface OrderSummary {
    total_orders: number;
    total_revenue: number;
    last_order_date: string | null;
}

interface AlertsData {
    unreadMessages: number;
    lowStockCount: number;
    newRatings: number;
}

// ── Mock data generators ─────────────────────────────────────────────────

function generateMockActivities(orders: OrderData[]): ActivityItem[] {
    const activities: ActivityItem[] = [];

    // Generate from real orders
    for (const order of orders.slice(0, 6)) {
        const restaurantName = order.restaurant_name ?? "Restaurant";
        activities.push({
            id: `order-${order.id ?? order.created_at}`,
            type: order.delivery_status === "delivered"
                ? "order_delivered"
                : order.delivery_status === "confirmed"
                ? "order_confirmed"
                : "new_order",
            title:
                order.delivery_status === "delivered"
                    ? `Commande livree a ${restaurantName}`
                    : order.delivery_status === "confirmed"
                    ? `Commande confirmee de ${restaurantName}`
                    : `Nouvelle commande de ${restaurantName}`,
            description: formatFCFA(order.total_price),
            timestamp: order.created_at,
            href: "/dashboard/fournisseur/commandes",
        });
    }

    // Sort by timestamp descending
    activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, 10);
}

// ── Main page ────────────────────────────────────────────────────────────

export default function FournisseurDashboardPage() {
    const { supplier, loading: supplierLoading } = useSupplier();

    const [rawOrders, setRawOrders] = useState<OrderData[]>([]);
    const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
    const [ordersLoading, setOrdersLoading] = useState(true);

    const [alerts, setAlerts] = useState<AlertsData>({
        unreadMessages: 0,
        lowStockCount: 0,
        newRatings: 0,
    });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);

    // ── Fetch orders ──────────────────────────────────────────────────
    useEffect(() => {
        if (!supplier) return;

        async function fetchOrders() {
            setOrdersLoading(true);
            try {
                const res = await authFetch("/api/marketplace/suppliers/me/orders");
                if (res.ok) {
                    const data = (await res.json()) as any;
                    let orders: OrderData[] = [];

                    if (Array.isArray(data)) {
                        orders = data;
                    } else if (data?.orders && Array.isArray(data.orders)) {
                        orders = data.orders;
                    }

                    setRawOrders(orders);

                    // Compute summary
                    const nonCancelled = orders.filter(
                        (o) => o.delivery_status !== "cancelled"
                    );
                    const total_revenue = nonCancelled.reduce(
                        (acc, o) => acc + (o.total_price ?? 0),
                        0
                    );
                    const sorted = [...orders].sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                    );
                    setOrderSummary({
                        total_orders: orders.length,
                        total_revenue,
                        last_order_date: sorted[0]?.created_at ?? null,
                    });

                    // Generate activities from orders
                    setActivities(generateMockActivities(orders));
                    setActivitiesLoading(false);
                }
            } catch (err) {
                console.error("Orders fetch error:", err);
            } finally {
                setOrdersLoading(false);
            }
        }

        fetchOrders();
    }, [supplier]);

    // ── Fetch alerts (dashboard endpoint or mock) ─────────────────────
    useEffect(() => {
        if (!supplier) return;

        async function fetchAlerts() {
            try {
                const res = await authFetch("/api/marketplace/suppliers/me/dashboard");
                if (res.ok) {
                    const data = (await res.json()) as any;
                    setAlerts({
                        unreadMessages: data?.unread_messages ?? data?.metrics?.unread_messages ?? 0,
                        lowStockCount: data?.low_stock_count ?? data?.metrics?.low_stock_count ?? 0,
                        newRatings: data?.new_ratings ?? data?.metrics?.new_ratings ?? 0,
                    });
                    // If API returns activities, use them
                    if (data?.activities && Array.isArray(data.activities)) {
                        setActivities(data.activities);
                        setActivitiesLoading(false);
                    }
                } else {
                    // API endpoint missing -- use mock data
                    console.warn("API endpoint /api/marketplace/suppliers/me/dashboard manquant -- utilisation de donnees mock");
                    setAlerts({
                        unreadMessages: 3,
                        lowStockCount: 2,
                        newRatings: 1,
                    });
                }
            } catch {
                console.warn("API endpoint /api/marketplace/suppliers/me/dashboard manquant -- utilisation de donnees mock");
                setAlerts({
                    unreadMessages: 3,
                    lowStockCount: 2,
                    newRatings: 1,
                });
            }
        }

        fetchAlerts();
    }, [supplier]);

    const isApproved = supplier?.kyc_status === "approved";
    const kycIncomplete = supplier
        ? supplier.kyc_status !== "approved" && supplier.kyc_status !== "documents_submitted"
        : false;

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
            label: "Commandes recues",
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
            label: "Derniere commande",
            value: orderSummary ? formatDate(orderSummary.last_order_date) : "\u2014",
            icon: Clock,
            iconColor: "text-amber-400",
            iconBg: "bg-amber-500/15",
            delay: 0.25,
        },
    ];

    // Overall loading state
    if (supplierLoading) return null;

    return (
        <div className="space-y-6">
            {/* ── 1. Smart Alert Badges ──────────────────────────────── */}
            <AlertBadges
                unreadMessages={alerts.unreadMessages}
                lowStockCount={alerts.lowStockCount}
                kycIncomplete={kycIncomplete}
                newRatings={alerts.newRatings}
            />

            {/* ── 2. Page header + Export Report ─────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Tableau de bord
                    </h1>
                    <p className="text-surface-400 text-sm mt-1">
                        Bienvenue,{" "}
                        <span className="text-white font-medium">
                            {supplier?.contact_name ?? supplier?.name ?? ""}
                        </span>
                    </p>
                </div>
                <ExportReport
                    orders={rawOrders}
                    supplierName={supplier?.name ?? "Fournisseur"}
                    productCount={supplier?.product_count ?? 0}
                />
            </motion.div>

            {/* ── 3. KYC Progress (replaces static banner) ───────────── */}
            {supplier && (
                <KYCProgress
                    kycStatus={supplier.kyc_status}
                    faceVerified={supplier.kyc_face_verified}
                    hasDocuments={!!supplier.identity_doc_url}
                />
            )}

            {/* ── 4. Revenue Chart (30 days) ─────────────────────────── */}
            <RevenueChart orders={rawOrders} />

            {/* ── 5a. Original 4 stat cards ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Statistiques principales">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        {...stat}
                        loading={ordersLoading && stat.label !== "Produits actifs"}
                    />
                ))}
            </div>

            {/* ── 5b. Performance Metrics (4 extra cards) ────────────── */}
            <PerformanceMetrics orders={rawOrders} loading={ordersLoading} />

            {/* ── 6. Activity Feed ────────────────────────────────────── */}
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-transparent rounded-2xl">
                <ActivityFeed activities={activities} loading={activitiesLoading} />
            </div>

            {/* ── CTA ─────────────────────────────────────────────────── */}
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

            {/* ── Quick links ─────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"
            >
                {[
                    {
                        href: "/dashboard/fournisseur/produits",
                        label: "Gerer mes produits",
                        icon: Package,
                        color: "text-violet-400",
                    },
                    {
                        href: "/dashboard/fournisseur/commandes",
                        label: "Commandes recues",
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
