"use client";

import Link from "next/link";
import Image from "next/image";
import { ClipboardEdit, Share2, UtensilsCrossed, ArrowRight } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

export function HowItWorks() {
    const { t } = useLocale();

    const steps = [
        {
            number: "01",
            title: t.landing.howStep1Title,
            description: t.landing.howStep1Desc,
            icon: ClipboardEdit,
            dishes: [
                { name: t.landing.howDish1, price: "4 500 FCFA", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&q=80" },
                { name: t.landing.howDish2, price: "6 500 FCFA", img: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7a18?w=150&q=80" },
                { name: t.landing.howDish3, price: "5 500 FCFA", img: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=150&q=80" },
            ],
        },
        {
            number: "02",
            title: t.landing.howStep2Title,
            description: t.landing.howStep2Desc,
            icon: Share2,
            preview: {
                url: "kbouffe.com/le-tchop-gourmet",
                img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80",
                restaurant: "Le Tchop Gourmet",
                rating: "4.8",
            },
        },
        {
            number: "03",
            title: t.landing.howStep3Title,
            description: t.landing.howStep3Desc,
            icon: UtensilsCrossed,
            order: {
                customer: "Ariel M.",
                items: [
                    { name: "Ndole Viande", qty: 1, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&q=80" },
                    { name: "Jus Gingembre", qty: 2, img: "https://images.unsplash.com/photo-1622597467836-f3e77763be09?w=80&q=80" },
                ],
                total: "6 500 FCFA",
                payment: "MTN MoMo ✓",
            },
        },
    ];

    return (
        <section id="how-it-works" className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-brand-500/5 blur-[100px]" />
            <div className="absolute bottom-[10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-surface-800 text-surface-300 text-sm font-medium mb-6">
                        {t.landing.howTag}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
                        {t.landing.howTitle}
                    </h2>
                    <p className="text-lg md:text-xl text-surface-400 leading-relaxed">
                        {t.landing.howDesc}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="relative group">
                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-surface-700 to-transparent z-0" />
                            )}

                            <div className="relative bg-surface-900 border border-surface-800 rounded-2xl p-6 transition-all duration-300 hover:border-surface-700 hover:shadow-2xl hover:shadow-brand-500/5">
                                {/* Step header */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-brand-400 font-bold text-lg">{step.number}</span>
                                    </div>
                                    <step.icon className="h-5 w-5 text-surface-400 group-hover:text-brand-400 transition-colors" />
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                                <p className="text-surface-400 leading-relaxed mb-5 text-sm">{step.description}</p>

                                {/* Step 1 — Menu items with photos */}
                                {step.dishes && (
                                    <div className="space-y-2.5">
                                        {step.dishes.map((dish) => (
                                            <div key={dish.name} className="flex items-center gap-3 bg-surface-800 rounded-xl p-2.5">
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                                    <Image src={dish.img} alt={dish.name} fill className="object-cover" unoptimized />
                                                </div>
                                                <span className="text-surface-200 text-sm font-medium flex-1">{dish.name}</span>
                                                <span className="text-brand-400 text-xs font-semibold whitespace-nowrap">{dish.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Step 2 — Store preview */}
                                {step.preview && (
                                    <div className="rounded-xl overflow-hidden border border-surface-700">
                                        <div className="relative h-28">
                                            <Image src={step.preview.img} alt={step.preview.restaurant} fill className="object-cover" unoptimized />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                                                <span className="text-white text-xs font-bold">{step.preview.restaurant}</span>
                                                <span className="text-amber-400 text-xs">★ {step.preview.rating}</span>
                                            </div>
                                        </div>
                                        <div className="bg-surface-800 px-3 py-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-surface-400 text-xs truncate">{step.preview.url}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 — Incoming order */}
                                {step.order && (
                                    <div className="bg-surface-800 rounded-xl p-3 border border-surface-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-white text-xs font-bold">{t.landing.howOrderReceived}</p>
                                                <p className="text-surface-400 text-[11px]">par {step.order.customer}</p>
                                            </div>
                                            <div className="px-2 py-0.5 bg-green-500/20 rounded-full text-green-400 text-[10px] font-semibold">
                                                {step.order.payment}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {step.order.items.map((item) => (
                                                <div key={item.name} className="flex items-center gap-2.5">
                                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                                        <Image src={item.img} alt={item.name} fill className="object-cover" unoptimized />
                                                    </div>
                                                    <span className="text-surface-300 text-xs flex-1">{item.name}</span>
                                                    <span className="text-surface-400 text-[11px]">×{item.qty}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-surface-700">
                                            <span className="text-surface-400 text-xs">Total</span>
                                            <span className="text-brand-400 text-sm font-bold">{step.order.total}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <Link
                        href="/register/client"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-lg font-semibold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5"
                    >
                        {t.landing.howCta}
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
