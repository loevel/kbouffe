"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Send, Calendar } from "lucide-react";
import { MarketingStats, CouponsTable, CampaignsTable } from "@kbouffe/module-marketing";
import { useLocale } from "@kbouffe/module-core/ui";

export default function MarketingPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    {t.marketing.title}
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    {t.marketing.subtitle}
                </p>
            </div>

            {/* Upsell promo card */}
            <Link
                href="/dashboard/marketing/upsells"
                className="mb-6 flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 hover:shadow-md transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <Sparkles size={22} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-surface-900 dark:text-white">Upsells & Extras</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Suggérez des extras avant le paiement — +15 à 25% de panier moyen
                        </p>
                    </div>
                </div>
                <ArrowRight size={20} className="text-surface-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Social Publisher promo card */}
            <Link
                href="/dashboard/marketing/social"
                className="mb-6 flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-2xl border border-purple-200 dark:border-purple-500/20 hover:shadow-md transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Send size={22} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-surface-900 dark:text-white">Social Publisher</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Publiez sur Facebook, Instagram, TikTok & Telegram en un clic avec l'IA
                        </p>
                    </div>
                </div>
                <ArrowRight size={20} className="text-surface-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Content Calendar promo card */}
            <Link
                href="/dashboard/marketing/calendar"
                className="mb-6 flex items-center justify-between p-5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 rounded-2xl border border-pink-200 dark:border-pink-500/20 hover:shadow-md transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
                        <Calendar size={22} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-surface-900 dark:text-white">Calendrier de Contenu IA</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Planifiez une semaine entiere de publications en 1 clic
                        </p>
                    </div>
                </div>
                <ArrowRight size={20} className="text-surface-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </Link>

            <div className="space-y-6">
                <MarketingStats />
                <CouponsTable />
                <CampaignsTable />
            </div>
        </>
    );
}
