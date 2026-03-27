"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Bot,
    Facebook,
    Music2,
    Send,
    MessageCircle,
    Flame,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Eye,
    EyeOff,
    Pencil,
    Save,
    X,
    Loader2,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    Instagram,
    Copy,
    Check,
} from "lucide-react";
import { adminFetch } from "@kbouffe/module-core/ui";

// ── Types ──────────────────────────────────────────────────────────────────

type Integration = {
    id: string;
    key_name: string;
    masked_value: string;
    is_secret: boolean;
    is_configured: boolean;
    category: string;
    label: string;
    description: string;
    placeholder: string;
    docs_url: string;
    updated_at: string | null;
};

// ── Category config ────────────────────────────────────────────────────────

const CATEGORIES: Record<string, {
    label: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    badge: string;
    approval?: string;
}> = {
    ai: {
        label: "Intelligence Artificielle",
        icon: Bot,
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-500/10",
        border: "border-violet-200 dark:border-violet-500/20",
        badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    },
    meta: {
        label: "Meta (Facebook & Instagram)",
        icon: Facebook,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        border: "border-blue-200 dark:border-blue-500/20",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
        approval: "App Review Meta requis (2–4 semaines) — portail : developers.facebook.com/apps",
    },
    tiktok: {
        label: "TikTok",
        icon: Music2,
        color: "text-pink-500",
        bg: "bg-pink-50 dark:bg-pink-500/10",
        border: "border-pink-200 dark:border-pink-500/20",
        badge: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
        approval: "TikTok Developer Review requis (4–8 semaines) — portail : developers.tiktok.com",
    },
    telegram: {
        label: "Telegram",
        icon: Send,
        color: "text-sky-500",
        bg: "bg-sky-50 dark:bg-sky-500/10",
        border: "border-sky-200 dark:border-sky-500/20",
        badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    },
    whatsapp: {
        label: "WhatsApp Business",
        icon: MessageCircle,
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-500/10",
        border: "border-green-200 dark:border-green-500/20",
        badge: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
        approval: "Meta App Review + compte WABA requis — portail : business.facebook.com",
    },
    firebase: {
        label: "Firebase (Notifications Push)",
        icon: Flame,
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-500/10",
        border: "border-orange-200 dark:border-orange-500/20",
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    },
};

// ── Key row component ──────────────────────────────────────────────────────

function KeyRow({ item, onSave }: { item: Integration; onSave: (keyName: string, value: string) => Promise<void> }) {
    const [editing, setEditing] = useState(false);
    const [inputVal, setInputVal] = useState("");
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleEdit = () => {
        setInputVal("");
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
        setInputVal("");
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(item.key_name, inputVal);
        setSaving(false);
        setEditing(false);
        setInputVal("");
    };

    const handleCopyName = () => {
        navigator.clipboard?.writeText(item.key_name);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-surface-100 dark:border-surface-800 last:border-0">
            {/* Status dot */}
            <div className="flex-shrink-0 mt-0.5">
                {item.is_configured
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <XCircle size={18} className="text-surface-300 dark:text-surface-600" />
                }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">{item.label}</span>
                    {item.is_secret && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 flex items-center gap-1">
                            <ShieldCheck size={9} /> Secret
                        </span>
                    )}
                </div>

                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{item.description}</p>

                {/* Key name + copy */}
                <button
                    type="button"
                    onClick={handleCopyName}
                    className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    title="Copier le nom de la variable"
                >
                    {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                    {item.key_name}
                </button>

                {/* Value display / edit */}
                {editing ? (
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            type={item.is_secret ? "password" : "text"}
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder={item.placeholder}
                            autoFocus
                            className="flex-1 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3 py-2 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                        />
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !inputVal.trim()}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Sauvegarder
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="mt-1.5 flex items-center gap-2">
                        {item.is_configured ? (
                            <code className="text-xs font-mono text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                                {item.masked_value}
                            </code>
                        ) : (
                            <span className="text-xs text-surface-400 italic">Non configuré</span>
                        )}
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 transition-colors"
                        >
                            <Pencil size={11} />
                            {item.is_configured ? "Modifier" : "Configurer"}
                        </button>
                    </div>
                )}

                {/* Last updated */}
                {item.updated_at && (
                    <p className="text-[10px] text-surface-400 mt-1">
                        Mis à jour le {new Date(item.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                )}
            </div>

            {/* Docs link */}
            {item.docs_url && (
                <a
                    href={item.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-surface-400 hover:text-brand-500 transition-colors"
                    title="Documentation officielle"
                >
                    <ExternalLink size={12} />
                    <span className="hidden sm:inline">Docs</span>
                </a>
            )}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminFetch("/api/admin/integrations");
            const data = await res.json();
            setIntegrations(data.integrations ?? []);
        } catch {
            setError("Impossible de charger les intégrations");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (keyName: string, value: string) => {
        try {
            const res = await adminFetch("/api/admin/integrations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key_name: keyName, key_value: value }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Erreur");
            // Update local state
            setIntegrations(prev => prev.map(i =>
                i.key_name === keyName
                    ? { ...i, masked_value: data.masked_value, is_configured: data.is_configured }
                    : i
            ));
            showToast(`${keyName} mis à jour avec succès`);
        } catch {
            showToast("Erreur lors de la mise à jour", false);
        }
    };

    // Group by category
    const grouped = integrations.reduce<Record<string, Integration[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    // Stats
    const total = integrations.length;
    const configured = integrations.filter(i => i.is_configured).length;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        Intégrations & API Keys
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Configurez les clés d'API des services tiers utilisés par la plateforme kBouffe.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        Clés configurées
                    </span>
                    <span className="text-sm font-bold text-surface-900 dark:text-white">
                        {configured} / {total}
                    </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
                        style={{ width: total > 0 ? `${(configured / total) * 100}%` : "0%" }}
                    />
                </div>
                {configured < total && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        {total - configured} clé(s) manquante(s) — certaines fonctionnalités peuvent être indisponibles.
                    </p>
                )}
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Sécurité :</strong> Les valeurs marquées <strong>Secret</strong> ne sont jamais affichées en clair ni envoyées au navigateur. Elles sont stockées chiffrées et uniquement lues côté serveur.
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-surface-400" />
                </div>
            )}

            {/* Category groups */}
            {!loading && Object.entries(CATEGORIES).map(([catKey, catConf]) => {
                const items = grouped[catKey] ?? [];
                if (items.length === 0) return null;
                const CatIcon = catConf.icon;
                const configuredCount = items.filter(i => i.is_configured).length;

                return (
                    <div
                        key={catKey}
                        className={`rounded-2xl border ${catConf.border} overflow-hidden`}
                    >
                        {/* Category header */}
                        <div className={`${catConf.bg} px-5 py-4 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <CatIcon size={20} className={catConf.color} />
                                <div>
                                    <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                                        {catConf.label}
                                    </h2>
                                    {catConf.approval && (
                                        <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1">
                                            <AlertTriangle size={10} className="text-amber-500" />
                                            {catConf.approval}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${catConf.badge}`}>
                                {configuredCount}/{items.length}
                            </span>
                        </div>

                        {/* Keys */}
                        <div className="bg-white dark:bg-surface-900 px-5 divide-y divide-surface-100 dark:divide-surface-800">
                            {items.map(item => (
                                <KeyRow key={item.key_name} item={item} onSave={handleSave} />
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.ok ? "bg-green-500" : "bg-red-500"}`}>
                    {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
