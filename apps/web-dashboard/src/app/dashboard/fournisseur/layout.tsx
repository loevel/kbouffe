"use client";

/**
 * Layout du Dashboard Fournisseur — KBouffe
 *
 * Sidebar fixe (desktop) + navigation mobile, contexte fournisseur.
 * Indépendant du DashboardShell des restaurants.
 *
 * Architecture :
 *   SupplierProvider wraps all child pages
 *   Sidebar items: Tableau de bord | Produits | Commandes | Profil
 *   Loading skeleton pendant le chargement du profil
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    UserCog,
    MessageCircle,
    LogOut,
    Menu,
    X,
    Wheat,
    Loader2,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { KbouffeLogo } from "@/components/brand/Logo";
import { SupplierProvider, useSupplier } from "./SupplierContext";

// ── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    {
        href: "/dashboard/fournisseur",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        href: "/dashboard/fournisseur/analytics",
        label: "Analytics",
        icon: Package,
        exact: false,
    },
    {
        href: "/dashboard/fournisseur/produits",
        label: "Mes produits",
        icon: Package,
        exact: false,
    },
    {
        href: "/dashboard/fournisseur/commandes",
        label: "Commandes reçues",
        icon: ClipboardList,
        exact: false,
    },
    {
        href: "/dashboard/fournisseur/messages",
        label: "Messages",
        icon: MessageCircle,
        exact: false,
    },
    {
        href: "/dashboard/fournisseur/profil",
        label: "Mon profil / KYC",
        icon: UserCog,
        exact: false,
    },
] as const;

// ── KYC status dot ─────────────────────────────────────────────────────────

function KycDot({ status }: { status: string }) {
    const color =
        status === "approved"
            ? "bg-emerald-400"
            : status === "rejected" || status === "suspended"
            ? "bg-red-400"
            : status === "documents_submitted"
            ? "bg-blue-400"
            : "bg-amber-400";

    return (
        <span
            className={`inline-block w-2 h-2 rounded-full ${color} shrink-0`}
            title={`KYC : ${status}`}
        />
    );
}

// ── Sidebar nav link ───────────────────────────────────────────────────────

function NavLink({
    href,
    label,
    icon: Icon,
    exact,
    onClick,
}: {
    href: string;
    label: string;
    icon: React.ElementType;
    exact: boolean;
    onClick?: () => void;
}) {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                    ? "bg-brand-500/10 text-brand-300 border border-brand-500/15"
                    : "text-surface-400 hover:text-white hover:bg-white/5"
            }`}
            aria-current={isActive ? "page" : undefined}
        >
            <Icon
                size={18}
                className={`shrink-0 ${
                    isActive
                        ? "text-brand-400"
                        : "text-surface-500 group-hover:text-surface-300"
                }`}
            />
            <span>{label}</span>
        </Link>
    );
}

// ── Sidebar content ────────────────────────────────────────────────────────

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
    const router = useRouter();
    const { supplier } = useSupplier();

    async function handleLogout() {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        router.replace("/login");
    }

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-4 py-5 border-b border-white/5">
                <Link href="/dashboard/fournisseur" onClick={onNavClick}>
                    <KbouffeLogo height={28} variant="white" />
                </Link>
                <div className="flex items-center gap-2 mt-3">
                    <Wheat size={13} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">
                        Espace Fournisseur
                    </span>
                </div>
            </div>

            {/* Supplier info */}
            {supplier && (
                <div className="px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <KycDot status={supplier.kyc_status} />
                        <p className="text-sm font-semibold text-white truncate">
                            {supplier.name}
                        </p>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5 truncate pl-4">
                        {supplier.contact_name}
                    </p>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navigation fournisseur">
                {NAV_ITEMS.map((item) => (
                    <NavLink key={item.href} {...item} onClick={onNavClick} />
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-red-300 hover:bg-red-500/8 transition-all"
                    aria-label="Se déconnecter"
                >
                    <LogOut size={18} className="shrink-0" />
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>
    );
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
                    <Loader2 size={22} className="text-brand-400 animate-spin" />
                </div>
                <p className="text-sm text-surface-400">Chargement de votre espace…</p>
            </div>
        </div>
    );
}

// ── Inner layout (needs SupplierProvider) ──────────────────────────────────

function FournisseurLayoutInner({ children }: { children: ReactNode }) {
    const { loading } = useSupplier();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="min-h-screen bg-surface-950 flex">
            {/* ── Desktop sidebar ─────────────────────────────────────── */}
            <aside
                className="hidden lg:flex flex-col w-60 shrink-0 bg-surface-900 border-r border-white/5 sticky top-0 h-screen overflow-y-auto"
                aria-label="Menu latéral fournisseur"
            >
                <SidebarContent />
            </aside>

            {/* ── Mobile sidebar overlay ───────────────────────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                            aria-hidden="true"
                        />
                        {/* Drawer */}
                        <motion.aside
                            key="drawer"
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: "spring", stiffness: 340, damping: 32 }}
                            className="fixed left-0 top-0 h-full w-60 z-50 bg-surface-900 border-r border-white/5 lg:hidden overflow-y-auto"
                            aria-label="Menu latéral fournisseur (mobile)"
                        >
                            <SidebarContent onNavClick={() => setMobileOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar */}
                <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-surface-900 border-b border-white/5 sticky top-0 z-30">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/8 transition-colors"
                        aria-label="Ouvrir le menu"
                    >
                        <Menu size={20} />
                    </button>
                    <KbouffeLogo height={24} variant="white" />
                    <span className="text-xs text-emerald-400 font-medium ml-1">
                        Fournisseur
                    </span>
                </header>

                {/* Page content — pb-24 sur mobile pour la bottom nav */}
                <main className="flex-1 p-4 pb-28 sm:p-6 sm:pb-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* ── Bottom navigation mobile ─────────────────────────────── */}
            <SupplierBottomNav />
        </div>
    );
}

// ── Bottom navigation mobile (fournisseur) ──────────────────────────────────

function SupplierBottomNav() {
    const pathname = usePathname();

    function isActive(href: string, exact: boolean) {
        return exact ? pathname === href : pathname.startsWith(href);
    }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-900 border-t border-white/8 flex items-center justify-around pb-safe">
            {NAV_ITEMS.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center gap-1 py-2 px-3 flex-1 transition-colors"
                    >
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            active ? "bg-emerald-500/15" : "hover:bg-white/5"
                        }`}>
                            <item.icon size={20} className={active ? "text-emerald-400" : "text-surface-500"} />
                        </span>
                        <span className={`text-[10px] font-medium truncate leading-none ${
                            active ? "text-emerald-400" : "text-surface-600"
                        }`}>
                            {item.label.split(" ")[0]}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

// ── Exported layout ────────────────────────────────────────────────────────

export default function FournisseurLayout({ children }: { children: ReactNode }) {
    return (
        <SupplierProvider>
            <FournisseurLayoutInner>{children}</FournisseurLayoutInner>
        </SupplierProvider>
    );
}
