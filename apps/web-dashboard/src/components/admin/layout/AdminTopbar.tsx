"use client";

import { Menu, Sun, Moon, Monitor, Globe, Shield } from "lucide-react";
import { AdminNotificationBell } from "./AdminNotificationBell";
import { AdminCopilot } from "@/components/admin/AdminCopilot";
import { Dropdown } from "@kbouffe/module-core/ui";
import { useAdmin } from "@/components/providers/AdminProvider";
import { useTheme, type Theme } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useUserSession } from "@/store/client-store";
import type { Locale } from "@/lib/i18n";

interface AdminTopbarProps {
    onMenuClick: () => void;
}

const themeOptions: { value: Theme; icon: typeof Sun }[] = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
];

const adminRoleBadgeConfig: Record<string, { label: string; className: string }> = {
    super_admin: {
        label: "Super Admin",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    support: {
        label: "Support",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    sales: {
        label: "Ventes",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    moderator: {
        label: "Moderation",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
};

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
    const session = useUserSession((s) => s.session);
    const { adminRole } = useAdmin();
    const { theme, setTheme } = useTheme();
    const { locale, t, setLocale } = useLocale();

    const currentThemeIcon = themeOptions.find((o) => o.value === theme)?.icon ?? Monitor;
    const ThemeIcon = currentThemeIcon;
    const roleBadge = adminRole ? adminRoleBadgeConfig[adminRole] : null;

    const handleSignOut = async () => {
        // Use same signout flow as merchant dashboard
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase?.auth.signOut();
        window.location.href = "/admin/login";
    };

    return (
        <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
            {/* Left */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white p-1"
                    aria-label="Menu"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <Shield size={18} className="text-brand-500" />
                    <div>
                        <h2 className="text-sm font-semibold text-surface-900 dark:text-white">
                            {t.admin?.title ?? "Platform Admin"}
                        </h2>
                        <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">
                                {session?.name ?? "Administrateur"}
                            </p>
                            {roleBadge && (
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${roleBadge.className}`}>
                                    {roleBadge.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
                <AdminCopilot />

                {/* Language toggle */}
                <Dropdown
                    items={([
                        { label: "Francais", onClick: () => setLocale("fr" as Locale) },
                        { label: "English", onClick: () => setLocale("en" as Locale) },
                    ] as const).map((item) => ({ ...item }))}
                    trigger={
                        <button className="flex items-center gap-1.5 p-2 text-surface-500 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-sm">
                            <Globe size={18} />
                            <span className="hidden sm:inline text-xs font-medium uppercase">{locale}</span>
                        </button>
                    }
                />

                {/* Theme toggle */}
                <Dropdown
                    items={themeOptions.map((opt) => ({
                        label: t.theme[opt.value],
                        onClick: () => setTheme(opt.value),
                    }))}
                    trigger={
                        <button className="p-2 text-surface-500 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                            <ThemeIcon size={18} />
                        </button>
                    }
                />

                <AdminNotificationBell />

                <Dropdown
                    items={[
                        { label: t.topbar.myProfile, onClick: () => { } },
                        { label: t.topbar.signOut, onClick: () => handleSignOut(), variant: "danger" as const },
                    ]}
                    trigger={
                        <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm cursor-pointer">
                            {session?.name?.charAt(0) ?? "A"}
                        </div>
                    }
                />
            </div>
        </header>
    );
}
