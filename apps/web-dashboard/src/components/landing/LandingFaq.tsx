"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";

interface FaqItem {
    question: string;
    answer: string;
}

export function LandingFaq() {
    const { locale } = useLocale();
    const [openIndex, setOpenIndex] = useState(0);

    const copy = locale === "fr"
        ? {
            tag: "Objections levees",
            title: "Les questions qu'un gerant se pose avant de se lancer",
            description: "Si ton client ideal hesite, ce n'est pas toujours par manque d'interet. C'est souvent parce qu'il veut savoir si l'outil reste simple, rentable et adapte a sa facon de travailler.",
            ctaText: "Voir les tarifs complets",
            faqItems: [
                {
                    question: "Est-ce que j'ai besoin d'un ordinateur ou d'un caissier dedie ?",
                    answer: "Non. Kbouffe est pense pour les etablissements qui tournent deja depuis un smartphone Android. Le gerant peut publier le menu, suivre les commandes et verifier les paiements depuis son telephone.",
                },
                {
                    question: "Pourquoi un abonnement et pas une commission sur mes ventes ?",
                    answer: "Parce que ce marche a besoin de marges simples a comprendre. Une commission penalise les etablissements qui vendent bien. Un abonnement fixe garde vos ventes intactes et rend le cout previsible.",
                },
                {
                    question: "Mes clients utilisent surtout WhatsApp. Est-ce que ca suffit ?",
                    answer: "Oui, c'est meme un point fort. Le lien Kbouffe est fait pour etre partage dans les statuts, les groupes, les messages directs et via QR code sur place.",
                },
                {
                    question: "Et si mon etablissement est petit ou encore tres informel ?",
                    answer: "C'est justement la cible la plus interessante si vous avez deja un smartphone, Mobile Money et un probleme de desorganisation des commandes. Vous n'avez pas besoin d'etre grand pour gagner du temps et vendre plus proprement.",
                },
            ] as FaqItem[],
        }
        : {
            tag: "Objections handled",
            title: "The questions an operator asks before starting",
            description: "If your ideal customer hesitates, it is not always lack of interest. They usually want to know whether the tool stays simple, profitable and adapted to how they already work.",
            ctaText: "See full pricing",
            faqItems: [
                {
                    question: "Do I need a computer or a dedicated cashier?",
                    answer: "No. Kbouffe is built for businesses already run from an Android smartphone. The owner can publish the menu, track orders and verify payments directly from the phone.",
                },
                {
                    question: "Why a subscription instead of commission on sales?",
                    answer: "Because this market needs margins that stay easy to understand. Commission punishes the businesses that sell well. A fixed subscription keeps sales intact and makes cost predictable.",
                },
                {
                    question: "My customers mainly use WhatsApp. Is that enough?",
                    answer: "Yes, and it is actually a strength. The Kbouffe link is designed to be shared in statuses, groups, direct messages and via QR code on-site.",
                },
                {
                    question: "What if my business is small or still very informal?",
                    answer: "That is often the best early fit if you already have a smartphone, Mobile Money and a messy ordering process. You do not need to be large to gain time and sell more cleanly.",
                },
            ] as FaqItem[],
        };

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <section className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
                        {copy.tag}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                        {copy.title}
                    </h2>
                    <p className="text-lg text-surface-400 leading-relaxed">
                        {copy.description}
                    </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-3 mb-12">
                    {copy.faqItems.map((item, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-surface-800 overflow-hidden transition-all duration-300"
                        >
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full px-6 py-4 flex items-center justify-between bg-surface-900 hover:bg-surface-800 transition-colors"
                            >
                                <span className="text-left text-base font-semibold text-white">
                                    {item.question}
                                </span>
                                <ChevronDown
                                    size={20}
                                    className={`text-brand-400 flex-shrink-0 transition-transform duration-300 ${
                                        openIndex === index ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {openIndex === index && (
                                <div className="px-6 py-4 bg-surface-900/50 border-t border-surface-800">
                                    <p className="text-surface-300 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-center">
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-500/25"
                    >
                        {copy.ctaText}
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
}