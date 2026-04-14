"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Bell,
    Wrench,
    Sparkles,
    Tag,
    MessageSquare,
    Send,
    Users,
    Store,
    MapPin,
    Package,
    CheckCircle2,
    History,
    Loader2,
    Smartphone,
    Globe,
    RefreshCw,
    ChevronRight,
    AlertTriangle,
    Brain,
    Copy,
    Check,
    Save,
    Trash2,
    FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BroadcastHistory {
    id: string;
    title: string;
    body: string;
    template: string;
    targetType: string;
    targetValue: string | null;
    targetLabel: string | null;
    tokensSent: number;
    sentAt: string;
}

interface Pack { id: string; name: string; category: string }

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
    {
        key: "maintenance",
        label: "Maintenance",
        icon: Wrench,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        title: "🔧 Maintenance programmée",
        body: "KBouffe sera en maintenance ce soir de 23h à 01h. Vos données sont sauvegardées automatiquement.",
    },
    {
        key: "feature",
        label: "Nouvelle feature",
        icon: Sparkles,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
        border: "border-violet-500/30",
        title: "✨ Nouvelle fonctionnalité disponible",
        body: "Découvrez la nouvelle fonctionnalité dans votre dashboard. Connectez-vous pour en profiter dès maintenant !",
    },
    {
        key: "promo",
        label: "Promotion",
        icon: Tag,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        title: "🎁 Offre spéciale ce mois-ci",
        body: "Profitez de -20% sur les packs Premium jusqu'à la fin du mois. Connectez-vous pour en savoir plus.",
    },
    {
        key: "custom",
        label: "Message libre",
        icon: MessageSquare,
        color: "text-brand-400",
        bg: "bg-brand-500/10",
        border: "border-brand-500/30",
        title: "",
        body: "",
    },
] as const;

const TARGET_OPTIONS = [
    { key: "all", label: "Tous les restaurants", icon: Globe, description: "Tous les marchands inscrits" },
    { key: "active", label: "Restaurants actifs", icon: Store, description: "Uniquement les boutiques publiées" },
    { key: "inactive_30d", label: "Inactifs >30 jours", icon: Users, description: "Restaurants sans commande depuis 30j" },
    { key: "no_products", label: "Sans produits", icon: Package, description: "Boutiques avec menu vide" },
    { key: "pack", label: "Par abonnement", icon: Package, description: "Restaurants abonnés à un pack spécifique" },
    { key: "city", label: "Par ville", icon: MapPin, description: "Restaurants dans une ville donnée" },
] as const;

const TEMPLATE_BADGE_COLORS: Record<string, string> = {
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    feature:     "bg-violet-500/10 text-violet-400 border-violet-500/20",
    promo:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    custom:      "bg-brand-500/10 text-brand-400 border-brand-500/20",
};

const TARGET_BADGE_COLORS: Record<string, string> = {
    all:            "bg-blue-500/10 text-blue-400 border-blue-500/20",
    active:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    inactive_30d:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
    no_products:    "bg-red-500/10 text-red-400 border-red-500/20",
    pack:           "bg-violet-500/10 text-violet-400 border-violet-500/20",
    city:           "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function targetLabel(b: BroadcastHistory) {
    const base: Record<string, string> = {
        all: "Tous",
        active: "Actifs",
        inactive_30d: "Inactifs >30j",
        no_products: "Sans produits",
        pack: "Pack",
        city: "Ville"
    };
    const lbl = base[b.targetType] ?? b.targetType;
    return b.targetLabel ? `${lbl}: ${b.targetLabel}` : b.targetValue ? `${lbl}: ${b.targetValue}` : lbl;
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminBroadcastPage() {
    // Composer state
    const [selectedTemplate, setSelectedTemplate] = useState<string>("maintenance");
    const [title, setTitle] = useState<string>(TEMPLATES[0].title);
    const [body, setBody] = useState<string>(TEMPLATES[0].body);
    const [targetType, setTargetType] = useState<string>("all");
    const [targetValue, setTargetValue] = useState("");
    const [packs, setPacks] = useState<Pack[]>([]);

    // AI drafting state
    const [aiIntent, setAiIntent] = useState("");
    const [aiDrafting, setAiDrafting] = useState(false);
    const [aiVariants, setAiVariants] = useState<{
        variantA: { title: string; body: string };
        variantB: { title: string; body: string };
    } | null>(null);
    const [copiedVariant, setCopiedVariant] = useState<"A" | "B" | null>(null);

    // Send state
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string; tokensSent?: number } | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    // History state
    const [history, setHistory] = useState<BroadcastHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Preview state
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Draft state
    const [drafts, setDrafts] = useState<Array<{ id: string; title: string; updated_at: string }>>([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
    const [savingDraft, setSavingDraft] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch("/api/admin/broadcast");
            const data = await res.json();
            setHistory(data.history ?? []);
            setPacks(data.packs ?? []);
        } catch (e) {
            console.error("Broadcast history error:", e);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const fetchDrafts = useCallback(async () => {
        setLoadingDrafts(true);
        try {
            const res = await fetch("/api/admin/broadcast/drafts");
            const data = await res.json();
            setDrafts(data.drafts ?? []);
        } catch (e) {
            console.error("Drafts fetch error:", e);
        } finally {
            setLoadingDrafts(false);
        }
    }, []);

    useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

    // Fetch preview count when targeting changes
    useEffect(() => {
        const fetchPreview = async () => {
            if (!targetType) return;
            if ((targetType === "pack" || targetType === "city") && !targetValue.trim()) return;

            setPreviewLoading(true);
            try {
                const res = await fetch("/api/admin/broadcast/preview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetType, targetValue: targetValue || undefined }),
                });
                const data = await res.json();
                if (data.restaurantCount !== undefined) {
                    setPreviewCount(data.deviceCount);
                }
            } catch (e) {
                console.error("Preview fetch error:", e);
            } finally {
                setPreviewLoading(false);
            }
        };

        const timer = setTimeout(fetchPreview, 300); // Debounce
        return () => clearTimeout(timer);
    }, [targetType, targetValue]);

    async function draftWithAI() {
        if (!aiIntent.trim()) return;
        setAiDrafting(true);
        setAiVariants(null);
        try {
            const res = await fetch("/api/admin/ai/draft-broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intent: aiIntent, template: selectedTemplate, targetType }),
            });
            const data = await res.json();
            if (data.variantA) setAiVariants(data);
        } catch { /* */ }
        finally { setAiDrafting(false); }
    }

    function applyVariant(variant: "A" | "B") {
        if (!aiVariants) return;
        const v = variant === "A" ? aiVariants.variantA : aiVariants.variantB;
        setTitle(v.title);
        setBody(v.body);
        setSelectedTemplate("custom");
        setCopiedVariant(variant);
        setTimeout(() => setCopiedVariant(null), 2000);
    }

    function applyTemplate(key: string) {
        setSelectedTemplate(key);
        const tpl = TEMPLATES.find(t => t.key === key);
        if (tpl) {
            setTitle(tpl.title);
            setBody(tpl.body);
        }
    }

    async function handleSaveDraft() {
        if (!title.trim() || !body.trim()) return;
        setSavingDraft(true);
        try {
            const res = await fetch("/api/admin/broadcast/drafts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentDraftId,
                    title,
                    bodyText: body,
                    template: selectedTemplate,
                    targetType,
                    targetValue: targetType === "pack" || targetType === "city" ? targetValue : undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentDraftId(data.id);
                fetchDrafts();
                setSendResult({ success: true, message: "Brouillon sauvegardé ✓" });
                setTimeout(() => setSendResult(null), 3000);
            }
        } catch (e) {
            setSendResult({ success: false, message: "Erreur réseau" });
        } finally {
            setSavingDraft(false);
        }
    }

    async function handleLoadDraft(draftId: string) {
        const draft = drafts.find(d => d.id === draftId);
        if (!draft) return;

        setLoadingDrafts(true);
        try {
            const res = await fetch("/api/admin/broadcast/drafts");
            const data = await res.json();
            const fullDraft = data.drafts?.find((d: any) => d.id === draftId);

            if (fullDraft) {
                setCurrentDraftId(draftId);
                setTitle(fullDraft.title);
                setBody(fullDraft.body);
                setSelectedTemplate(fullDraft.template);
                setTargetType(fullDraft.target_type);
                setTargetValue(fullDraft.target_value ?? "");
                setSendResult({ success: true, message: "Brouillon chargé ✓" });
                setTimeout(() => setSendResult(null), 2000);
            }
        } catch (e) {
            console.error("Load draft error:", e);
        } finally {
            setLoadingDrafts(false);
        }
    }

    async function handleDeleteDraft(draftId: string) {
        if (!confirm("Supprimer ce brouillon ?")) return;

        try {
            await fetch(`/api/admin/broadcast/drafts/${draftId}`, {
                method: "DELETE",
            });
            fetchDrafts();
            if (currentDraftId === draftId) {
                setCurrentDraftId(null);
            }
        } catch (e) {
            console.error("Delete draft error:", e);
        }
    }

    async function handleTest() {
        if (!title.trim() || !body.trim()) return;
        setTestLoading(true);
        setSendResult(null);
        try {
            const res = await fetch("/api/admin/broadcast/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    bodyText: body,
                }),
            });
            const data = await res.json();
            setSendResult(data);
        } catch (e) {
            setSendResult({ success: false, message: "Erreur réseau" });
        } finally {
            setTestLoading(false);
        }
    }

    async function handleSend() {
        if (!title.trim() || !body.trim()) return;
        setSending(true);
        setSendResult(null);
        try {
            const res = await fetch("/api/admin/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    bodyText: body,
                    template: selectedTemplate,
                    targetType,
                    targetValue: targetType === "pack" || targetType === "city" ? targetValue : undefined,
                }),
            });
            const data = await res.json();
            setSendResult(data);
            if (data.success) {
                fetchHistory();
            }
        } catch (e) {
            setSendResult({ success: false, message: "Erreur réseau" });
        } finally {
            setSending(false);
            setConfirmOpen(false);
        }
    }

    const canSend = title.trim() && body.trim() &&
        (targetType === "all" || targetType === "active" || targetValue.trim());

    return (
        <div className="min-h-screen bg-surface-950 p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center border border-brand-500/20">
                    <Bell size={20} className="text-brand-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Broadcast Plateforme</h1>
                    <p className="text-surface-400 text-sm">Envoyer une notification push à vos marchands</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Composer ─────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-5"
                >
                    {/* Templates */}
                    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-surface-300 mb-3">1. Choisir un template</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {TEMPLATES.map((tpl) => {
                                const active = selectedTemplate === tpl.key;
                                return (
                                    <button
                                        key={tpl.key}
                                        onClick={() => applyTemplate(tpl.key)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all",
                                            active
                                                ? `${tpl.bg} ${tpl.border} ${tpl.color}`
                                                : "border-surface-700 text-surface-400 hover:border-surface-600 hover:text-white"
                                        )}
                                    >
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", active ? tpl.bg : "bg-surface-800")}>
                                            <tpl.icon size={16} className={active ? tpl.color : "text-surface-500"} />
                                        </div>
                                        {tpl.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Drafting */}
                    <div className="bg-violet-950/40 border border-violet-500/20 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Brain size={16} className="text-violet-400" />
                            <h3 className="text-sm font-semibold text-violet-300">✨ Rédiger avec Gemini</h3>
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={aiIntent}
                                onChange={e => setAiIntent(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && draftWithAI()}
                                placeholder="Ex: Rappeler aux marchands inactifs de mettre à jour leur menu…"
                                className="flex-1 bg-surface-800/60 border border-violet-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-violet-400 transition-colors"
                            />
                            <Button
                                onClick={draftWithAI}
                                disabled={!aiIntent.trim() || aiDrafting}
                                className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white border-none shrink-0"
                            >
                                {aiDrafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                {aiDrafting ? "…" : "Générer"}
                            </Button>
                        </div>

                        <AnimatePresence>
                            {aiVariants && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                >
                                    {(["A", "B"] as const).map((v) => {
                                        const variant = v === "A" ? aiVariants.variantA : aiVariants.variantB;
                                        const applied = copiedVariant === v;
                                        return (
                                            <div key={v} className="bg-surface-800/60 rounded-lg p-3 border border-surface-700 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Variante {v}</span>
                                                    <button
                                                        onClick={() => applyVariant(v)}
                                                        className={cn(
                                                            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium transition-colors",
                                                            applied
                                                                ? "bg-emerald-500/20 text-emerald-400"
                                                                : "bg-violet-500/20 text-violet-300 hover:bg-violet-500/40"
                                                        )}
                                                    >
                                                        {applied ? <Check size={11} /> : <Copy size={11} />}
                                                        {applied ? "Appliqué" : "Utiliser"}
                                                    </button>
                                                </div>
                                                <p className="text-sm font-semibold text-white">{variant.title}</p>
                                                <p className="text-xs text-surface-400 leading-relaxed">{variant.body}</p>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Message */}
                    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-surface-300">2. Rédiger le message</h3>
                        <div>
                            <label className="text-xs text-surface-400 mb-1.5 block">Titre de la notification</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                maxLength={65}
                                placeholder="Ex: 🔧 Maintenance programmée"
                                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                            />
                            <p className="text-right text-xs text-surface-600 mt-1">{title.length}/65</p>
                        </div>
                        <div>
                            <label className="text-xs text-surface-400 mb-1.5 block">Corps du message</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                maxLength={200}
                                rows={3}
                                placeholder="Votre message ici..."
                                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                            />
                            <p className="text-right text-xs text-surface-600 mt-1">{body.length}/200</p>
                        </div>
                    </div>

                    {/* Targeting */}
                    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-surface-300 mb-3">3. Définir la cible</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            {TARGET_OPTIONS.map((opt) => {
                                const active = targetType === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        onClick={() => { setTargetType(opt.key); setTargetValue(""); }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                            active
                                                ? "border-brand-500/40 bg-brand-500/10"
                                                : "border-surface-700 hover:border-surface-600"
                                        )}
                                    >
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", active ? "bg-brand-500/20" : "bg-surface-800")}>
                                            <opt.icon size={15} className={active ? "text-brand-400" : "text-surface-500"} />
                                        </div>
                                        <div>
                                            <p className={cn("text-xs font-semibold", active ? "text-white" : "text-surface-400")}>{opt.label}</p>
                                            <p className="text-xs text-surface-600">{opt.description}</p>
                                        </div>
                                        {active && <ChevronRight size={14} className="ml-auto text-brand-400" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Conditional input */}
                        <AnimatePresence>
                            {targetType === "pack" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <label className="text-xs text-surface-400 mb-1.5 block">Sélectionner un pack</label>
                                    <select
                                        value={targetValue}
                                        onChange={e => setTargetValue(e.target.value)}
                                        className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                                    >
                                        <option value="">— Choisir un pack —</option>
                                        {packs.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                                        ))}
                                    </select>
                                </motion.div>
                            )}
                            {targetType === "city" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <label className="text-xs text-surface-400 mb-1.5 block">Nom de la ville</label>
                                    <input
                                        value={targetValue}
                                        onChange={e => setTargetValue(e.target.value)}
                                        placeholder="Ex: Douala, Yaoundé..."
                                        className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Send result */}
                    <AnimatePresence>
                        {sendResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
                                    sendResult.success
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/10 border-red-500/20 text-red-400"
                                )}
                            >
                                {sendResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                <span>{sendResult.message}</span>
                                {sendResult.success && sendResult.tokensSent > 0 && (
                                    <span className="ml-auto flex items-center gap-1 text-xs">
                                        <Smartphone size={12} /> {sendResult.tokensSent} appareils
                                    </span>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Draft + Send buttons */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSaveDraft}
                            disabled={!title.trim() || !body.trim() || savingDraft}
                            variant="ghost"
                            className="gap-2 text-surface-400 hover:text-white"
                        >
                            {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Sauvegarder
                        </Button>
                    </div>

                    {/* Send button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={handleTest}
                            disabled={!canSend || testLoading || sending}
                            variant="ghost"
                            className="gap-2 text-surface-400 hover:text-white"
                        >
                            {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Tester d'abord
                        </Button>

                        {!confirmOpen ? (
                            <Button
                                onClick={() => setConfirmOpen(true)}
                                disabled={!canSend || sending}
                                className="gap-2 bg-gradient-to-r from-brand-500 to-violet-600 hover:from-brand-400 hover:to-violet-500 text-white px-6"
                            >
                                <Bell size={16} />
                                Envoyer la notification
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3 bg-surface-800 border border-amber-500/30 rounded-xl px-4 py-2.5">
                                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                                <span className="text-sm text-amber-300">Confirmer l'envoi ?</span>
                                <Button
                                    size="sm"
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="bg-brand-500 hover:bg-brand-400 text-white gap-1.5"
                                >
                                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Confirmer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setConfirmOpen(false)}
                                    disabled={sending}
                                    className="text-surface-400"
                                >
                                    Annuler
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ── Preview ───────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-4">
                            Aperçu notification
                        </h3>
                        {/* Phone mockup */}
                        <div className="bg-surface-800/50 rounded-xl p-3 border border-surface-700">
                            <div className="flex items-center gap-2 mb-2 opacity-60">
                                <div className="w-4 h-4 rounded-full bg-brand-500 shrink-0" />
                                <span className="text-xs text-surface-400 font-medium">KBouffe</span>
                                <span className="text-xs text-surface-600 ml-auto">maintenant</span>
                            </div>
                            <p className="text-sm font-semibold text-white truncate">
                                {title || "Titre de la notification"}
                            </p>
                            <p className="text-xs text-surface-400 mt-0.5 line-clamp-2">
                                {body || "Corps du message..."}
                            </p>
                        </div>

                        {/* Target summary */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-surface-500">Template</span>
                                <span className={cn("px-2 py-0.5 rounded-full border text-xs font-medium", TEMPLATE_BADGE_COLORS[selectedTemplate])}>
                                    {TEMPLATES.find(t => t.key === selectedTemplate)?.label}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-surface-500">Cible</span>
                                <span className={cn("px-2 py-0.5 rounded-full border text-xs font-medium", TARGET_BADGE_COLORS[targetType])}>
                                    {TARGET_OPTIONS.find(t => t.key === targetType)?.label}
                                    {targetValue && ` — ${targetValue}`}
                                </span>
                            </div>
                            {previewLoading ? (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-surface-500">Destinataires</span>
                                    <Loader2 size={12} className="animate-spin text-brand-400" />
                                </div>
                            ) : previewCount !== null ? (
                                <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <span className="text-emerald-300 font-medium">Appareils à cibler:</span>
                                    <span className="text-emerald-400 font-bold">{previewCount}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Drafts */}
                    {drafts.length > 0 && (
                        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-surface-400 mb-3 flex items-center gap-2">
                                <FileText size={12} />
                                Brouillons ({drafts.length})
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {drafts.map(draft => (
                                    <div key={draft.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors group">
                                        <button
                                            onClick={() => handleLoadDraft(draft.id)}
                                            className="flex-1 text-left min-w-0"
                                        >
                                            <p className="text-xs font-medium text-white truncate group-hover:text-brand-400">{draft.title || "Sans titre"}</p>
                                            <p className="text-[10px] text-surface-600">
                                                {new Date(draft.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDraft(draft.id)}
                                            className="p-1 text-surface-600 hover:text-red-400 transition-colors shrink-0"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-surface-400 mb-2">💡 Bonnes pratiques</h4>
                        <ul className="space-y-1.5 text-xs text-surface-500">
                            <li>• Titre court (&lt;65 car.) pour un meilleur affichage</li>
                            <li>• Évitez les envois après 22h</li>
                            <li>• Max 5 broadcasts par heure</li>
                            <li>• Les restaurants sans push token ne recevront pas la notif</li>
                        </ul>
                    </div>
                </motion.div>
            </div>

            {/* ── Historique ──────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
                    <div className="flex items-center gap-2">
                        <History size={16} className="text-surface-400" />
                        <h3 className="text-sm font-semibold text-white">Historique des broadcasts</h3>
                        <span className="text-xs text-surface-600">30 derniers</span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={fetchHistory}
                        disabled={loadingHistory}
                        className="text-surface-400 hover:text-white gap-1.5"
                    >
                        <RefreshCw size={13} className={cn(loadingHistory && "animate-spin")} />
                        Actualiser
                    </Button>
                </div>

                {loadingHistory ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 size={24} className="animate-spin text-brand-400" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-surface-500">
                        <Bell size={28} className="mb-2 opacity-30" />
                        <p className="text-sm">Aucun broadcast envoyé</p>
                    </div>
                ) : (
                    <div className="divide-y divide-surface-800/50">
                        {history.map((b) => (
                            <div key={b.id} className="flex items-start gap-4 px-5 py-3 hover:bg-surface-800/20 transition-colors">
                                {/* Template icon */}
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", TEMPLATE_BADGE_COLORS[b.template].replace("text-", "text-").split(" ")[0])}>
                                    {b.template === "maintenance" && <Wrench size={14} className="text-amber-400" />}
                                    {b.template === "feature"     && <Sparkles size={14} className="text-violet-400" />}
                                    {b.template === "promo"       && <Tag size={14} className="text-emerald-400" />}
                                    {b.template === "custom"      && <MessageSquare size={14} className="text-brand-400" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{b.title}</p>
                                    <p className="text-xs text-surface-500 truncate mt-0.5">{b.body}</p>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", TARGET_BADGE_COLORS[b.targetType])}>
                                        {targetLabel(b)}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-surface-500">
                                        <Smartphone size={11} />
                                        {b.tokensSent} appareils
                                    </div>
                                    <span className="text-xs text-surface-600">
                                        {new Date(b.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
