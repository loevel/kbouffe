"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { KbouffeLogoWhite } from "@/components/brand/Logo";
import { useLocale } from "@kbouffe/module-core/ui";

export function Footer() {
    const { t } = useLocale();
    const footerLinks = {
        produit: [
            { label: t.footer.features, href: "/#features" },
            { label: t.footer.howItWorks, href: "/#how-it-works" },
            { label: t.footer.pricing, href: "/pricing" },
            { label: t.footer.explore, href: "/stores" },
        ],
        partenaires: [
            { label: t.footer.partners, href: "/partenaires" },
        ],
        entreprise: [
            { label: t.footer.about, href: "/contact" },
            { label: t.footer.contact, href: "/contact" },
        ],
        legal: [
            { label: t.footer.terms, href: "/terms" },
            { label: t.footer.privacy, href: "/privacy" },
        ],
    };
    return (
        <footer className="bg-surface-950 border-t border-surface-800/50">
            {/* CTA Banner */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-500" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="container mx-auto px-4 md:px-6 py-20 md:py-24 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                            {t.footer.ctaTitle}
                        </h2>
                        <p className="text-brand-100 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
                            {t.footer.ctaDesc}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-600 hover:bg-surface-50 rounded-xl text-lg font-bold transition-all hover:-translate-y-0.5 shadow-xl"
                            >
                                {t.footer.ctaButton}
                                <ArrowRight size={20} />
                            </Link>
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-xl text-lg font-semibold transition-all"
                            >
                                {t.footer.ctaPricing}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer content */}
            <div className="container mx-auto px-4 md:px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-3">
                        <Link href="/" className="flex items-center mb-5">
                            <KbouffeLogoWhite height={36} />
                        </Link>
                        <p className="text-surface-400 max-w-sm leading-relaxed mb-6">
                            {t.footer.tagline}
                        </p>
                    </div>

                    {/* Links */}
                    <div className="md:col-span-2">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t.footer.product}</h3>
                        <ul className="space-y-3">
                            {footerLinks.produit.map((link) => (
                                <li key={link.href + link.label}>
                                    <Link href={link.href} className="text-surface-400 hover:text-white transition-colors text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Rejoindre</h3>
                        <ul className="space-y-3">
                            {footerLinks.partenaires.map((link) => (
                                <li key={link.href + link.label}>
                                    <Link href={link.href} className="text-surface-400 hover:text-white transition-colors text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t.footer.company}</h3>
                        <ul className="space-y-3">
                            {footerLinks.entreprise.map((link) => (
                                <li key={link.href + link.label}>
                                    <Link href={link.href} className="text-surface-400 hover:text-white transition-colors text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-3">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t.footer.legal}</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href + link.label}>
                                    <Link href={link.href} className="text-surface-400 hover:text-white transition-colors text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-surface-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-surface-500">
                    <p>&copy; {new Date().getFullYear()} Kbouffe. {t.footer.allRights}</p>
                    <p className="flex items-center gap-1.5">
                        {t.footer.madeWith.split("\u2665")[0]}<Heart size={14} className="text-brand-500" />{t.footer.madeWith.split("\u2665")[1]}
                    </p>
                </div>
            </div>
        </footer>
    );
}
