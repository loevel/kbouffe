"use client";

/**
 * CookieBanner — IMP-001
 * Bannière de consentement cookies / localStorage conforme à la réglementation
 * camerounaise. S'affiche uniquement si aucun choix n'a encore été enregistré.
 *
 * Note légale : le stockage du thème (localStorage 'kbouffe-theme') est
 * considéré comme essentiel au fonctionnement et ne nécessite pas de
 * consentement préalable.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "kbouffe-cookie-consent";

export function CookieBanner() {
    const [visible, setVisible] = useState(false);

    // Lecture du consentement stocké — exécutée uniquement côté client
    useEffect(() => {
        if (!localStorage.getItem(CONSENT_KEY)) {
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    const accepter = () => {
        localStorage.setItem(CONSENT_KEY, "accepted");
        setVisible(false);
    };

    const refuser = () => {
        localStorage.setItem(CONSENT_KEY, "refused");
        setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label="Bannière de consentement cookies"
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface-900 dark:bg-surface-800 text-white shadow-2xl"
        >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icône */}
                <div className="shrink-0 hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-white/10">
                    <Cookie size={20} className="text-white/80" />
                </div>

                {/* Texte */}
                <div className="flex-1 space-y-1 text-sm">
                    <p className="font-semibold text-white leading-snug">
                        Nous utilisons des cookies et le stockage local pour améliorer votre
                        expérience sur Kbouffe.
                    </p>
                    <p className="text-white/60 text-xs leading-relaxed">
                        <span className="text-white/80 font-medium">Note :</span> le stockage
                        du thème (essentiel au fonctionnement) ne nécessite pas de
                        consentement.{" "}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-2 hover:text-white transition-colors"
                        >
                            Politique de confidentialité
                        </Link>{" "}
                        ·{" "}
                        <Link
                            href="/cookies"
                            className="underline underline-offset-2 hover:text-white transition-colors"
                        >
                            Politique cookies
                        </Link>
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                        onClick={refuser}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/20 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        Refuser
                    </button>
                    <button
                        onClick={accepter}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-sm font-bold text-white transition-all shadow-lg shadow-brand-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                        Accepter
                    </button>

                    {/* Fermeture discrète (refus implicite jusqu'au prochain chargement) */}
                    <button
                        onClick={refuser}
                        aria-label="Fermer la bannière"
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
