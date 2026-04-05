"use client";

/**
 * Topbar v2 — Barre de navigation supérieure adaptative
 *
 * Mobile  (<lg) : burger menu + nom (tronqué) + notifications + avatar
 * Desktop (≥lg) : tout complet (lien store, langue, thème, notif, avatar)
 *
 * Sur mobile on allège la barre car la BottomNavBar gère la navigation principale.
 */

import { type ReactNode } from "react";
import { Menu, ExternalLink, Sun, Moon, Monitor, Globe } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { Dropdown } from "../Dropdown";
import { useDashboard } from "../../contexts/DashboardContext";
import { useTheme, type Theme } from "../../contexts/ThemeContext";
import { useLocale } from "../../contexts/LocaleContext";
import type { Locale } from "../../i18n";

interface TopbarProps {
    onMenuClick: () => void;
    searchSlot?: ReactNode;
}

const themeOptions: { value: Theme; icon: any }[] = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
];

export function Topbar({ onMenuClick, searchSlot }: TopbarProps) {
    const { user, restaurant, signOut } = useDashboard();
    const { theme, setTheme } = useTheme();
    const { locale, t, setLocale } = useLocale();

    const currentThemeIcon = themeOptions.find((o) => o.value === theme)?.icon ?? Monitor;
    const ThemeIcon = currentThemeIcon;

    const initials = user?.full_name
        ? user.full_name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
        : "?";

    return (
        <header className="h-14 lg:h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-3 lg:px-8 shrink-0">

            {/* ── Gauche ── */}
            <div className="flex items-center gap-2 lg:gap-4 min-w-0">
                {/* Bouton burger — mobile seulement */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
                    aria-label="Ouvrir le menu"
                >
                    <Menu size={22} />
                </button>

                {/* Nom du restaurant */}
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-surface-900 dark:text-white truncate max-w-[160px] sm:max-w-[260px] lg:max-w-none">
                        {restaurant?.name ?? t.topbar.myRestaurant}
                    </h2>
                    {restaurant?.city && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block truncate">
                            {restaurant.city}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Droite ── */}
            <div className="flex items-center gap-0.5 lg:gap-1 shrink-0">

                {/* Recherche rapide — slot injecté depuis DashboardShell */}
                {searchSlot && <div className="hidden sm:block mr-1">{searchSlot}</div>}

                {/* Lien "Voir ma boutique" — desktop + tablet */}
                <a
                    href={restaurant?.slug ? `/r/${restaurant.slug}` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden md:flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400 hover:text-brand-500 transition-colors px-3 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800"
                >
                    <ExternalLink size={16} />
                    <span className="hidden lg:inline">{t.topbar.viewStore}</span>
                </a>

                {/* Sélecteur langue — desktop seulement */}
                <Dropdown
                    items={[
                        { label: "Français", onClick: () => setLocale("fr" as Locale) },
                        { label: "English", onClick: () => setLocale("en" as Locale) },
                    ]}
                    trigger={
                        <button className="hidden lg:flex items-center gap-1.5 p-2 text-surface-500 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-sm">
                            <Globe size={18} />
                            <span className="text-xs font-medium uppercase">{locale}</span>
                        </button>
                    }
                />

                {/* Sélecteur thème — desktop seulement */}
                <Dropdown
                    items={themeOptions.map((opt) => ({
                        label: t.theme[opt.value],
                        onClick: () => setTheme(opt.value),
                    }))}
                    trigger={
                        <button className="hidden lg:flex p-2 text-surface-500 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                            <ThemeIcon size={18} />
                        </button>
                    }
                />

                {/* Notifications — toujours visible */}
                <NotificationBell />

                {/* Avatar + menu utilisateur */}
                <Dropdown
                    items={[
                        { label: t.topbar.myProfile, onClick: () => { } },
                        // Sélecteur thème dans le dropdown sur mobile
                        ...themeOptions.map((opt) => ({
                            label: t.theme[opt.value],
                            onClick: () => setTheme(opt.value),
                        })),
                        { label: t.topbar.signOut, onClick: () => signOut(), variant: "danger" as const },
                    ]}
                    trigger={
                        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-xs lg:text-sm cursor-pointer hover:bg-brand-500/20 transition-colors select-none">
                            {initials}
                        </div>
                    }
                />
            </div>
        </header>
    );
}
