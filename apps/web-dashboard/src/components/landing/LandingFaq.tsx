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
            tag: "Questions frequentes",
            title: "Les questions qu'un gerant se pose avant de se lancer",
            description: "Tout ce que vous devez savoir pour demarrer sereinement avec Kbouffe.",
            ctaText: "Creer ma vitrine gratuite",
            faqItems: [
                {
                    question: "Est-ce que j'ai besoin d'un ordinateur ou d'un caissier dedie ?",
                    answer: "Non. Kbouffe est pense pour les etablissements qui tournent deja depuis un smartphone Android. Le gerant peut publier le menu, suivre les commandes et verifier les paiements depuis son telephone.",
                },
                {
                    question: "Comment Kbouffe gagne de l'argent si la plateforme est gratuite ?",
                    answer: "Kbouffe prend 5% sur chaque paiement Mobile Money effectue via la plateforme. C'est 6 fois moins que Glovo qui prend 30%. Vous gardez 95% de vos ventes. En plus, vous pouvez acheter des packs de visibilite optionnels pour booster vos ventes.",
                },
                {
                    question: "C'est quoi les packs de boost ?",
                    answer: "Ce sont des outils optionnels que vous achetez quand vous en avez besoin : visibilite en tete des resultats, SMS promotionnels a vos clients, banniere publicitaire sur la page d'accueil, statistiques avancees. Vous ne payez que ce qui vous est utile, quand vous le voulez.",
                },
                {
                    question: "Mes clients utilisent surtout WhatsApp. Est-ce que ca suffit ?",
                    answer: "Oui, c'est meme un point fort. Le lien Kbouffe est fait pour etre partage dans les statuts, les groupes, les messages directs et via QR code sur place. Vos clients n'ont rien a installer.",
                },
                {
                    question: "Et si mon etablissement est petit ou encore tres informel ?",
                    answer: "C'est justement la cible ideale. Si vous avez un smartphone et Mobile Money, vous pouvez demarrer en 2 minutes. Pas besoin d'etre grand — un tourne-dos ou un snack gagne autant en organisation qu'un grand restaurant.",
                },
                {
                    question: "Est-ce que je suis engage avec un contrat ?",
                    answer: "Aucun engagement. La vitrine est gratuite pour toujours. Les packs de boost sont achetes a l'unite, sans abonnement obligatoire. Vous arretez quand vous voulez.",
                },
            ] as FaqItem[],
        }
        : {
            tag: "FAQ",
            title: "The questions an operator asks before starting",
            description: "Everything you need to know to get started with Kbouffe.",
            ctaText: "Create my free storefront",
            faqItems: [
                {
                    question: "Do I need a computer or a dedicated cashier?",
                    answer: "No. Kbouffe is built for businesses already run from an Android smartphone. The owner can publish the menu, track orders and verify payments directly from the phone.",
                },
                {
                    question: "How does Kbouffe make money if the platform is free?",
                    answer: "Kbouffe takes 5% on each Mobile Money payment made through the platform. That's 6 times less than Glovo which takes 30%. You keep 95% of your sales. Plus, you can buy optional visibility packs to boost your business.",
                },
                {
                    question: "What are boost packs?",
                    answer: "Optional tools you buy when needed: top search results placement, SMS promotions to your customers, homepage banner ads, advanced analytics. You only pay for what you need, when you need it.",
                },
                {
                    question: "My customers mainly use WhatsApp. Is that enough?",
                    answer: "Yes, and it is actually a strength. The Kbouffe link is designed to be shared in statuses, groups, direct messages and via QR code on-site. Your customers don't need to install anything.",
                },
                {
                    question: "What if my business is small or still very informal?",
                    answer: "That's actually the ideal fit. If you have a smartphone and Mobile Money, you can start in 2 minutes. Small eateries and snack bars gain just as much in organization as large restaurants.",
                },
                {
                    question: "Am I locked into a contract?",
                    answer: "No commitment whatsoever. The storefront is free forever. Boost packs are purchased individually, no mandatory subscription. You stop whenever you want.",
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
                        href="/register/restaurant"
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
