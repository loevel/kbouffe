"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Clock, Truck, ImageIcon, Bell, CreditCard, Shield, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@kbouffe/module-core/ui";

export function SettingsNav() {
    const pathname = usePathname();
    const { t } = useLocale();
    const settingsLinks = [
        { href: "/dashboard/settings", label: t.settings.generalInfo, icon: Building2 },
        { href: "/dashboard/settings/branding", label: t.settings.branding, icon: ImageIcon },
        { href: "/dashboard/settings/hours", label: t.settings.openingHours, icon: Clock },
        { href: "/dashboard/settings/delivery", label: t.settings.delivery, icon: Truck },
        { href: "/dashboard/settings/dine-in", label: t.dineIn.title, icon: Armchair },
        { href: "/dashboard/settings/payments", label: t.settings.payments, icon: CreditCard },
        { href: "/dashboard/settings/notifications", label: t.settings.notifications, icon: Bell },
        { href: "/dashboard/settings/security", label: t.settings.security, icon: Shield },
    ];

    return (
        <nav className="flex flex-wrap gap-1 mb-6 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl overflow-x-auto">
            {settingsLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            isActive
                                ? "bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm"
                                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                        )}
                    >
                        <Icon size={16} />
                        <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
