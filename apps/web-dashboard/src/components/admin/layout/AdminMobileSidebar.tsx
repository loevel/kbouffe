"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { KbouffeLogoWhite } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { adminNavItemsDef } from "./AdminSidebar";
import { useLocale } from "@/contexts/locale-context";
import { useAdmin } from "@/components/providers/AdminProvider";

interface AdminMobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminMobileSidebar({ isOpen, onClose }: AdminMobileSidebarProps) {
    const pathname = usePathname();
    const { t } = useLocale();
    const { can, adminRole } = useAdmin();
    // No need for session here as we just check if adminRole is null

    const navItems = adminNavItemsDef.filter((item) => {
        if (!item.permission) return true;
        // Default to showing all items if the admin role isn't loaded yet
        if (!adminRole) return true;
        return can(item.permission);
    });

    function isActive(href: string) {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface-950 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
                        <KbouffeLogoWhite height={32} />
                        <span className="text-white text-xs font-bold tracking-tight uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400">Admin</span>
                    </Link>
                    <button onClick={onClose} className="text-surface-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        const label = (t.adminNav as any)?.[item.labelKey] || item.labelKey;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                    active
                                        ? "bg-brand-500/10 text-brand-400"
                                        : "text-surface-400 hover:text-white hover:bg-surface-800/50"
                                )}
                            >
                                <item.icon size={20} />
                                <span className="flex-1">{label}</span>
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
                        {t.adminNav ? t.adminNav.backToSite : "Back to site"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
