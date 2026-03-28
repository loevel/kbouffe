"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Store,
    Wallet,
    Settings,
    ShieldAlert,
    Megaphone,
    LifeBuoy,
    ShoppingBag,
    ShieldCheck,
    UtensilsCrossed,
    Store as StoreIcon,
    Brain,
    CreditCard,
    CheckSquare,
    Bell,
    Share2,
    HardDrive,
} from "lucide-react";
import { KbouffeLogoWhite } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useLocale } from "@kbouffe/module-core/ui";
import { useAdmin } from "@/components/providers/AdminProvider";
import { motion } from "framer-motion";
import { type AdminPermission } from "@/lib/admin-permissions";

export type AdminNavKey = "dashboard" | "users" | "restaurants" | "billing" | "settings" | "audits" | "marketing" | "marketplace" | "support" | "orders" | "moderation" | "cuisineCategories" | "aiUsage" | "subscriptions" | "onboarding" | "broadcast" | "socialMonitor" | "backup";

export const adminNavItemsDef: { href: string; labelKey: AdminNavKey; icon: any; permission?: AdminPermission }[] = [
    { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/admin/restaurants", labelKey: "restaurants", icon: Store },
    { href: "/admin/users", labelKey: "users", icon: Users, permission: "admin:users:read" },
    { href: "/admin/orders", labelKey: "orders", icon: ShoppingBag, permission: "admin:orders:read" },
    { href: "/admin/moderation", labelKey: "moderation", icon: ShieldCheck, permission: "admin:reviews:manage" },
    { href: "/admin/billing", labelKey: "billing", icon: Wallet, permission: "admin:billing:read" },
    { href: "/admin/subscriptions", labelKey: "subscriptions", icon: CreditCard, permission: "admin:billing:read" },
    { href: "/admin/onboarding", labelKey: "onboarding", icon: CheckSquare, permission: "admin:settings:manage" },
    { href: "/admin/marketing", labelKey: "marketing", icon: Megaphone, permission: "admin:marketing:read" },
    { href: "/admin/marketplace", labelKey: "marketplace", icon: StoreIcon, permission: "admin:marketplace:manage" },
    { href: "/admin/ai-usage", labelKey: "aiUsage", icon: Brain, permission: "admin:settings:manage" },
    { href: "/admin/broadcast", labelKey: "broadcast", icon: Bell, permission: "admin:settings:manage" },
    { href: "/admin/social-monitor", labelKey: "socialMonitor", icon: Share2, permission: "admin:settings:manage" },
    { href: "/admin/cuisine-categories", labelKey: "cuisineCategories", icon: UtensilsCrossed, permission: "admin:settings:manage" },
    { href: "/admin/support", labelKey: "support", icon: LifeBuoy, permission: "admin:support:manage" },
    { href: "/admin/audits", labelKey: "audits", icon: ShieldAlert, permission: "admin:settings:manage" },
    { href: "/admin/backup", labelKey: "backup", icon: HardDrive, permission: "admin:settings:manage" },
    { href: "/admin/settings", labelKey: "settings", icon: Settings, permission: "admin:settings:manage" },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { t } = useLocale();
    const { can, adminRole } = useAdmin();
    const adminNavLabels = t.adminNav as Partial<Record<AdminNavKey | "backToSite", string>> | undefined;

    // Filter based on admin permissions
    const navItems = adminNavItemsDef.filter((item) => {
        if (!item.permission) return true;
        // Hide navigation items that require permissions until the admin role is loaded
        if (!adminRole) return false;
        return can(item.permission);
    });

    function isActive(href: string) {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    }

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface-950 border-r border-surface-800 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Logo */}
            <div className="p-6">
                <Link href="/admin" className="flex items-center gap-3 group">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                        <KbouffeLogoWhite height={32} />
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1.5 py-4 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const label = adminNavLabels?.[item.labelKey] || item.labelKey;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden",
                                active
                                    ? "bg-brand-500/10 text-brand-400"
                                    : "text-surface-400 hover:text-white hover:bg-surface-800/50"
                            )}
                        >
                            {/* Active Indicator Accent */}
                            {active && (
                                <motion.div 
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            
                            <div className={cn(
                                "flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                                active ? "text-brand-400" : "text-surface-500 group-hover:text-white"
                            )}>
                                <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                            </div>
                            
                            <span className="flex-1">{label}</span>

                            {/* Chevron for indicating navigation */}
                            {!active && (
                                <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    <div className="w-1 h-4 bg-brand-500/50 rounded-full" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-surface-800/50 bg-surface-950/50 backdrop-blur-sm">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-surface-500 hover:text-white hover:bg-surface-900 rounded-lg transition-all active:scale-95 group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    {adminNavLabels?.backToSite || "Retour au site"}
                </Link>
            </div>
        </aside>
    );
}
