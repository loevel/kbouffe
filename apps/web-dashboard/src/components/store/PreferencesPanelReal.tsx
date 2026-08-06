"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { useDashboardLocale } from "@/hooks/use-dashboard-locale";
import { motion, AnimatePresence } from "framer-motion";

// Dietary option codes are the canonical values stored in the DB and shared
// with restaurants — they stay in French regardless of the UI language.
// Only the label shown to the user is translated.
const DIETARY_CODES = [
    "Végétarien",
    "Végétalien",
    "Sans gluten",
    "Sans lactose",
    "Halal",
    "Casher",
    "Sans arachides",
    "Sans fruits de mer",
] as const;

const DIETARY_TRANSLATION_KEY: Record<(typeof DIETARY_CODES)[number], string> = {
    "Végétarien": "vegetarian",
    "Végétalien": "vegan",
    "Sans gluten": "glutenFree",
    "Sans lactose": "lactoseFree",
    "Halal": "halal",
    "Casher": "kosher",
    "Sans arachides": "nutFree",
    "Sans fruits de mer": "shellfishFree",
};

export function PreferencesPanelReal() {
    const { session, updateProfile } = useUserSession();
    const { setTheme } = useTheme();
    const { locale, setLocale } = useLocale();
    const { t } = useDashboardLocale();
    const p = t.clientPreferences;
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);
    // Guards the very first sync from `session.preferences` (and the initial
    // mount) so it never triggers an unsolicited autosave / locale override —
    // only changes the user actually makes on this page should do that.
    const skipNextAutosave = useRef(true);

    const LANGUAGES = [
        { code: "fr", label: "Français" },
        { code: "en", label: "English" },
    ];

    const THEMES = [
        { id: "light", label: p.theme.light },
        { id: "dark", label: p.theme.dark },
        { id: "system", label: p.theme.system },
    ];

    const DELIVERY_MODES = [
        { id: "delivery", label: p.deliveryMode.delivery, icon: <Truck size={16} /> },
        { id: "pickup", label: p.deliveryMode.pickup, icon: <Truck size={16} className="rotate-180" /> },
        { id: "reservation", label: p.deliveryMode.reservation, icon: <Utensils size={16} /> },
    ];

    const NOTIFICATIONS = [
        { id: "push" as const, label: p.notifPush, desc: p.notifPushDesc },
        { id: "email" as const, label: p.notifEmail, desc: p.notifEmailDesc },
        { id: "orderUpdates" as const, label: p.notifOrderUpdates, desc: p.notifOrderUpdatesDesc },
        { id: "promotions" as const, label: p.notifPromotions, desc: p.notifPromotionsDesc },
    ];

    // Local state for the form
    const [prefs, setPrefs] = useState<UserPreferences>({
        language: locale,
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

    // Initialize from session (does not count as a user edit)
    useEffect(() => {
        if (session?.preferences) {
            skipNextAutosave.current = true;
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
        setError(null);
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
            setSavedAt(new Date());
            toast.success(p.toastSaved);
        } catch (error: any) {
            const message = error.message || p.toastSaveError;
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    // Autosave on prefs change (debounced) — only for changes the user makes
    // themselves. The initial mount and the sync-from-session effect above
    // both set skipNextAutosave, so simply landing on this page never
    // silently overwrites the active language or fires a save.
    useEffect(() => {
        if (!session) return; // avoid on first mount without session
        if (skipNextAutosave.current) {
            skipNextAutosave.current = false;
            return;
        }
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            void handleSave();
        }, 800);
        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefs]);

    const savedLabel = useMemo(() => {
        if (!savedAt) return null;
        const delta = Math.floor((Date.now() - savedAt.getTime()) / 1000);
        if (delta < 60) return p.savedJustNow.replace("{{s}}", String(delta));
        if (delta < 3600) return p.savedMinutesAgo.replace("{{m}}", String(Math.floor(delta / 60)));
        return p.savedAt.replace("{{time}}", savedAt.toLocaleTimeString());
    }, [savedAt, p]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">{p.title}</h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{p.subtitle}</p>
                    <div className="flex items-center gap-2 text-xs font-semibold mt-2">
                        <AnimatePresence>
                            {saving && (
                                <motion.span
                                    key="saving"
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
                                >
                                    <Loader2 size={12} className="animate-spin" />
                                    {p.saving}
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {savedLabel && !saving && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                <CheckCircle2 size={12} />
                                {savedLabel}
                            </span>
                        )}
                        {error && !saving && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                <Volume2 size={12} />
                                {error}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-brand-500/20"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? p.savingButton : p.saveButton}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Language & Regional */}
                <section className="p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Globe size={20} />
                        </div>
                        <h3 className="font-bold text-surface-900 dark:text-white">{p.sectionLanguage}</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-surface-500 mb-2 uppercase tracking-wider">{p.languageLabel}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setPrefs({ ...prefs, language: lang.code })}
                                        role="radio"
                                        aria-checked={prefs.language === lang.code}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
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
                            <label className="block text-xs font-bold text-surface-500 mb-2 uppercase tracking-wider">{p.themeLabel}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {THEMES.map((th) => (
                                    <button
                                        key={th.id}
                                        onClick={() => setPrefs({ ...prefs, theme: th.id as any })}
                                        role="radio"
                                        aria-checked={prefs.theme === th.id}
                                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                                            prefs.theme === th.id
                                            ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                            : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                                        }`}
                                    >
                                        {th.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-surface-500 mb-2 uppercase tracking-wider">{p.currencyLabel}</label>
                            <div className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 text-sm font-semibold text-surface-900 dark:text-white">
                                {p.currencyValue}
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
                            <h3 className="font-bold text-surface-900 dark:text-white">{p.sectionDeliveryMode}</h3>
                        </div>

                    <div>
                        <label className="block text-xs font-bold text-surface-500 mb-3 uppercase tracking-wider">{p.deliveryModeLabel}</label>
                        <div className="space-y-2">
                            {DELIVERY_MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setPrefs({ ...prefs, defaultDeliveryMode: mode.id as any })}
                                    role="radio"
                                    aria-checked={prefs.defaultDeliveryMode === mode.id}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
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
                        <h3 className="font-bold text-surface-900 dark:text-white">{p.sectionDietary}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {DIETARY_CODES.map((code) => {
                            const isSelected = prefs.dietaryRestrictions.includes(code);
                            const key = DIETARY_TRANSLATION_KEY[code];
                            const label = (p.dietary as Record<string, string>)[key] ?? code;
                            return (
                                <button
                                    key={code}
                                    onClick={() => toggleDietary(code)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                        isSelected
                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                        : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                                    }`}
                                >
                                    {isSelected && <CheckCircle2 size={12} className="inline mr-1.5" />}
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-surface-500 dark:text-surface-500 mt-4 italic">
                        {p.dietaryNote}
                    </p>
                </section>

                {/* Notifications */}
                <section className="p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <Bell size={20} />
                        </div>
                        <h3 className="font-bold text-surface-900 dark:text-white">{p.sectionNotifications}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {NOTIFICATIONS.map((item) => (
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
                                    role="switch"
                                    aria-checked={prefs.notifications[item.id]}
                                    className={`w-12 h-6 rounded-full transition-all relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                                        prefs.notifications[item.id] ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                                    }`}
                                >
                                    <span className="sr-only">{prefs.notifications[item.id] ? p.notifEnabled : p.notifDisabled}</span>
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
