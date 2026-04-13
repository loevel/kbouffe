"use client";

import { useState } from "react";
import { Send, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocale, Turnstile } from "@kbouffe/module-core/ui";

export function ContactForm() {
    const { t, locale } = useLocale();
    const [submitted, setSubmitted] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [email, setEmail] = useState("");

    const successMessages = locale === "fr"
        ? {
            title: "Message reçu ! 🎉",
            desc: `On a bien reçu votre message sur ${email || "votre email"}`,
            timeline: "Réponse prévue: dans ~2 heures (jours ouvrables)",
            tips: [
                "Vérifiez votre spam (au cas où)",
                "On vous répond sur le même email",
            ],
            nextActions: [
                { label: "Voir les tarifs", href: "/pricing" },
                { label: "Commencer gratuitement", href: "/register/restaurant" },
                { label: "FAQ", href: "/contact#faq" },
            ]
        }
        : {
            title: "Message received! 🎉",
            desc: `We got your message at ${email || "your email"}`,
            timeline: "Expected response: in ~2 hours (business days)",
            tips: [
                "Check your spam folder just in case",
                "We'll reply to the same email address",
            ],
            nextActions: [
                { label: "View pricing", href: "/pricing" },
                { label: "Start free", href: "/register/restaurant" },
                { label: "FAQ", href: "/contact#faq" },
            ]
        };

    if (submitted) {
        return (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 md:p-12">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                        <Send className="h-7 w-7 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                        {successMessages.title}
                    </h3>
                    <p className="text-surface-600 dark:text-surface-400 mb-4">
                        {successMessages.desc}
                    </p>
                    <div className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            ⏱️ {successMessages.timeline}
                        </p>
                    </div>
                </div>

                <div className="space-y-4 mb-8 text-sm text-surface-600 dark:text-surface-400">
                    {successMessages.tips.map((tip, i) => (
                        <p key={i} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold mt-0.5">•</span>
                            {tip}
                        </p>
                    ))}
                </div>

                <div className="border-t border-surface-200 dark:border-surface-800 pt-8">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white mb-4">
                        {locale === "fr" ? "En attendant, explorez Kbouffe :" : "While you wait, explore Kbouffe:"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {successMessages.nextActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700"
                            >
                                <span className="text-sm font-medium">{action.label}</span>
                                <ArrowRight size={14} />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const quickFaqItems = locale === "fr"
        ? [
            { q: "Combien ça coûte ?", href: "/pricing" },
            { q: "Combien de temps pour démarrer ?", text: "2 minutes, sans carte bancaire" },
            { q: "Vous offrez du support ?", text: "Oui, WhatsApp + email 24/7" },
        ]
        : [
            { q: "How much does it cost?", href: "/pricing" },
            { q: "How long to set up?", text: "2 minutes, no credit card" },
            { q: "Do you offer support?", text: "Yes, WhatsApp + email 24/7" },
        ];

    return (
        <div className="space-y-6">
            {/* Quick FAQ Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-4">
                    {locale === "fr" ? "Réponses rapides :" : "Quick answers:"}
                </p>
                <div className="space-y-3">
                    {quickFaqItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">→</span>
                            <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{item.q}</p>
                                {item.href ? (
                                    <Link href={item.href} className="text-xs text-blue-600 dark:text-blue-300 hover:underline">
                                        {locale === "fr" ? "Voir tarifs" : "View pricing"}
                                    </Link>
                                ) : (
                                    <p className="text-xs text-blue-700 dark:text-blue-200">{item.text}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-200 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    {locale === "fr" ? "Besoin d'autre chose ? Remplissez le formulaire ci-dessous." : "Need something else? Fill out the form below."}
                </p>
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 shadow-sm">
                <form
                    className="space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSubmitted(true);
                    }}
                >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            {t.contact.fullName}
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Jean Dupont"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            {t.contact.emailField}
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                        {locale === "fr" ? "Qui êtes-vous ?" : "What brings you here?"}
                    </label>
                    <div className="space-y-2">
                        {(locale === "fr"
                            ? [
                                { value: "prospect", label: "Je suis propriétaire de restaurant (intéressé)", desc: "Je veux découvrir Kbouffe" },
                                { value: "user", label: "Je suis utilisateur actuel", desc: "J'ai besoin de support technique" },
                                { value: "partnership", label: "Je veux un partenariat", desc: "Revendeur, intégration, etc." },
                                { value: "other", label: "Autre", desc: "" },
                            ]
                            : [
                                { value: "prospect", label: "I'm a restaurant owner (interested)", desc: "I want to learn about Kbouffe" },
                                { value: "user", label: "I'm a current user", desc: "I need technical support" },
                                { value: "partnership", label: "I want to partner", desc: "Reseller, integration, etc." },
                                { value: "other", label: "Other", desc: "" },
                            ]
                        ).map((option) => (
                            <label key={option.value} className="flex items-start gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="subject"
                                    value={option.value}
                                    required
                                    className="mt-1 w-4 h-4 text-brand-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-surface-900 dark:text-white">{option.label}</p>
                                    {option.desc && <p className="text-xs text-surface-500 dark:text-surface-400">{option.desc}</p>}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        {t.contact.message}
                    </label>
                    <textarea
                        id="message"
                        rows={5}
                        placeholder={t.contact.messagePlaceholder}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                    />
                </div>

                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onVerify={setTurnstileToken}
                        theme="auto"
                        className="flex justify-center"
                    />
                )}

                <button
                    type="submit"
                    disabled={!turnstileToken && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center justify-center gap-2"
                >
                    <Send size={18} />
                    {t.contact.sendMessage}
                </button>

                <div className="text-center text-xs text-surface-500 dark:text-surface-400 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p>
                        <span className="text-green-500 font-bold">⏱️</span>{" "}
                        {locale === "fr"
                            ? "Réponse moyenne : 2 heures (jours ouvrables)"
                            : "Average response: 2 hours (business days)"
                        }
                    </p>
                </div>
            </form>
            </div>
        </div>
    );
}
