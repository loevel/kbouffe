"use client";

import Link from "next/link";
import { ShoppingBag, Store, Check, ArrowRight, Smartphone, WalletCards } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";

export function ForWho() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "Qui gagne tout de suite ?",
            title: "Kbouffe parle au patron et a ses clients en meme temps",
            description:
                "Le proprietaire garde une operation simple. Le client, lui, recoit enfin une experience de commande claire. C'est ce double benefice qui fait adopter le produit vite.",
            popular: "Le plus rentable au depart",
            cards: [
                {
                    icon: ShoppingBag,
                    badge: "Cote client",
                    badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
                    title: "Vos clients commandent sans vous appeler 6 fois",
                    desc: "Ils voient le menu, les prix, les options et le mode de paiement sans passer par un aller-retour WhatsApp ou un appel manqué.",
                    features: [
                        "Lien simple a ouvrir depuis WhatsApp",
                        "QR code a scanner sur la table ou au comptoir",
                        "Commande claire avant meme d'arriver en cuisine",
                    ],
                    cta: "Commencer gratuitement",
                    href: "/register/restaurant",
                    gradient: "from-blue-500/20 to-transparent",
                    ctaClass: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25",
                    iconBg: "bg-blue-500/10 text-blue-400",
                },
                {
                    icon: Store,
                    badge: "Cote gerant",
                    badgeColor: "text-brand-400 bg-brand-400/10 border-brand-400/20",
                    title: "Votre etablissement reste leger, mais beaucoup mieux organise",
                    desc: "Pas besoin d'un ordinateur ou d'une equipe IT. Le telephone Android du gerant suffit pour publier, encaisser et suivre le rush du midi.",
                    features: [
                        "Un smartphone Android suffit pour piloter l'activite",
                        "Les paiements MoMo se rapprochent plus facilement",
                        "Les commandes du midi sont centralisees au meme endroit",
                    ],
                    cta: "Commencer gratuitement",
                    href: "/register/restaurant",
                    gradient: "from-brand-500/20 to-transparent",
                    ctaClass: "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25",
                    iconBg: "bg-brand-500/10 text-brand-400",
                    featured: true,
                },
            ],
            operatorNotes: [
                { icon: Smartphone, text: "Sans logiciel lourd ni materiel complique" },
                { icon: WalletCards, text: "Pensé pour les etablissements qui utilisent deja Mobile Money" },
            ],
        }
        : {
            tag: "Who wins first?",
            title: "Kbouffe speaks to the owner and the customer at the same time",
            description:
                "The owner keeps operations simple. The customer finally gets a clear ordering flow. That dual benefit is what drives early adoption.",
            popular: "Best early return",
            cards: [
                {
                    icon: ShoppingBag,
                    badge: "Customer side",
                    badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
                    title: "Your customers order without calling you six times",
                    desc: "They can see the menu, prices, options and payment method without a back-and-forth on WhatsApp or a missed phone call.",
                    features: [
                        "Simple link opened from WhatsApp",
                        "QR code to scan on the table or at the counter",
                        "Clear order before it even reaches the kitchen",
                    ],
                    cta: "Start free",
                    href: "/register/restaurant",
                    gradient: "from-blue-500/20 to-transparent",
                    ctaClass: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25",
                    iconBg: "bg-blue-500/10 text-blue-400",
                },
                {
                    icon: Store,
                    badge: "Owner side",
                    badgeColor: "text-brand-400 bg-brand-400/10 border-brand-400/20",
                    title: "Your business stays light, but becomes much better organized",
                    desc: "No computer or IT team required. The owner's Android phone is enough to publish, collect payment, and handle the lunch rush.",
                    features: [
                        "One Android smartphone can run operations",
                        "MoMo payments become easier to reconcile",
                        "Lunch orders stay centralized in one place",
                    ],
                    cta: "Start free",
                    href: "/register/restaurant",
                    gradient: "from-brand-500/20 to-transparent",
                    ctaClass: "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25",
                    iconBg: "bg-brand-500/10 text-brand-400",
                    featured: true,
                },
            ],
            operatorNotes: [
                { icon: Smartphone, text: "No heavy software or complicated hardware" },
                { icon: WalletCards, text: "Designed for businesses already using Mobile Money" },
            ],
        };

    const cards = [
        {
            icon: copy.cards[0].icon,
            badge: copy.cards[0].badge,
            badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
            title: copy.cards[0].title,
            desc: copy.cards[0].desc,
            features: copy.cards[0].features,
            cta: copy.cards[0].cta,
            href: copy.cards[0].href,
            gradient: copy.cards[0].gradient,
            ctaClass: copy.cards[0].ctaClass,
            iconBg: copy.cards[0].iconBg,
            featured: false,
        },
        {
            icon: copy.cards[1].icon,
            badge: copy.cards[1].badge,
            badgeColor: copy.cards[1].badgeColor,
            title: copy.cards[1].title,
            desc: copy.cards[1].desc,
            features: copy.cards[1].features,
            cta: copy.cards[1].cta,
            href: copy.cards[1].href,
            gradient: copy.cards[1].gradient,
            ctaClass: copy.cards[1].ctaClass,
            iconBg: copy.cards[1].iconBg,
            featured: true,
        },
    ];

    return (
        <section className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-brand-500/5 blur-[120px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-surface-800 text-surface-300 text-sm font-medium mb-6">
                        {copy.tag}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
                        {copy.title}
                    </h2>
                    <p className="text-lg md:text-xl text-surface-400 leading-relaxed">
                        {copy.description}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {copy.operatorNotes.map((note) => (
                            <span key={note.text} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-surface-200">
                                <note.icon size={16} className="text-brand-400" />
                                {note.text}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {cards.map((card, i) => (
                        <div
                            key={i}
                            className={`relative group rounded-2xl border p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                                card.featured
                                    ? "bg-surface-900 border-brand-500/40 shadow-xl shadow-brand-500/10"
                                    : "bg-surface-900/60 border-surface-800 hover:border-surface-700"
                            }`}
                        >
                            {/* Glow on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                            {/* Popular badge */}
                            {card.featured && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-bold whitespace-nowrap shadow-lg shadow-brand-500/30">
                                        ⭐ {copy.popular}
                                    </span>
                                </div>
                            )}

                            <div className="relative z-10 flex flex-col flex-1">
                                {/* Icon + badge */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                                        <card.icon size={22} />
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                                        {card.badge}
                                    </span>
                                </div>

                                {/* Title + desc */}
                                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                                <p className="text-surface-400 text-sm leading-relaxed mb-6">{card.desc}</p>

                                {/* Features */}
                                <ul className="space-y-2 mb-8">
                                    {card.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-2.5 text-sm text-surface-300">
                                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-surface-700 flex items-center justify-center">
                                                <Check size={10} strokeWidth={3} className="text-surface-300" />
                                            </span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <div className="mt-auto">
                                    <Link
                                        href={card.href}
                                        className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 ${card.ctaClass}`}
                                    >
                                        {card.cta}
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
