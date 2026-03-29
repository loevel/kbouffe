"use client";

/**
 * MobileSidebar — Drawer latéral mobile (< lg)
 *
 * Améliorations v2:
 *  - Animations CSS (translate + opacity) sans dépendances externes
 *  - Swipe-to-close via touch events
 *  - Applique les permissions (NAV_PERMISSIONS) comme le sidebar desktop
 *  - Sections groupées (Operations / Analytics / Configuration)
 *  - Affiche le profil utilisateur en bas
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { X, ChevronRight, ArrowLeft } from "lucide-react";
import { KbouffeLogoWhite } from "../brand/Logo";
import { cn } from "../../lib/utils";
import { navItemsDef } from "./Sidebar";
import { useLocale } from "../../contexts/LocaleContext";
import { useDashboard } from "../../contexts/DashboardContext";
import { NAV_PERMISSIONS } from "../../lib/permissions";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    pendingOrderCount?: number;
}

// Groupes de navigation pour meilleure lisibilité sur mobile
const NAV_GROUPS = [
    {
        label: "Opérations",
        hrefs: ["/dashboard", "/dashboard/orders", "/dashboard/orders/kitchen", "/dashboard/menu", "/dashboard/tables", "/dashboard/reservations"],
    },
    {
        label: "Clients & Ventes",
        hrefs: ["/dashboard/customers", "/dashboard/reviews", "/dashboard/messages", "/dashboard/marketing", "/dashboard/marketplace", "/dashboard/approvisionnement"],
    },
    {
        label: "Analyse & Gestion",
        hrefs: ["/dashboard/finances", "/dashboard/reports", "/dashboard/analytics", "/dashboard/store", "/dashboard/showcase"],
    },
    {
        label: "Administration",
        hrefs: ["/dashboard/team", "/dashboard/settings", "/dashboard/support"],
    },
] as const;

export function MobileSidebar({ isOpen, onClose, pendingOrderCount = 0 }: MobileSidebarProps) {
    const pathname = usePathname();
    const { t } = useLocale();
    const { can, user, restaurant } = useDashboard();
    const touchStartX = useRef<number | null>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Ferme automatiquement si on change de route
    const prevPathname = useRef(pathname);
    useEffect(() => {
        if (prevPathname.current !== pathname) {
            prevPathname.current = pathname;
            onClose();
        }
    }, [pathname, onClose]);

    // Swipe-to-close (glisser vers la gauche)
    function handleTouchStart(e: React.TouchEvent) {
        touchStartX.current = e.touches[0].clientX;
    }
    function handleTouchEnd(e: React.TouchEvent) {
        if (touchStartX.current === null) return;
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        if (delta > 60) onClose(); // swipe gauche > 60px → ferme
        touchStartX.current = null;
    }

    // Filtre par permissions (comme le Sidebar desktop)
    const allNavItems = navItemsDef.map((item) =>
        item.labelKey === "orders" ? { ...item, badge: pendingOrderCount } : item
    ).filter((item) => {
        const requiredPermission = NAV_PERMISSIONS[item.href as keyof typeof NAV_PERMISSIONS];
        return requiredPermission ? can(requiredPermission) : true;
    });

    function isActive(href: string) {
        if (href === "/dashboard") return pathname === "/dashboard";
        if (href === "/dashboard/orders")
            return pathname.startsWith("/dashboard/orders") && !pathname.startsWith("/dashboard/orders/kitchen");
        return pathname.startsWith(href);
    }

    // Grouper les items disponibles
    const groupedItems = NAV_GROUPS.map((group) => ({
        label: group.label,
        items: allNavItems.filter((item) => (group.hrefs as readonly string[]).includes(item.href)),
    })).filter((g) => g.items.length > 0);

    return (
        // Overlay + drawer — toujours monté, animé via CSS transform
        <div
            className={cn(
                "fixed inset-0 z-50 lg:hidden transition-all duration-300",
                isOpen ? "pointer-events-auto" : "pointer-events-none"
            )}
            aria-hidden={!isOpen}
        >
            {/* Fond semi-transparent */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={cn(
                    "absolute left-0 top-0 bottom-0 w-[280px] bg-surface-950 shadow-2xl flex flex-col",
                    "transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-surface-800/60 shrink-0">
                    <Link href="/dashboard" className="flex items-center">
                        <KbouffeLogoWhite height={30} />
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
                        aria-label="Fermer le menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Restaurant info */}
                {restaurant && (
                    <div className="px-5 py-3 bg-surface-900/60 border-b border-surface-800/40 shrink-0">
                        <p className="text-sm font-semibold text-white truncate">{restaurant.name}</p>
                        {restaurant.city && (
                            <p className="text-xs text-surface-500 truncate">{restaurant.city}</p>
                        )}
                    </div>
                )}

                {/* Navigation groupée */}
                <nav className="flex-1 overflow-y-auto py-3 space-y-5">
                    {groupedItems.map((group) => (
                        <div key={group.label}>
                            <p className="px-5 pb-1 text-[10px] font-bold tracking-widest uppercase text-surface-600">
                                {group.label}
                            </p>
                            <div className="space-y-0.5 px-2">
                                {group.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                                active
                                                    ? "bg-brand-500/10 text-brand-400"
                                                    : "text-surface-400 hover:text-white hover:bg-surface-800/60 active:bg-surface-800"
                                            )}
                                        >
                                            <span className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                active ? "bg-brand-500/15 text-brand-400" : "bg-surface-800/80 text-surface-500"
                                            )}>
                                                <item.icon size={17} />
                                            </span>
                                            <span className="flex-1 truncate">{t.nav[item.labelKey]}</span>
                                            {item.badge ? (
                                                <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {item.badge > 99 ? "99+" : item.badge}
                                                </span>
                                            ) : active ? (
                                                <ChevronRight size={14} className="text-brand-500/60 shrink-0" />
                                            ) : null}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer — retour au site */}
                <div className="p-4 border-t border-surface-800/60 shrink-0">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-surface-500 hover:text-surface-300 hover:bg-surface-800/60 transition-all"
                    >
                        <ArrowLeft size={16} />
                        <span>{t.nav.backToSite}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
