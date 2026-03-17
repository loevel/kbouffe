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
    Truck,
} from "lucide-react";
import { KbouffeLogoWhite } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { usePendingOrderCount } from "@/hooks/use-data";
import { useLocale } from "@/contexts/locale-context";
import { useDashboard } from "@/contexts/dashboard-context";
import { NAV_PERMISSIONS } from "@/lib/permissions";

export type NavKey = "overview" | "orders" | "menu" | "customers" | "finances" | "settings" | "myStore" | "team" | "drivers" | "tables" | "reservations" | "kitchen" | "marketing";

export const navItemsDef: { href: string; labelKey: NavKey; icon: typeof LayoutDashboard; badge?: number }[] = [
    { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard },
    { href: "/dashboard/orders", labelKey: "orders", icon: ShoppingBag },
    { href: "/dashboard/orders/kitchen", labelKey: "kitchen", icon: Flame },
    { href: "/dashboard/menu", labelKey: "menu", icon: UtensilsCrossed },
    { href: "/dashboard/tables", labelKey: "tables", icon: Armchair },
    { href: "/dashboard/reservations", labelKey: "reservations", icon: CalendarDays },
    { href: "/dashboard/customers", labelKey: "customers", icon: Users },
    { href: "/dashboard/finances", labelKey: "finances", icon: Wallet },
    { href: "/dashboard/store", labelKey: "myStore", icon: Store },
    { href: "/dashboard/team", labelKey: "team", icon: Users2 },
    { href: "/dashboard/team/drivers", labelKey: "drivers", icon: Truck },
    { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];

export const MODULE_REQUIREMENTS: Record<string, string> = {
    "/dashboard/reservations": "reservations",
    "/dashboard/marketing": "marketing",
    "/dashboard/team": "hr",
    "/dashboard/team/drivers": "hr",
    // Add other module requirements here as they are developed
};

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useLocale();
    const { can, hasModule } = useDashboard();
    const pendingCount = usePendingOrderCount();

    const allNavItems = [
        { href: "/dashboard", labelKey: "overview" as NavKey, icon: LayoutDashboard },
        { href: "/dashboard/orders", labelKey: "orders" as NavKey, icon: ShoppingBag, badge: pendingCount },
        { href: "/dashboard/orders/kitchen", labelKey: "kitchen" as NavKey, icon: Flame },
        { href: "/dashboard/menu", labelKey: "menu" as NavKey, icon: UtensilsCrossed },
        { href: "/dashboard/tables", labelKey: "tables" as NavKey, icon: Armchair },
        { href: "/dashboard/reservations", labelKey: "reservations" as NavKey, icon: CalendarDays },
        { href: "/dashboard/customers", labelKey: "customers" as NavKey, icon: Users },
        { href: "/dashboard/finances", labelKey: "finances" as NavKey, icon: Wallet },
        { href: "/dashboard/marketing", labelKey: "marketing" as NavKey, icon: Megaphone },
        { href: "/dashboard/store", labelKey: "myStore" as NavKey, icon: Store },
        { href: "/dashboard/team", labelKey: "team" as NavKey, icon: Users2 },
        { href: "/dashboard/team/drivers", labelKey: "drivers" as NavKey, icon: Truck },
        { href: "/dashboard/settings", labelKey: "settings" as NavKey, icon: Settings },
    ];

    // Filter based on user's permissions and active modules
    const navItems = allNavItems.filter((item) => {
        const requiredModule = MODULE_REQUIREMENTS[item.href];
        if (requiredModule && !hasModule(requiredModule)) {
            return false;
        }

        const requiredPermission = NAV_PERMISSIONS[item.href];
        return requiredPermission ? can(requiredPermission) : true;
    });

    function isActive(href: string) {
        if (href === "/dashboard") return pathname === "/dashboard";
        if (href === "/dashboard/orders") return pathname.startsWith("/dashboard/orders") && !pathname.startsWith("/dashboard/orders/kitchen");
        if (href === "/dashboard/team") return pathname === "/dashboard/team";
        return pathname.startsWith(href);
    }

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface-950 border-r border-surface-800">
            {/* Logo */}
            <div className="p-6">
                <Link href="/dashboard" className="flex items-center">
                    <KbouffeLogoWhite height={36} />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                                active
                                    ? "bg-brand-500/10 text-brand-400 border-l-2 border-brand-500"
                                    : "text-surface-400 hover:text-white hover:bg-surface-800/50"
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

            {/* Bottom */}
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


