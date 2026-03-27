"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { KbouffeLogoWhite } from "../brand/Logo";
import { cn } from "../../lib/utils";
import { navItemsDef } from "./Sidebar";
import { useLocale } from "../../contexts/LocaleContext";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    pendingOrderCount?: number;
}

export function MobileSidebar({ isOpen, onClose, pendingOrderCount = 0 }: MobileSidebarProps) {
    const pathname = usePathname();
    const { t } = useLocale();

    const navItems = navItemsDef.map((item) =>
        item.labelKey === "orders" ? { ...item, badge: pendingOrderCount } : item
    );

    function isActive(href: string) {
        if (href === "/dashboard") return pathname === "/dashboard";
        if (href === "/dashboard/orders") return pathname.startsWith("/dashboard/orders") && !pathname.startsWith("/dashboard/orders/kitchen");
        return pathname.startsWith(href);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface-950 shadow-2xl flex flex-col">
                <div className="p-6 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center" onClick={onClose}>
                        <KbouffeLogoWhite height={36} />
                    </Link>
                    <button onClick={onClose} className="text-surface-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none",
                                    active
                                        ? "bg-brand-500/10 text-brand-400"
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
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-surface-500 hover:text-surface-300"
                    >
                        {t.nav.backToSite}
                    </Link>
                </div>
            </div>
        </div>
    );
}
