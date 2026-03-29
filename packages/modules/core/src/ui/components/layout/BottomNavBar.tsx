"use client";

/**
 * BottomNavBar — Barre de navigation fixe en bas pour mobile
 *
 * Affichée uniquement sur les écrans < lg (< 1024px).
 * Contient les 5 raccourcis les plus utilisés pour un usage rapide au pouce.
 * Le bouton central "Commandes" est mis en avant avec le badge pending.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Wallet,
    Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useLocale } from "../../contexts/LocaleContext";

interface BottomNavBarProps {
    pendingOrderCount?: number;
}

const BOTTOM_NAV = [
    { href: "/dashboard",          icon: LayoutDashboard, labelKey: "overview"  as const },
    { href: "/dashboard/orders",   icon: ShoppingBag,     labelKey: "orders"    as const },
    { href: "/dashboard/menu",     icon: UtensilsCrossed, labelKey: "menu"      as const },
    { href: "/dashboard/finances", icon: Wallet,          labelKey: "finances"  as const },
    { href: "/dashboard/settings", icon: Settings,        labelKey: "settings"  as const },
] as const;

export function BottomNavBar({ pendingOrderCount = 0 }: BottomNavBarProps) {
    const pathname = usePathname();
    const { t } = useLocale();

    function isActive(href: string) {
        if (href === "/dashboard") return pathname === "/dashboard";
        if (href === "/dashboard/orders")
            return pathname.startsWith("/dashboard/orders") && !pathname.startsWith("/dashboard/orders/kitchen");
        return pathname.startsWith(href);
    }

    return (
        // Safe area inset-bottom: gère le notch iOS / Android
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-950 border-t border-surface-800 flex items-center justify-around pb-safe">
            {BOTTOM_NAV.map((item) => {
                const active = isActive(item.href);
                const isOrders = item.labelKey === "orders";

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-0 flex-1 transition-colors",
                            isOrders
                                ? "mt-[-16px]"   // bouton central surélevé
                                : "",
                        )}
                    >
                        {/* Bouton central spécial */}
                        {isOrders ? (
                            <span className={cn(
                                "relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all",
                                active
                                    ? "bg-brand-500 shadow-brand-500/40"
                                    : "bg-surface-800 hover:bg-surface-700"
                            )}>
                                <item.icon size={22} className={active ? "text-white" : "text-surface-400"} />
                                {pendingOrderCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                        {pendingOrderCount > 9 ? "9+" : pendingOrderCount}
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                active
                                    ? "bg-brand-500/15"
                                    : "hover:bg-surface-800"
                            )}>
                                <item.icon
                                    size={20}
                                    className={active ? "text-brand-400" : "text-surface-500"}
                                />
                            </span>
                        )}

                        {/* Label */}
                        <span className={cn(
                            "text-[10px] font-medium truncate w-full text-center leading-none",
                            active
                                ? isOrders ? "text-brand-400" : "text-brand-400"
                                : "text-surface-600",
                        )}>
                            {t.nav[item.labelKey]}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
