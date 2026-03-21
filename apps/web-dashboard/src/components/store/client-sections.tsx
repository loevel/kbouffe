"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    Bell,
    Building2,
    CheckCircle2,
    Circle,
    CreditCard,
    Heart,
    LifeBuoy,
    Lock,
    MapPin,
    Shield,
    SlidersHorizontal,
    Smartphone,
    Star,
    Tag,
    Ticket,
    User,
} from "lucide-react";
import { OrdersPanelReal }    from "./OrdersPanelReal";
import { FavoritesPanelReal } from "./FavoritesPanelReal";
import { ProfilePanelReal }   from "./ProfilePanelReal";
import { AddressesPanelReal } from "./AddressesPanelReal";
import { PreferencesPanelReal } from "./PreferencesPanelReal";
import { ClientNotificationsPanel } from "./ClientNotificationsPanel";
import { SupportPanelReal } from "./SupportPanelReal";

function PanelShell({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">{title}</h2>
            <p className="text-surface-600 dark:text-surface-400 mb-5">{subtitle}</p>
            {children}
        </div>
    );
}





export function NotificationsPanel() {
    return <ClientNotificationsPanel />;
}

export function SecurityPanel() {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 6 caractères" });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Une erreur est survenue");
            }

            setMessage({ type: "success", text: "Mot de passe mis à jour avec succès" });
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => {
                setIsEditing(false);
                setMessage(null);
            }, 2000);
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PanelShell title="Sécurité" subtitle="Protégez votre compte et vos données.">
            <div className="space-y-6">
                <div className={`p-4 rounded-xl border transition-all ${isEditing ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/5" : "border-surface-200 dark:border-surface-700"}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800">
                                <Lock size={20} className="text-surface-600 dark:text-surface-400" />
                            </div>
                            <div>
                                <p className="font-bold text-surface-900 dark:text-white">Mot de passe</p>
                                <p className="text-xs text-surface-500">Dernière modification il y a 3 mois</p>
                            </div>
                        </div>
                        {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline"
                            >
                                Modifier
                            </button>
                        )}
                    </div>

                    {isEditing && (
                        <form onSubmit={handlePasswordChange} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
                                    {message.type === "success" ? <CheckCircle2 size={16} /> : <Bell size={16} />}
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setMessage(null);
                                    }}
                                    className="px-4 py-2 text-sm font-bold text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Mise à jour...
                                        </>
                                    ) : (
                                        "Confirmer le changement"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800">
                            <Smartphone size={20} className="text-surface-600 dark:text-surface-400" />
                        </div>
                        <div>
                            <p className="font-bold text-surface-900 dark:text-white">Appareils connectés</p>
                            <p className="text-xs text-surface-500">2 appareils actifs</p>
                        </div>
                    </div>
                    <button className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline">Voir</button>
                </div>
            </div>
        </PanelShell>
    );
}



export function PaymentMethodsPanel() {
    return (
        <PanelShell title="Moyens de paiement" subtitle="Choisissez vos méthodes de paiement pour accélérer le checkout.">
            <div className="space-y-3">
                <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-surface-500" />
                        <div>
                            <p className="font-semibold text-surface-900 dark:text-white">MTN MoMo</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">+237 6XX XXX 102</p>
                        </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">Principal</span>
                </div>
                <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-surface-500" />
                        <div>
                            <p className="font-semibold text-surface-900 dark:text-white">Orange Money</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">+237 6XX XXX 884</p>
                        </div>
                    </div>
                    <button className="text-sm font-semibold text-brand-600 dark:text-brand-400">Utiliser</button>
                </div>
                <button className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors">
                    Ajouter un moyen de paiement
                </button>
            </div>
        </PanelShell>
    );
}

export function PromotionsPanel() {
    return (
        <PanelShell title="Offres & promotions" subtitle="Codes promo, remises actives et bons plans du moment.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative overflow-hidden group p-5 rounded-2xl border border-brand-200 dark:border-brand-500/20 bg-brand-50 dark:bg-brand-500/5 hover:shadow-lg transition-all">
                    <div className="relative z-10">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-brand-500 text-white text-[10px] font-bold uppercase mb-2">Actif</span>
                        <p className="text-lg font-black text-brand-900 dark:text-brand-100 mb-1">KBWELCOME20</p>
                        <p className="text-sm text-brand-700 dark:text-brand-300 font-medium">
                            -20% sur votre première commande
                        </p>
                        <p className="text-xs text-brand-600/60 dark:text-brand-400/60 mt-2">Valable jusqu&apos;au 31 Mars</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ticket size={80} className="text-brand-500" />
                    </div>
                </div>

                <div className="relative overflow-hidden group p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:shadow-lg transition-all">
                    <div className="relative z-10">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-[10px] font-bold uppercase mb-2">Permanent</span>
                        <p className="text-lg font-black text-surface-900 dark:text-white mb-1">Dimanche Royal</p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">
                            Livraison offerte sur toute la ville
                        </p>
                        <p className="text-xs text-surface-400/60 mt-2">Chaque dimanche de 12h à 20h</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Star size={80} className="text-surface-400" />
                    </div>
                </div>
            </div>
        </PanelShell>
    );
}


export function SupportPanel() {
    return <SupportPanelReal />;
}


export type ClientSectionId =
    | "restaurants"
    | "orders"
    | "promotions"
    | "favorites"
    | "addresses"
    | "payments"
    | "preferences"
    | "notifications"
    | "security"
    | "profile"
    | "support";

export type ClientSectionIcon =
    | "home"
    | "orders"
    | "promotions"
    | "favorites"
    | "addresses"
    | "payments"
    | "preferences"
    | "notifications"
    | "security"
    | "profile"
    | "support";

export interface ClientSectionNavItem {
    id: ClientSectionId;
    label: string;
    icon: ClientSectionIcon;
}

export interface ClientSectionGroup {
    title: string;
    items: ClientSectionNavItem[];
}

export const clientSectionPath: Record<ClientSectionId, string> = {
    restaurants: "/stores",
    orders: "/stores/orders",
    promotions: "/stores/promotions",
    favorites: "/stores/favorites",
    addresses: "/stores/addresses",
    payments: "/stores/payments",
    preferences: "/stores/preferences",
    notifications: "/stores/notifications",
    security: "/stores/security",
    profile: "/stores/profile",
    support: "/stores/support",
};

export const sectionGroups: ClientSectionGroup[] = [
    {
        title: "Découvrir",
        items: [
            { id: "restaurants", label: "Accueil client", icon: "home" },
            { id: "orders", label: "Mes commandes", icon: "orders" },
            { id: "promotions", label: "Offres & promos", icon: "promotions" },
        ],
    },
    {
        title: "Compte & paiements",
        items: [
            { id: "favorites", label: "Favoris", icon: "favorites" },
            { id: "addresses", label: "Adresses", icon: "addresses" },
            { id: "payments", label: "Moyens de paiement", icon: "payments" },
            { id: "preferences", label: "Préférences", icon: "preferences" },
        ],
    },
    {
        title: "Sécurité & aide",
        items: [
            { id: "notifications", label: "Notifications", icon: "notifications" },
            { id: "security", label: "Sécurité", icon: "security" },
            { id: "profile", label: "Mon profil", icon: "profile" },
            { id: "support", label: "Aide & support", icon: "support" },
        ],
    },
];

export function renderSectionPanel(section: ClientSectionId) {
    switch (section) {
        case "orders":
            return <OrdersPanelReal />;
        case "promotions":
            return <PromotionsPanel />;
        case "favorites":
            return <FavoritesPanelReal />;
        case "addresses":
            return <AddressesPanelReal />;
        case "payments":
            return <PaymentMethodsPanel />;
        case "preferences":
            return <PreferencesPanelReal />;
        case "notifications":
            return <NotificationsPanel />;
        case "security":
            return <SecurityPanel />;
        case "profile":
            return <ProfilePanelReal />;
        case "support":
            return <SupportPanel />;
        default:
            return null;
    }
}
