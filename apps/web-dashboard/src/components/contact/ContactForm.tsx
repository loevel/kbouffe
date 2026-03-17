"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useLocale, Turnstile } from "@kbouffe/module-core/ui";

export function ContactForm() {
    const { t } = useLocale();
    const [submitted, setSubmitted] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    if (submitted) {
        return (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <Send className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
                    {t.contact.messageSent}
                </h3>
                <p className="text-surface-600 dark:text-surface-400">
                    {t.contact.messageSentDesc}
                </p>
            </div>
        );
    }

    return (
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
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        {t.contact.subject}
                    </label>
                    <select
                        id="subject"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    >
                        <option value="">{t.contact.selectSubject}</option>
                        <option value="general">{t.contact.subjectGeneral}</option>
                        <option value="support">{t.contact.subjectSupport}</option>
                        <option value="partnership">{t.contact.subjectPartner}</option>
                        <option value="billing">{t.contact.subjectBilling}</option>
                        <option value="other">{t.contact.subjectOther}</option>
                    </select>
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
            </form>
        </div>
    );
}
