"use client";

/**
 * AlertBadges -- Smart alert system for dashboard top
 * Badges: unread messages, low stock, KYC incomplete, new ratings
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
    MessageCircle,
    AlertTriangle,
    Shield,
    Star,
} from "lucide-react";

interface AlertBadgesProps {
    unreadMessages: number;
    lowStockCount: number;
    kycIncomplete: boolean;
    newRatings: number;
}

interface BadgeDef {
    show: boolean;
    color: string;
    bg: string;
    border: string;
    icon: React.ElementType;
    label: string;
    href: string;
}

export function AlertBadges({
    unreadMessages,
    lowStockCount,
    kycIncomplete,
    newRatings,
}: AlertBadgesProps) {
    const badges: BadgeDef[] = [
        {
            show: unreadMessages > 0,
            color: "text-red-300",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            icon: MessageCircle,
            label: `${unreadMessages} message${unreadMessages > 1 ? "s" : ""} non lu${unreadMessages > 1 ? "s" : ""}`,
            href: "/dashboard/fournisseur/messages",
        },
        {
            show: lowStockCount > 0,
            color: "text-amber-300",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            icon: AlertTriangle,
            label: `${lowStockCount} produit${lowStockCount > 1 ? "s" : ""} en stock bas`,
            href: "/dashboard/fournisseur/produits",
        },
        {
            show: kycIncomplete,
            color: "text-yellow-300",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            icon: Shield,
            label: "KYC incomplet",
            href: "/dashboard/fournisseur/profil",
        },
        {
            show: newRatings > 0,
            color: "text-blue-300",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            icon: Star,
            label: `${newRatings} nouvel${newRatings > 1 ? "les" : "le"} evaluation${newRatings > 1 ? "s" : ""}`,
            href: "/dashboard/fournisseur/commandes",
        },
    ];

    const visible = badges.filter((b) => b.show);
    if (visible.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {visible.map((badge, i) => {
                const Icon = badge.icon;
                return (
                    <motion.div
                        key={badge.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Link
                            href={badge.href}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:brightness-110 ${badge.bg} ${badge.color} ${badge.border}`}
                        >
                            <Icon size={13} />
                            {badge.label}
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}
