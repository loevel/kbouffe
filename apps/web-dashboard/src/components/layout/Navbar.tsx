"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, LogOut, ChevronDown, Utensils, Store, Wheat } from "lucide-react";
import { KbouffeLogoWhite } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useLocale } from "@kbouffe/module-core/ui";
import { createClient } from "@/lib/supabase/client";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeSelector } from "./ThemeSelector";

type NavbarRole = "guest" | "client" | "merchant";

// ── Audience dropdown entries ──────────────────────────────────────────────

const audienceLinks = [
    {
        href: "/pour-les-clients",
        icon: Utensils,
        label: "Pour les clients",
        desc: "Commandez dans les meilleurs restaurants",
        color: "text-brand-400",
        bg: "bg-brand-500/10",
    },
    {
        href: "/pour-les-restaurateurs",
        icon: Store,
        label: "Pour les restaurateurs",
        desc: "Gérez et développez votre établissement",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
    },
    {
        href: "/pour-les-agriculteurs",
        icon: Wheat,
        label: "Pour les agriculteurs",
        desc: "Vendez vos produits aux restaurants",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
] as const;

// ── Audience dropdown ──────────────────────────────────────────────────────

function AudienceDropdown({ onClose }: { onClose?: () => void }) {
    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-surface-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
            <div className="p-2">
                {audienceLinks.map(({ href, icon: Icon, label, desc, color, bg }) => (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                            <Icon size={17} className={color} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{label}</p>
                            <p className="text-xs text-surface-500">{desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="px-4 py-3 bg-white/3 border-t border-white/6">
                <Link
                    href="/register"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-colors"
                >
                    Créer un compte gratuit
                </Link>
            </div>
        </div>
    );
}

export function Navbar() {
    const { t } = useLocale();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAudienceOpen, setIsAudienceOpen] = useState(false);
    const [isMobileAudienceOpen, setIsMobileAudienceOpen] = useState(false);
    const [role, setRole] = useState<NavbarRole>("guest");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const publicNavLinks = [
        { href: "/#features", label: t.navbar.features },
        { href: "/#how-it-works", label: t.navbar.howItWorks },
        { href: "/partenaires", label: t.navbar.partners },
        { href: "/pricing", label: t.navbar.pricing },
        { href: "/stores", label: t.navbar.explore },
    ];

    const clientNavLinks = [
        { href: "/stores", label: t.navbar.explore },
        { href: "/contact", label: t.footer.contact },
        { href: "/pricing", label: t.navbar.pricing },
    ];

    const merchantNavLinks = [
        { href: "/dashboard", label: t.dashboard.title },
        { href: "/dashboard/orders", label: t.nav.orders },
        { href: "/dashboard/menu", label: t.nav.menu },
        { href: "/dashboard/settings", label: t.nav.settings },
        { href: "/stores", label: t.navbar.explore },
    ];

    const navLinks =
        role === "client"
            ? clientNavLinks
            : role === "merchant"
                ? merchantNavLinks
                : publicNavLinks;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsAudienceOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const resolveUserRole = async () => {
            const supabase = createClient();
            if (!supabase) {
                if (isMounted) setRole("guest");
                return;
            }

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                if (isMounted) setRole("guest");
                return;
            }

            const metadataRole = String(user.user_metadata?.role ?? "").toLowerCase();
            if (isMounted) {
                if (metadataRole === "merchant") {
                    setRole("merchant");
                } else if (metadataRole === "client" || metadataRole === "customer") {
                    setRole("client");
                } else {
                    setRole("client");
                }
            }
        };

        resolveUserRole();

        return () => {
            isMounted = false;
        };
    }, []);

    async function handleSignOut() {
        const supabase = createClient();
        if (!supabase) return;

        await supabase.auth.signOut();
        setIsMobileMenuOpen(false);
        setRole("guest");
        router.push("/");
        router.refresh();
    }

    const primaryActionHref = role === "merchant" ? "/dashboard" : "/stores";
    const primaryActionLabel = role === "merchant" ? t.dashboard.title : t.navbar.explore;

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-surface-950/80 backdrop-blur-xl border-b border-surface-800/50 py-3"
                    : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <KbouffeLogoWhite height={36} />
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {/* Audience dropdown — guests only */}
                        {role === "guest" && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsAudienceOpen((v) => !v)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                        isAudienceOpen
                                            ? "text-white bg-white/8"
                                            : "text-surface-300 hover:text-white hover:bg-white/5"
                                    )}
                                    aria-expanded={isAudienceOpen}
                                    aria-haspopup="true"
                                >
                                    Solutions
                                    <ChevronDown
                                        size={15}
                                        className={cn("transition-transform duration-200", isAudienceOpen && "rotate-180")}
                                    />
                                </button>
                                {isAudienceOpen && (
                                    <AudienceDropdown onClose={() => setIsAudienceOpen(false)} />
                                )}
                            </div>
                        )}

                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        {role !== "guest" ? (
                            <>
                                <Link
                                    href={primaryActionHref}
                                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40"
                                >
                                    {primaryActionLabel}
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-300 hover:text-white transition-colors"
                                >
                                    <LogOut size={16} />
                                    {t.topbar.signOut}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2.5 text-sm font-medium text-surface-300 hover:text-white transition-colors"
                                >
                                    {t.navbar.login}
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40"
                                >
                                    {t.navbar.getStarted}
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="hidden md:flex items-center gap-2 border-l border-white/10 ml-4 pl-4">
                        <LanguageSelector />
                        <ThemeSelector />
                    </div>

                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "md:hidden absolute top-full left-0 right-0 bg-surface-950/95 backdrop-blur-xl border-t border-surface-800/50 transition-all duration-300 overflow-hidden",
                    isMobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="p-4 flex flex-col gap-1">
                    {/* Audience section — guests only */}
                    {role === "guest" && (
                        <>
                            <button
                                onClick={() => setIsMobileAudienceOpen((v) => !v)}
                                className="flex items-center justify-between p-3 font-medium text-surface-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                <span>Solutions</span>
                                <ChevronDown
                                    size={15}
                                    className={cn("transition-transform duration-200", isMobileAudienceOpen && "rotate-180")}
                                />
                            </button>
                            {isMobileAudienceOpen && (
                                <div className="ml-2 pl-3 border-l border-white/10 flex flex-col gap-1 mb-1">
                                    {audienceLinks.map(({ href, icon: Icon, label, color, bg }) => (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                                        >
                                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", bg)}>
                                                <Icon size={14} className={color} />
                                            </div>
                                            <span className="text-sm font-medium text-surface-200">{label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="p-3 font-medium text-surface-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="h-px bg-surface-800 my-3" />
                    {role !== "guest" ? (
                        <button
                            className="p-3 font-medium text-surface-300 hover:text-white hover:bg-white/5 rounded-xl transition-all inline-flex items-center justify-center gap-2"
                            onClick={handleSignOut}
                        >
                            <LogOut size={16} />
                            {t.topbar.signOut}
                        </button>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="p-3 font-medium text-surface-300 text-center hover:text-white rounded-xl transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {t.navbar.login}
                            </Link>
                            <Link
                                href="/register"
                                className="bg-brand-500 text-white p-3 rounded-xl font-semibold text-center mt-1"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {t.navbar.getStarted}
                            </Link>
                        </>
                    )}

                    <div className="h-px bg-surface-800 my-3" />
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-medium text-surface-400">{t.locale?.label || "Langue"}</span>
                        <LanguageSelector />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-medium text-surface-400">{t.theme?.label || "Theme"}</span>
                        <ThemeSelector />
                    </div>
                </div>
            </div>
        </header>
    );
}
