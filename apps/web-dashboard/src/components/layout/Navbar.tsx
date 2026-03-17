"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { KbouffeLogoWhite } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { createClient } from "@/lib/supabase/client";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeSelector } from "./ThemeSelector";

type NavbarRole = "guest" | "client" | "merchant";

export function Navbar() {
    const { t } = useLocale();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [role, setRole] = useState<NavbarRole>("guest");

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
                    isMobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="p-4 flex flex-col gap-1">
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
