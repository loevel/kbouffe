"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings,
    Save,
    Check,
    DollarSign,
    Clock,
    Shield,
    Bell,
    Globe,
    Lock,
    Cpu,
    Database,
    Cloud,
    AlertCircle,
} from "lucide-react";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

interface SettingField {
    key: string;
    label: string;
    description: string;
    type: "text" | "number" | "toggle";
    icon: any;
    group: string;
}

const SETTING_FIELDS: SettingField[] = [
    // Commissions
    { key: "commission_rate", label: "Taux de commission (%)", description: "Pourcentage prélevé sur chaque commande traitée par la plateforme.", type: "number", icon: DollarSign, group: "Commissions & Payouts" },
    { key: "min_payout_amount", label: "Seuil minimum de versement (FCFA)", description: "Montant cumulé nécessaire pour déclencher un virement automatique.", type: "number", icon: Database, group: "Commissions & Payouts" },
    { key: "payout_frequency_days", label: "Cycle de facturation (jours)", description: "Intervalle de temps entre deux règlements marchands générés.", type: "number", icon: Clock, group: "Commissions & Payouts" },
    // Plateforme
    { key: "platform_name", label: "Identité de la Plateforme", description: "Nom public utilisé dans les communications et interfaces clients.", type: "text", icon: Globe, group: "Informations Système" },
    { key: "support_email", label: "Contact Support (Email)", description: "Adresse officielle de support affichée aux clients et partenaires.", type: "text", icon: Bell, group: "Informations Système" },
    { key: "support_phone", label: "Ligne Support (WhatsApp/Tel)", description: "Numéro de contact rapide pour l'assistance opérationnelle.", type: "text", icon: Bell, group: "Informations Système" },
    { key: "maintenance_mode", label: "Mode Maintenance Global", description: "Suspend l'accès client pour des opérations techniques lourdes.", type: "toggle", icon: Shield, group: "Sécurité & État" },
];

const GROUPS = [...new Set(SETTING_FIELDS.map((f) => f.group))];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await adminFetch("/api/admin/system/settings");
                if (res.ok) {
                    const data = await res.json();
                    // Transform array [{key, value}] to record {key: value}
                    const record = (data as any[]).reduce((acc, curr) => {
                        acc[curr.key] = curr.value;
                        return acc;
                    }, {} as Record<string, string>);
                    setSettings(record);
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateField = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
        setSaved(false);
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await adminFetch("/api/admin/system/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                const updated = await res.json();
                setSettings(updated);
                setSaved(true);
                setDirty(false);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-surface-400">Initialisation du moteur de configuration...</p>
            </div>
        );
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto space-y-10 pb-20"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-100 dark:border-surface-800 pb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Cpu className="text-brand-500" size={36} /> Engine Config
                    </h1>
                    <p className="text-surface-500 font-medium flex items-center gap-2">
                        Configurez les variables d'environnement et les règles métier de la plateforme
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {dirty && !saving && !saved && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                            >
                                <AlertCircle size={12} /> Modifications non enregistrées
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <button
                        onClick={saveSettings}
                        disabled={saving || !dirty}
                        className={cn(
                            "group relative flex items-center gap-2 px-8 py-3.5 text-sm font-black rounded-2xl transition-all overflow-hidden",
                            saved
                                ? "bg-green-500 text-white"
                                : dirty
                                    ? "bg-brand-500 text-white hover:bg-brand-600 shadow-xl shadow-brand-500/20 active:scale-95"
                                    : "bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {saving ? (
                                <motion.div 
                                    className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
                                    key="saving"
                                />
                            ) : saved ? (
                                <motion.div 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="flex items-center gap-2"
                                    key="check"
                                >
                                    <Check size={18} strokeWidth={3} /> Success
                                </motion.div>
                            ) : (
                                <motion.div 
                                    className="flex items-center gap-2"
                                    key="save"
                                >
                                    <Save size={18} /> Mettre à jour
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {GROUPS.map((group, groupIdx) => (
                    <motion.section 
                        key={group} 
                        variants={itemVariants}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white shrink-0">
                                {group}
                            </h2>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-surface-100 dark:from-surface-800 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SETTING_FIELDS.filter((f) => f.group === group).map((field, fieldIdx) => {
                                const Icon = field.icon;
                                const val = settings[field.key] ?? "";
                                return (
                                    <motion.div 
                                        key={field.key}
                                        whileHover={{ y: -2 }}
                                        className="bg-white dark:bg-surface-900 p-5 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-6"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-brand-500 shrink-0">
                                                <Icon size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-surface-900 dark:text-white">{field.label}</h3>
                                                <p className="text-[11px] text-surface-500 leading-normal">{field.description}</p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            {field.type === "toggle" ? (
                                                <div className="flex items-center justify-between px-3 py-2 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                                                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">Status: {val === "true" ? "Actif" : "Inactif"}</span>
                                                    <button
                                                        onClick={() => updateField(field.key, val === "true" ? "false" : "true")}
                                                        className={cn(
                                                            "relative inline-flex h-7 w-12 items-center rounded-full transition-all ring-offset-2 focus:ring-2 focus:ring-brand-500/40",
                                                            val === "true" ? "bg-brand-500" : "bg-surface-300 dark:bg-surface-600"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ring-0",
                                                            val === "true" ? "translate-x-6" : "translate-x-1"
                                                        )} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative group/input">
                                                    <input
                                                        type={field.type}
                                                        value={val}
                                                        onChange={(e) => updateField(field.key, e.target.value)}
                                                        className="w-full px-5 py-3.5 text-base font-medium rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all placeholder:text-surface-300"
                                                        placeholder="Saisir une valeur..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.section>
                ))}
            </div>

            {/* Quick Actions Footer */}
            <motion.div 
                variants={itemVariants}
                className="p-8 rounded-[2.5rem] bg-gradient-to-br from-surface-900 to-black text-white relative overflow-hidden shadow-2xl"
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div className="space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-brand-400">
                            <Lock size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Zone Sécurisée</span>
                        </div>
                        <h4 className="text-2xl font-bold">Révision de la Configuration</h4>
                        <p className="text-surface-400 text-sm max-w-md">
                            Chaque modification des paramètres système est tracée dans l'audit technique. Toute erreur peut influencer l'expérience des utilisateurs finaux.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="h-12 border-surface-700 text-white hover:bg-surface-800 rounded-xl px-6">
                            Historique des Changements
                        </Button>
                        <Button className="h-12 bg-white text-black hover:bg-surface-100 rounded-xl px-6 font-bold">
                            Support Technique
                        </Button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full -ml-32 -mb-32 blur-3xl opacity-30" />
            </motion.div>
        </motion.div>
    );
}

