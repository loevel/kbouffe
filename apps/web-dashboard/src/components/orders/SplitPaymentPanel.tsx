"use client";

import { useState, useCallback, useEffect } from "react";
import {
    CheckCircle2,
    CircleDashed,
    XCircle,
    Smartphone,
    Banknote,
    Users,
    Plus,
    Trash2,
    Loader2,
    Split,
} from "lucide-react";
import { formatCFA, getPaymentLabel } from "@kbouffe/module-core/ui";

// ── Types ────────────────────────────────────────────────────────────────────

interface PaymentSplit {
    id: string;
    order_id: string;
    label: string;
    amount: number;
    payment_method: string;
    payment_status: "pending" | "paid" | "failed" | "refunded";
    payer_phone: string | null;
    payer_name: string | null;
    created_at: string;
}

interface SplitPaymentPanelProps {
    orderId: string;
    orderTotal: number;
    orderPaymentStatus: string;
    splitPaymentMode: string | null;
    onPaymentStatusChange?: (newStatus: string) => void;
}

type SplitMode = "mixed_methods" | "split_equal" | "split_by_person";

const PAYMENT_METHODS = [
    { id: "cash", label: "Especes", icon: <Banknote size={14} /> },
    { id: "mobile_money_mtn", label: "MTN MoMo", icon: <Smartphone size={14} className="text-yellow-500" /> },
    { id: "mobile_money_orange", label: "Orange Money", icon: <Smartphone size={14} className="text-orange-500" /> },
];

const STATUS_CONFIG = {
    pending: { icon: CircleDashed, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", label: "En attente" },
    paid:    { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", label: "Paye" },
    failed:  { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", label: "Echoue" },
    refunded:{ icon: XCircle, color: "text-surface-400", bg: "bg-surface-50 dark:bg-surface-800", label: "Rembourse" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function SplitPaymentPanel({
    orderId,
    orderTotal,
    orderPaymentStatus,
    splitPaymentMode,
    onPaymentStatusChange,
}: SplitPaymentPanelProps) {
    const [splits, setSplits] = useState<PaymentSplit[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [showCreator, setShowCreator] = useState(false);

    // ── Fetch existing splits ────────────────────────────────────────────────

    const fetchSplits = useCallback(async () => {
        try {
            const res = await fetch(`/api/orders/${orderId}/splits`);
            const data = await res.json();
            setSplits(data.splits ?? []);
        } catch {
            console.error("Failed to fetch splits");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchSplits();
    }, [fetchSplits]);

    // ── Confirm a split as paid ──────────────────────────────────────────────

    const confirmSplit = async (splitId: string) => {
        setConfirming(splitId);
        try {
            const res = await fetch(`/api/orders/${orderId}/splits/${splitId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_status: "paid" }),
            });
            const data = await res.json();
            if (res.ok) {
                setSplits((prev) =>
                    prev.map((s) => (s.id === splitId ? { ...s, payment_status: "paid" } : s)),
                );
                if (data.order_payment_status && onPaymentStatusChange) {
                    onPaymentStatusChange(data.order_payment_status);
                }
            }
        } catch {
            console.error("Failed to confirm split");
        } finally {
            setConfirming(null);
        }
    };

    // ── Progress calculation ─────────────────────────────────────────────────

    const paidAmount = splits.filter((s) => s.payment_status === "paid").reduce((sum, s) => sum + s.amount, 0);
    const paidPercent = orderTotal > 0 ? Math.round((paidAmount / orderTotal) * 100) : 0;

    // ── If no splits exist yet, show the creator button ──────────────────────

    if (!loading && splits.length === 0 && !showCreator) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                        <Split size={16} className="text-brand-500" />
                        Paiement
                    </h3>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                    Divisez le paiement entre plusieurs personnes ou moyens de paiement.
                </p>
                <button
                    onClick={() => setShowCreator(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-sm font-semibold"
                >
                    <Users size={16} />
                    Partager le paiement
                </button>
            </div>
        );
    }

    // ── Creator form ─────────────────────────────────────────────────────────

    if (showCreator && splits.length === 0) {
        return (
            <SplitCreatorForm
                orderId={orderId}
                orderTotal={orderTotal}
                onCreated={(newSplits) => {
                    setSplits(newSplits);
                    setShowCreator(false);
                }}
                onCancel={() => setShowCreator(false)}
            />
        );
    }

    // ── Existing splits view ─────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                    <Split size={16} className="text-brand-500" />
                    Paiement partage
                </h3>
                <span className="text-xs font-semibold text-surface-500 dark:text-surface-400">
                    {paidPercent}% encaisse
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${paidPercent}%` }}
                />
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500 dark:text-surface-400">
                    {formatCFA(paidAmount)} / {formatCFA(orderTotal)}
                </span>
                <span className={`font-semibold ${orderPaymentStatus === "paid" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {orderPaymentStatus === "paid" ? "Tout paye" : `${splits.filter((s) => s.payment_status !== "paid").length} part(s) restante(s)`}
                </span>
            </div>

            {/* Split cards */}
            <div className="space-y-2">
                {splits.map((split) => {
                    const cfg = STATUS_CONFIG[split.payment_status] ?? STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;

                    return (
                        <div
                            key={split.id}
                            className={`rounded-xl border p-4 transition-all ${
                                split.payment_status === "paid"
                                    ? "border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5"
                                    : "border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <StatusIcon size={18} className={cfg.color} />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">
                                            {split.label}
                                            {split.payer_name && (
                                                <span className="font-normal text-surface-500 dark:text-surface-400">
                                                    {" "}&mdash; {split.payer_name}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400">
                                            {getPaymentLabel(split.payment_method)}
                                            {split.payer_phone && ` \u2022 ${split.payer_phone}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-bold text-sm text-surface-900 dark:text-white">
                                        {formatCFA(split.amount)}
                                    </span>
                                    {split.payment_status === "pending" && (
                                        <button
                                            onClick={() => confirmSplit(split.id)}
                                            disabled={confirming === split.id}
                                            className="px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                                        >
                                            {confirming === split.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                "Confirmer"
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Split Creator Form ───────────────────────────────────────────────────────

interface SplitCreatorFormProps {
    orderId: string;
    orderTotal: number;
    onCreated: (splits: PaymentSplit[]) => void;
    onCancel: () => void;
}

interface DraftSplit {
    label: string;
    amount: string;
    payment_method: string;
    payer_name: string;
}

function SplitCreatorForm({ orderId, orderTotal, onCreated, onCancel }: SplitCreatorFormProps) {
    const [mode, setMode] = useState<SplitMode>("split_equal");
    const [personCount, setPersonCount] = useState(2);
    const [drafts, setDrafts] = useState<DraftSplit[]>(() => buildEqualDrafts(2, orderTotal));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Recalculate when mode or person count changes
    useEffect(() => {
        if (mode === "split_equal") {
            setDrafts(buildEqualDrafts(personCount, orderTotal));
        }
    }, [mode, personCount, orderTotal]);

    function buildEqualDrafts(count: number, total: number): DraftSplit[] {
        const base = Math.floor(total / count);
        const remainder = total - base * count;
        return Array.from({ length: count }, (_, i) => ({
            label: `Personne ${i + 1}`,
            amount: String(base + (i === 0 ? remainder : 0)),
            payment_method: "cash",
            payer_name: "",
        }));
    }

    const updateDraft = (idx: number, field: keyof DraftSplit, value: string) => {
        setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
    };

    const addDraft = () => {
        setDrafts((prev) => [
            ...prev,
            { label: `Personne ${prev.length + 1}`, amount: "0", payment_method: "cash", payer_name: "" },
        ]);
    };

    const removeDraft = (idx: number) => {
        if (drafts.length <= 2) return;
        setDrafts((prev) => prev.filter((_, i) => i !== idx));
    };

    const draftTotal = drafts.reduce((sum, d) => sum + (parseInt(d.amount) || 0), 0);
    const isValid = draftTotal === orderTotal && drafts.every((d) => parseInt(d.amount) > 0);

    const handleSubmit = async () => {
        if (!isValid) {
            setError(`Le total des parts (${formatCFA(draftTotal)}) doit correspondre au total (${formatCFA(orderTotal)})`);
            return;
        }
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/orders/${orderId}/splits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    split_mode: mode,
                    splits: drafts.map((d) => ({
                        label: d.label,
                        amount: parseInt(d.amount),
                        payment_method: d.payment_method,
                        payer_name: d.payer_name || null,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Erreur lors de la creation");
                return;
            }
            onCreated(data.splits);
        } catch {
            setError("Erreur reseau");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <Split size={16} className="text-brand-500" />
                Partager le paiement
            </h3>

            {/* Mode selector */}
            <div className="flex gap-2">
                {[
                    { id: "split_equal" as SplitMode, label: "Parts egales" },
                    { id: "mixed_methods" as SplitMode, label: "Montants libres" },
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                            mode === m.id
                                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                                : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300"
                        }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Equal split: person count */}
            {mode === "split_equal" && (
                <div className="flex items-center gap-3">
                    <label className="text-sm text-surface-500 dark:text-surface-400">Nombre de personnes</label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPersonCount(Math.max(2, personCount - 1))}
                            className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                            -
                        </button>
                        <span className="w-8 text-center font-bold text-surface-900 dark:text-white">{personCount}</span>
                        <button
                            onClick={() => setPersonCount(Math.min(10, personCount + 1))}
                            className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>
            )}

            {/* Draft splits */}
            <div className="space-y-2">
                {drafts.map((draft, idx) => (
                    <div
                        key={idx}
                        className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 space-y-2"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                value={draft.label}
                                onChange={(e) => updateDraft(idx, "label", e.target.value)}
                                className="flex-1 h-9 px-3 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                placeholder="Nom de la part"
                            />
                            <input
                                type="number"
                                value={draft.amount}
                                onChange={(e) => updateDraft(idx, "amount", e.target.value)}
                                disabled={mode === "split_equal"}
                                className="w-28 h-9 px-3 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
                                placeholder="Montant"
                            />
                            {mode !== "split_equal" && drafts.length > 2 && (
                                <button
                                    onClick={() => removeDraft(idx)}
                                    className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={draft.payment_method}
                                onChange={(e) => updateDraft(idx, "payment_method", e.target.value)}
                                className="flex-1 h-8 px-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                            >
                                {PAYMENT_METHODS.map((pm) => (
                                    <option key={pm.id} value={pm.id}>{pm.label}</option>
                                ))}
                            </select>
                            <input
                                value={draft.payer_name}
                                onChange={(e) => updateDraft(idx, "payer_name", e.target.value)}
                                className="flex-1 h-8 px-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                placeholder="Nom du payeur (optionnel)"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Add person (free mode only) */}
            {mode === "mixed_methods" && (
                <button
                    onClick={addDraft}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-surface-300 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-brand-400 hover:text-brand-500 transition-colors text-xs font-semibold"
                >
                    <Plus size={14} />
                    Ajouter une part
                </button>
            )}

            {/* Total check */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold ${
                isValid
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }`}>
                <span>Total des parts</span>
                <span>
                    {formatCFA(draftTotal)} / {formatCFA(orderTotal)}
                    {!isValid && draftTotal !== orderTotal && (
                        <span className="ml-1 text-xs">
                            ({draftTotal > orderTotal ? "+" : ""}{formatCFA(draftTotal - orderTotal)})
                        </span>
                    )}
                </span>
            </div>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!isValid || saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Split size={14} />}
                    Creer les parts
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium text-sm rounded-xl transition-colors"
                >
                    Annuler
                </button>
            </div>
        </div>
    );
}
