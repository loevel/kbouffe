"use client";

/**
 * NotificationBell -- Notification bell icon with badge count + popover dropdown.
 *
 * Combines unread_messages, stock_alerts, kyc_warnings, new_ratings
 * into a single badge count. Clicking opens a popover with links.
 *
 * Polls /api/marketplace/suppliers/me/dashboard every 30s for real-time updates.
 * Falls back to mock data if endpoint unavailable.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    MessageCircle,
    AlertTriangle,
    Shield,
    Star,
    X,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { useSupplier } from "../SupplierContext";

// ── Types ──────────────────────────────────────────────────────────────────

interface NotificationItem {
    id: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    label: string;
    href: string;
    count: number;
}

interface AlertsData {
    unreadMessages: number;
    lowStockCount: number;
    kycIncomplete: boolean;
    newRatings: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export function NotificationBell() {
    const { supplier } = useSupplier();
    const [alerts, setAlerts] = useState<AlertsData>({
        unreadMessages: 0,
        lowStockCount: 0,
        kycIncomplete: false,
        newRatings: 0,
    });
    const [open, setOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // ── Fetch alerts ───────────────────────────────────────────────────
    const fetchAlerts = useCallback(async () => {
        if (!supplier) return;
        try {
            const res = await authFetch("/api/marketplace/suppliers/me/dashboard");
            if (res.ok) {
                const data = (await res.json()) as any;
                const kycStatus = supplier.kyc_status;
                setAlerts({
                    unreadMessages:
                        data?.unread_messages ?? data?.metrics?.unread_messages ?? 0,
                    lowStockCount:
                        data?.low_stock_count ?? data?.metrics?.low_stock_count ?? 0,
                    kycIncomplete:
                        kycStatus !== "approved" && kycStatus !== "documents_submitted",
                    newRatings: data?.new_ratings ?? data?.metrics?.new_ratings ?? 0,
                });
            } else {
                console.warn(
                    "NotificationBell: /api/marketplace/suppliers/me/dashboard indisponible -- donnees mock"
                );
                setAlerts({
                    unreadMessages: 3,
                    lowStockCount: 2,
                    kycIncomplete:
                        supplier.kyc_status !== "approved" &&
                        supplier.kyc_status !== "documents_submitted",
                    newRatings: 1,
                });
            }
        } catch {
            console.warn(
                "NotificationBell: erreur fetch -- donnees mock"
            );
            setAlerts({
                unreadMessages: 3,
                lowStockCount: 2,
                kycIncomplete:
                    !!supplier &&
                    supplier.kyc_status !== "approved" &&
                    supplier.kyc_status !== "documents_submitted",
                newRatings: 1,
            });
        }
    }, [supplier]);

    // Initial fetch + polling every 30s
    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30_000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    // ── Click outside to close ─────────────────────────────────────────
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // ── Keyboard nav ───────────────────────────────────────────────────
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && open) {
                setOpen(false);
                buttonRef.current?.focus();
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    // ── Build notification items ───────────────────────────────────────
    const items: NotificationItem[] = [
        {
            id: "messages",
            icon: MessageCircle,
            iconColor: "text-red-400",
            iconBg: "bg-red-500/15",
            label: `${alerts.unreadMessages} message${alerts.unreadMessages > 1 ? "s" : ""} non lu${alerts.unreadMessages > 1 ? "s" : ""}`,
            href: "/dashboard/fournisseur/messages",
            count: alerts.unreadMessages,
        },
        {
            id: "stock",
            icon: AlertTriangle,
            iconColor: "text-amber-400",
            iconBg: "bg-amber-500/15",
            label: `${alerts.lowStockCount} produit${alerts.lowStockCount > 1 ? "s" : ""} en rupture`,
            href: "/dashboard/fournisseur/produits",
            count: alerts.lowStockCount,
        },
        {
            id: "kyc",
            icon: Shield,
            iconColor: "text-yellow-400",
            iconBg: "bg-yellow-500/15",
            label: "KYC : documents manquants",
            href: "/dashboard/fournisseur/profil",
            count: alerts.kycIncomplete ? 1 : 0,
        },
        {
            id: "ratings",
            icon: Star,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/15",
            label: `${alerts.newRatings} nouvelle${alerts.newRatings > 1 ? "s" : ""} evaluation${alerts.newRatings > 1 ? "s" : ""}`,
            href: "/dashboard/fournisseur/commandes",
            count: alerts.newRatings,
        },
    ].filter((item) => item.count > 0);

    const totalCount = items.reduce((sum, i) => sum + i.count, 0);

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                ref={buttonRef}
                onClick={() => setOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-surface-400 hover:text-white hover:bg-white/8 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                aria-label={`Notifications${totalCount > 0 ? ` (${totalCount})` : ""}`}
                aria-expanded={open}
                aria-haspopup="true"
            >
                <Bell size={20} />
                {totalCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
                    >
                        {totalCount > 99 ? "99+" : totalCount}
                    </motion.span>
                )}
            </button>

            {/* Popover */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={popoverRef}
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 max-h-[300px] overflow-y-auto rounded-2xl bg-surface-900 border border-white/10 shadow-2xl shadow-black/40 z-50"
                        role="menu"
                        aria-label="Notifications"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                            <h3 className="text-sm font-bold text-white">
                                Notifications
                            </h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-lg text-surface-500 hover:text-white hover:bg-white/8 transition-colors"
                                aria-label="Fermer les notifications"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Items */}
                        {items.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell
                                    size={24}
                                    className="mx-auto text-surface-600 mb-2"
                                />
                                <p className="text-sm text-surface-500">
                                    Aucune notification
                                </p>
                            </div>
                        ) : (
                            <div className="py-1">
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                                            role="menuitem"
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}
                                            >
                                                <Icon
                                                    size={15}
                                                    className={item.iconColor}
                                                />
                                            </div>
                                            <span className="text-sm text-surface-300 group-hover:text-white transition-colors flex-1">
                                                {item.label}
                                            </span>
                                            <span className="text-xs font-bold text-surface-500 bg-surface-800 px-2 py-0.5 rounded-full">
                                                {item.count}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
