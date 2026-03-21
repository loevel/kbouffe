"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Users,
    Users2,
    Wallet,
    Settings,
    Store,
    Armchair,
    CalendarDays,
    Flame,
    Megaphone,
    BarChart3,
    MessageSquareText,
    Store as StoreIcon, // Alias to avoid conflict
} from "lucide-react";
import { KbouffeLogoWhite } from "../brand/Logo";
import { cn } from "../../lib/utils";
import { useLocale } from "../../contexts/LocaleContext";
import { useDashboard } from "../../contexts/DashboardContext";
import { NAV_PERMISSIONS } from "../../lib/permissions";

export type NavKey = "overview" | "orders" | "menu" | "customers" | "finances" | "settings" | "myStore" | "team" | "tables" | "reservations" | "kitchen" | "marketing" | "reports" | "marketplace" | "reviews";

export interface NavItem {
    href: string;
    labelKey: NavKey;
    icon: any;
    badge?: number;
}

export const navItemsDef: NavItem[] = [
    { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard },
    { href: "/dashboard/orders", labelKey: "orders", icon: ShoppingBag },
    { href: "/dashboard/orders/kitchen", labelKey: "kitchen", icon: Flame },
    { href: "/dashboard/menu", labelKey: "menu", icon: UtensilsCrossed },
    { href: "/dashboard/tables", labelKey: "tables", icon: Armchair },
    { href: "/dashboard/reservations", labelKey: "reservations", icon: CalendarDays },
    { href: "/dashboard/customers", labelKey: "customers", icon: Users },
    { href: "/dashboard/reviews", labelKey: "reviews", icon: MessageSquareText },
    { href: "/dashboard/finances", labelKey: "finances", icon: Wallet },
    { href: "/dashboard/reports", labelKey: "reports", icon: BarChart3 },
    { href: "/dashboard/marketing", labelKey: "marketing", icon: Megaphone },
    { href: "/dashboard/marketplace", labelKey: "marketplace", icon: StoreIcon },
    { href: "/dashboard/store", labelKey: "myStore", icon: Store },
    { href: "/dashboard/team", labelKey: "team", icon: Users2 },
    { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];

export const MODULE_REQUIREMENTS: Record<string, string> = {
    // All navigation items are available for all restaurants by default
    // Modules can still be managed via store_modules table if needed
};

interface SidebarProps {
    pendingOrderCount?: number;
}

export function Sidebar({ pendingOrderCount = 0 }: SidebarProps) {
    const pathname = usePathname();
    const { t } = useLocale();
    const { can, hasModule } = useDashboard();

    const allNavItems: NavItem[] = [
        ...navItemsDef.map(item =>
            item.labelKey === "orders" ? { ...item, badge: pendingOrderCount } : item
        )
    ];

    const navItems = allNavItems.filter((item) => {
        const requiredModule = MODULE_REQUIREMENTS[item.href];
        if (requiredModule && !hasModule(requiredModule)) {
            return false;
        }

        const requiredPermission = NAV_PERMISSIONS[item.href as keyof typeof NAV_PERMISSIONS];
        return requiredPermission ? can(requiredPermission) : true;
    });

    function isActive(href: string) {
        if (href === "/dashboard") return pathname === "/dashboard";
        if (href === "/dashboard/orders") return pathname.startsWith("/dashboard/orders") && !pathname.startsWith("/dashboard/orders/kitchen");
        return pathname.startsWith(href);
    }

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface-950 border-r border-surface-800 shrink-0">
            <div className="p-6">
                <Link href="/dashboard" className="flex items-center">
                    <KbouffeLogoWhite height={36} />
                </Link>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none",
                                active
                                    ? "bg-brand-500/10 text-brand-400 border-l-2 border-brand-500"
                                    : "text-surface-400 hover:text-white hover:bg-surface-800/50 focus:bg-surface-800/50"
                            )}
                        >
                            <item.icon size={20} />
                            <span className="flex-1">{t.nav[item.labelKey]}</span>
                            {item.badge ? (
                                <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-surface-800">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-surface-500 hover:text-surface-300 transition-colors"
                >
                    {t.nav.backToSite}
                </Link>
            </div>
        </aside>
    );
}
