"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    CheckCircle2,
    ChefHat,
    Clock,
    ClipboardList,
    Home,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";

// ── Animations ────────────────────────────────────────────────────────────────
// Simple CSS-based confetti / pulse handled via Tailwind animations.

// ── Order status timeline step ────────────────────────────────────────────────
function TimelineStep({
    label,
    desc,
    active,
    done,
}: {
    label: string;
    desc: string;
    active: boolean;
    done: boolean;
}) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
                <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        done
                            ? "bg-brand-500 text-white"
                            : active
                            ? "bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse"
                            : "bg-surface-100 dark:bg-surface-800 text-surface-400"
                    }`}
                >
                    {done ? <CheckCircle2 size={14} /> : ""}
                </span>
                {/* Connector line */}
                <div className={`w-0.5 h-8 mt-1 transition-colors ${done ? "bg-brand-500" : "bg-surface-100 dark:bg-surface-800"}`} />
            </div>
            <div className="pt-1.5 pb-6">
                <p className={`font-semibold text-sm ${active || done ? "text-surface-900 dark:text-white" : "text-surface-400 dark:text-surface-600"}`}>
                    {label}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{desc}</p>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ConfirmationPageClient() {
    const searchParams   = useSearchParams();
    const orderId        = searchParams.get("orderId");
    const restaurantName = searchParams.get("restaurant") ?? "le restaurant";
    const totalParam     = searchParams.get("total");
    const total          = totalParam ? parseInt(totalParam, 10) : null;
    const deliveryType   = searchParams.get("deliveryType") ?? "delivery";

    const [visible, setVisible] = useState(false);

    // Slight entrance delay for the success animation
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    // Short order ref
    const orderRef = orderId
        ? `#KB-${orderId.slice(-6).toUpperCase()}`
        : "#KB-??????";

    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col">
            {/* ── Nav ──────────────────────────────────────────────────── */}
            <header className="bg-white/95 dark:bg-surface-950/95 border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-brand-500 text-white p-1.5 rounded-lg">
                            <ChefHat size={16} />
                        </div>
                        <span className="font-bold text-surface-900 dark:text-white">Kbouffe</span>
                    </Link>
                </div>
            </header>

            {/* ── Content ──────────────────────────────────────────────── */}
            <main
                className={`flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 transition-all duration-500 ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
            >
                {/* ── Success banner ───────────────────────────────────── */}
                <div className="text-center mb-10">
                    <div className="relative inline-flex">
                        <span className="w-24 h-24 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                            <CheckCircle2 size={52} className="text-brand-500" strokeWidth={1.5} />
                        </span>
                        <span className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Sparkles size={16} className="text-yellow-900" />
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-surface-900 dark:text-white mt-5 mb-2">
                        Commande confirmée !
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 text-base">
                        Votre commande chez <strong className="text-surface-900 dark:text-white">{decodeURIComponent(restaurantName)}</strong> a bien été enregistrée.
                    </p>

                    {/* Order number + total */}
                    <div className="mt-5 inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6 px-6 py-4 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                        <div className="text-center">
                            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Numéro de commande</p>
                            <p className="font-extrabold text-xl text-surface-900 dark:text-white mt-0.5">{orderRef}</p>
                        </div>
                        {total !== null && !isNaN(total) && (
                            <>
                                <div className="hidden sm:block w-px h-10 bg-surface-200 dark:bg-surface-700" />
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Montant total</p>
                                    <p className="font-extrabold text-xl text-surface-900 dark:text-white mt-0.5">{formatCFA(total)}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ETA */}
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 bg-brand-50 dark:bg-brand-500/10 px-4 py-2 rounded-full">
                        <Clock size={14} className="text-brand-500" />
                        <span>
                            {deliveryType === "delivery"
                                ? <>Livraison estimée dans <strong className="text-surface-900 dark:text-white">30 – 50 min</strong></>
                                : deliveryType === "dine_in"
                                ? <>Vos plats seront prêts dans <strong className="text-surface-900 dark:text-white">20 – 35 min</strong></>
                                : <>Prêt à retirer dans <strong className="text-surface-900 dark:text-white">20 – 35 min</strong></>}
                        </span>
                    </div>
                </div>

                {/* ── Status timeline ──────────────────────────────────── */}
                <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 mb-6">
                    <h2 className="font-bold text-surface-900 dark:text-white mb-5">Suivi de la commande</h2>
                    {deliveryType === "pickup" ? (
                        <>
                            <TimelineStep label="Commande reçue"  desc="Votre commande a été enregistrée"                  done active={false} />
                            <TimelineStep label="En préparation"  desc="Le restaurant prépare vos plats"                 done={false} active />
                            <TimelineStep label="Prête à retirer" desc="Vous pouvez venir récupérer votre commande"     done={false} active={false} />
                            <TimelineStep label="Récupérée"       desc="Commande récupérée avec succès"                  done={false} active={false} />
                        </>
                    ) : deliveryType === "dine_in" ? (
                        <>
                            <TimelineStep label="Commande reçue"  desc="Votre commande a été enregistrée"                  done active={false} />
                            <TimelineStep label="En préparation"  desc="La cuisine prépare vos plats"                    done={false} active />
                            <TimelineStep label="Prête"           desc="Votre commande est prête"                       done={false} active={false} />
                            <TimelineStep label="Servie"         desc="Vos plats ont été servis à votre table"          done={false} active={false} />
                        </>
                    ) : (
                        <>
                            <TimelineStep label="Commande reçue"      desc="Votre commande a été enregistrée"         done active={false} />
                            <TimelineStep label="En préparation"      desc="Le restaurant prépare vos plats"          done={false} active />
                            <TimelineStep label="En cours de livraison" desc="Un livreur est en route vers vous"      done={false} active={false} />
                            <TimelineStep label="Livrée"              desc="Votre commande vous a été remise"         done={false} active={false} />
                        </>
                    )}
                </section>

                {/* ── CTAs ─────────────────────────────────────────────── */}
                <div className="space-y-3">
                    {orderId ? (
                        <Link
                            href={`/stores/orders/${orderId}`}
                            className="w-full h-13 py-3.5 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            <ClipboardList size={18} />
                            Suivre ma commande
                        </Link>
                    ) : (
                        <Link
                            href="/stores/orders"
                            className="w-full h-13 py-3.5 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            <ClipboardList size={18} />
                            Suivre ma commande
                        </Link>
                    )}

                    <Link
                        href="/stores"
                        className="w-full h-13 py-3.5 flex items-center justify-center gap-2 bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-900 dark:text-white font-semibold rounded-2xl border border-surface-200 dark:border-surface-700 transition-colors"
                    >
                        <RotateCcw size={16} />
                        Commander à nouveau
                    </Link>
                    <Link
                        href="/stores"
                        className="w-full py-3 flex items-center justify-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
                    >
                        <Home size={15} />
                        Retour à l&apos;accueil
                    </Link>
                </div>

                {/* ── Help note ─────────────────────────────────────────── */}
                <p className="mt-8 text-center text-xs text-surface-400 dark:text-surface-500">
                    Un problème avec votre commande ?{" "}
                    <Link href="/stores/support" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
                        Contactez le support
                    </Link>
                </p>
            </main>
        </div>
    );
}
