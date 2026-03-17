"use client";

import { useState, useEffect } from "react";
import { 
    Bell, 
    CheckCircle2, 
    Globe, 
    Loader2, 
    Save, 
    Truck, 
    Utensils, 
    Volume2 
} from "lucide-react";
import { useUserSession, type UserPreferences } from "@/store/client-store";
import toast from "react-hot-toast";
import { useTheme, useLocale } from "@kbouffe/module-core/ui";

const LANGUAGES = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
];

const THEMES = [
    { id: "light", label: "Clair" },
    { id: "dark", label: "Sombre" },
    { id: "system", label: "Système" },
];

const DELIVERY_MODES = [
    { id: "delivery", label: "Livraison", icon: <Truck size={16} /> },
    { id: "pickup", label: "Ramassage", icon: <Truck size={16} className="rotate-180" /> }, 
    { id: "reservation", label: "Réservation", icon: <Utensils size={16} /> },
];

const DIETARY_OPTIONS = [
    "Végétarien",
    "Végétalien",
    "Sans gluten",
    "Sans lactose",
    "Halal",
    "Casher",
    "Sans arachides",
    "Sans fruits de mer",
];

export function PreferencesPanelReal() {
    const { session, updateProfile } = useUserSession();
    const { setTheme } = useTheme();
    const { setLocale } = useLocale();
    const [saving, setSaving] = useState(false);
    
    // Local state for the form
    const [prefs, setPrefs] = useState<UserPreferences>({
        language: "fr",
        currency: "XAF",
        defaultDeliveryMode: "delivery",
        dietaryRestrictions: [],
        allergies: [],
        favoriteRestaurants: [],
        notifications: {
            push: true,
            email: true,
            sms: false,
            orderUpdates: true,
            promotions: true,
        },
        theme: "system",
    });

    // Initialize from session
    useEffect(() => {
        if (session?.preferences) {
            setPrefs(session.preferences);
        }
    }, [session?.preferences]);

    const updateNestedNotify = (key: keyof UserPreferences["notifications"], value: boolean) => {
        setPrefs(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: value
            }
        }));
    };

    const toggleDietary = (item: string) => {
        setPrefs(prev => ({
            ...prev,
            dietaryRestrictions: prev.dietaryRestrictions.includes(item)
                ? prev.dietaryRestrictions.filter(i => i !== item)
                : [...prev.dietaryRestrictions, item]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Apply immediately to UI contexts
            setTheme(prefs.theme as any);
            setLocale(prefs.language as any);

            const res = await fetch("/api/auth/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefs),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur de sauvegarde");
            }

            // Update Zustand
            updateProfile({ preferences: prefs });
            toast.success("Préférences enregistrées");
        } catch (error: any) {
            toast.error(error.message || "Impossible de sauvegarder vos préférences");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Mes préférences</h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Personnalisez votre expérience Kbouffe.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-brand-500/20"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Language & Regional */}
                <section className="p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Globe size={20} />
                        </div>
                        <h3 className="font-bold text-surface-900 dark:text-white">Langue & Région</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-surface-500 mb-2 uppercase tracking-wider">Langue d'affichage</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setPrefs({ ...prefs, language: lang.code })}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                                            prefs.language === lang.code
                                            ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                            : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                                        }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-surface-500 mb-2 uppercase tracking-wider">Thème de l'interface</label>
                            <div className="grid grid-cols-3 gap-2">
                                {THEMES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setPrefs({ ...prefs, theme: t.id as any })}
                                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                                            prefs.theme === t.id
                                            ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                            : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-surface-500 mb-2 uppercase tracking-wider">Devise</label>
                            <div className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 text-sm font-semibold text-surface-900 dark:text-white">
                                FCFA (XAF) - Cameroun
                            </div>
                        </div>
                    </div>
                </section>

                {/* Shopping Preferences */}
                <section className="p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <Truck size={20} />
                        </div>
                        <h3 className="font-bold text-surface-900 dark:text-white">Mode par défaut</h3>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-surface-500 mb-3 uppercase tracking-wider">Type de commande préféré</label>
                        <div className="space-y-2">
                            {DELIVERY_MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setPrefs({ ...prefs, defaultDeliveryMode: mode.id as any })}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                                        prefs.defaultDeliveryMode === mode.id
                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                                        : "border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={prefs.defaultDeliveryMode === mode.id ? "text-brand-600 dark:text-brand-400" : "text-surface-400"}>
                                            {mode.icon}
                                        </div>
                                        <span className={`text-sm font-bold ${
                                            prefs.defaultDeliveryMode === mode.id ? "text-brand-700 dark:text-brand-300" : "text-surface-700 dark:text-surface-300"
                                        }`}>
                                            {mode.label}
                                        </span>
                                    </div>
                                    {prefs.defaultDeliveryMode === mode.id && (
                                        <CheckCircle2 size={16} className="text-brand-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dietary Restrictions */}
                <section className="p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Utensils size={20} />
                        </div>
                        <h3 className="font-bold text-surface-900 dark:text-white">Régime alimentaire & Allergies</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map((option) => {
                            const isSelected = prefs.dietaryRestrictions.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => toggleDietary(option)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                        isSelected
                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                        : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                                    }`}
                                >
                                    {isSelected && <CheckCircle2 size={12} className="inline mr-1.5" />}
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-surface-500 dark:text-surface-500 mt-4 italic">
                        Ces préférences seront partagées avec les restaurants pour personnaliser vos recommandations et vous avertir en cas de conflit.
                    </p>
                </section>

                {/* Notifications */}
                <section className="p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <Bell size={20} />
                        </div>
                        <h3 className="font-bold text-surface-900 dark:text-white">Préférences de Notification</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: "push" as const, label: "Notifications Push", desc: "Alertes sur votre navigateur ou mobile" },
                            { id: "email" as const, label: "E-mail", desc: "Recettes, factures et nouveautés" },
                            { id: "orderUpdates" as const, label: "Mises à jour de commande", desc: "Suivi en temps réel de vos repas" },
                            { id: "promotions" as const, label: "Offres & Promotions", desc: "Réductions et codes parrainage" },
                        ].map((item) => (
                            <div 
                                key={item.id}
                                className="flex items-center justify-between p-4 rounded-xl border border-surface-100 dark:border-surface-800"
                            >
                                <div>
                                    <p className="text-sm font-bold text-surface-900 dark:text-white">{item.label}</p>
                                    <p className="text-xs text-surface-500">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => updateNestedNotify(item.id, !prefs.notifications[item.id])}
                                    className={`w-12 h-6 rounded-full transition-all relative ${
                                        prefs.notifications[item.id] ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                                    }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                                        prefs.notifications[item.id] ? "right-1" : "left-1"
                                    }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
