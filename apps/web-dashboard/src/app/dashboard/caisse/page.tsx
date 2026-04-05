"use client";

/**
 * /dashboard/caisse — Suivi de caisse
 * End-of-day cash reconciliation workflow for SYSCOHADA compliance.
 *
 * State A — No open session  : prompt to open with opening amount
 * State B — Session open     : live summary + movements + close button
 * State C — History tab      : last 30 closed sessions
 */

import { useState, useEffect, useCallback } from "react";
import {
    Banknote,
    Plus,
    Minus,
    X,
    Clock,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    History,
    RefreshCw,
    Lock,
    ArrowDownLeft,
    ArrowUpRight,
    ShoppingBag,
    ReceiptText,
    Loader2,
    ChevronRight,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CashSession {
    id: string;
    openingAmount: number;
    openedAt: string;
    operatorMemberId: string | null;
}

interface SessionSummary {
    totalSales: number;
    totalCashIn: number;
    totalCashOut: number;
    totalRefunds: number;
    expectedAmount: number;
    movementCount: number;
}

interface CashMovement {
    id: string;
    type: "cash_in" | "cash_out" | "sale" | "refund";
    amount: number;
    note: string | null;
    created_at: string;
}

interface ClosedSession {
    id: string;
    opening_amount: number;
    closing_amount: number | null;
    expected_amount: number | null;
    discrepancy: number | null;
    notes: string | null;
    opened_at: string;
    closed_at: string;
}

interface SessionDetail {
    session: ClosedSession;
    movements: CashMovement[];
}

type ActiveTab = "session" | "history";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
    return new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(new Date(iso));
}

function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(iso));
}

function formatDuration(openedAt: string, closedAt?: string) {
    const start = new Date(openedAt).getTime();
    const end = closedAt ? new Date(closedAt).getTime() : Date.now();
    const minutes = Math.round((end - start) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const MOVEMENT_CONFIG: Record<
    string,
    { label: string; icon: React.ReactNode; colorClass: string; sign: string }
> = {
    sale: {
        label: "Vente",
        icon: <ShoppingBag size={14} />,
        colorClass: "text-green-600 dark:text-green-400",
        sign: "+",
    },
    cash_in: {
        label: "Entrée",
        icon: <ArrowDownLeft size={14} />,
        colorClass: "text-blue-600 dark:text-blue-400",
        sign: "+",
    },
    cash_out: {
        label: "Sortie",
        icon: <ArrowUpRight size={14} />,
        colorClass: "text-orange-600 dark:text-orange-400",
        sign: "-",
    },
    refund: {
        label: "Remboursement",
        icon: <ReceiptText size={14} />,
        colorClass: "text-red-600 dark:text-red-400",
        sign: "-",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({
    label,
    value,
    icon,
    colorClass,
    subLabel,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
    subLabel?: string;
}) {
    return (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4 flex items-start gap-3">
            <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass} bg-current/10`}
            >
                <span className="text-current">{icon}</span>
            </span>
            <div className="min-w-0">
                <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">{label}</p>
                <p className="text-lg font-bold text-surface-900 dark:text-white leading-tight mt-0.5">
                    {value}
                </p>
                {subLabel && (
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{subLabel}</p>
                )}
            </div>
        </div>
    );
}

function MovementTypeBadge({ type }: { type: string }) {
    const cfg = MOVEMENT_CONFIG[type];
    if (!cfg) return null;
    const bgMap: Record<string, string> = {
        sale: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        cash_in: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        cash_out: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
        refund: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    };
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgMap[type]}`}
        >
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Open Session
// ─────────────────────────────────────────────────────────────────────────────

function OpenSessionModal({
    onClose,
    onOpened,
}: {
    onClose: () => void;
    onOpened: () => void;
}) {
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
        if (isNaN(parsed) || parsed < 0) {
            setError("Veuillez saisir un montant valide (0 ou plus)");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await authFetch("/api/caisse/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ openingAmount: Math.round(parsed) }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Erreur lors de l'ouverture");
                return;
            }
            onOpened();
            onClose();
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/15 flex items-center justify-center text-green-600 dark:text-green-400">
                            <Banknote size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                                Ouvrir la caisse
                            </h2>
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                                Saisir le fond de caisse initial
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center text-surface-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Fond de caisse initial (FCFA)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="500"
                            placeholder="Ex: 50 000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white text-lg font-semibold placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                            autoFocus
                        />
                        <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
                            Montant total des espèces présentes dans la caisse à l&apos;ouverture
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                            <AlertTriangle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                            Ouvrir la session
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Add Movement
// ─────────────────────────────────────────────────────────────────────────────

function AddMovementModal({
    onClose,
    onAdded,
}: {
    onClose: () => void;
    onAdded: () => void;
}) {
    const [type, setType] = useState<"cash_in" | "cash_out">("cash_in");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
        if (isNaN(parsed) || parsed <= 0) {
            setError("Veuillez saisir un montant positif");
            return;
        }
        if (!note.trim()) {
            setError("La note est obligatoire");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await authFetch("/api/caisse/movement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, amount: Math.round(parsed), note: note.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Erreur lors de l'ajout");
                return;
            }
            onAdded();
            onClose();
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                            Ajouter un mouvement
                        </h2>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                            Entrée ou sortie manuelle de caisse
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center text-surface-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type selector */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Type de mouvement
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType("cash_in")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                                    type === "cash_in"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300"
                                }`}
                            >
                                <Plus size={16} />
                                Entrée cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("cash_out")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                                    type === "cash_out"
                                        ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                        : "border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300"
                                }`}
                            >
                                <Minus size={16} />
                                Sortie cash
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Montant (FCFA)
                        </label>
                        <input
                            type="number"
                            min="1"
                            step="500"
                            placeholder="Ex: 5 000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white text-lg font-semibold placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Note <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder={
                                type === "cash_in"
                                    ? "Ex: Appoint fond de caisse"
                                    : "Ex: Achat fournitures"
                            }
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                            <AlertTriangle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : type === "cash_in" ? (
                                <Plus size={16} />
                            ) : (
                                <Minus size={16} />
                            )}
                            Confirmer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Close Session
// ─────────────────────────────────────────────────────────────────────────────

function CloseSessionModal({
    expectedAmount,
    onClose,
    onClosed,
}: {
    expectedAmount: number;
    onClose: () => void;
    onClosed: () => void;
}) {
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parsedAmount = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
    const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 0;
    const discrepancy = isValidAmount ? Math.round(parsedAmount) - expectedAmount : null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValidAmount) {
            setError("Veuillez saisir un montant valide");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await authFetch("/api/caisse/close", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    closingAmount: Math.round(parsedAmount),
                    notes: notes.trim() || null 
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Erreur lors de la clôture");
                return;
            }
            onClosed();
            onClose();
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                                Clôturer la caisse
                            </h2>
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                                Comptage physique des espèces
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center text-surface-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Montant compté dans la caisse (FCFA)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="500"
                            placeholder="Saisir le montant physique..."
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white text-lg font-semibold placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                            autoFocus
                        />
                    </div>

                    {/* Reconciliation preview */}
                    <div className="rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-surface-600 dark:text-surface-400">
                                Montant attendu
                            </span>
                            <span className="text-sm font-semibold text-surface-900 dark:text-white">
                                {formatCFA(expectedAmount)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-surface-600 dark:text-surface-400">
                                Montant compté
                            </span>
                            <span className="text-sm font-semibold text-surface-900 dark:text-white">
                                {isValidAmount ? formatCFA(Math.round(parsedAmount)) : "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-800/50">
                            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                Écart
                            </span>
                            {discrepancy !== null ? (
                                <span
                                    className={`text-sm font-bold ${
                                        discrepancy === 0
                                            ? "text-green-600 dark:text-green-400"
                                            : discrepancy < 0
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-amber-600 dark:text-amber-400"
                                    }`}
                                >
                                    {discrepancy > 0 ? "+" : ""}
                                    {formatCFA(discrepancy)}
                                    {discrepancy === 0 && (
                                        <CheckCircle2 size={14} className="inline ml-1" />
                                    )}
                                    {discrepancy < 0 && (
                                        <AlertTriangle size={14} className="inline ml-1" />
                                    )}
                                </span>
                            ) : (
                                <span className="text-sm text-surface-400">—</span>
                            )}
                        </div>
                    </div>

                    {discrepancy !== null && discrepancy < 0 && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                Il manque <strong>{formatCFA(Math.abs(discrepancy))}</strong> dans la
                                caisse. L&apos;écart sera enregistré dans le rapport.
                            </span>
                        </div>
                    )}

                    {/* Notes field */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Notes de clôture (optionnel)
                        </label>
                        <textarea
                            placeholder="Ex: Livraison effectuée, client remboursé..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                            rows={3}
                        />
                        <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
                            Documentez les écarts ou événements importants
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                            <AlertTriangle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !isValidAmount}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Lock size={16} />
                            )}
                            Clôturer la session
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// State A — Empty state (no open session)
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onOpenSession }: { onOpenSession: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-6">
                <Banknote size={36} className="text-brand-500" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                Aucune session ouverte
            </h2>
            <p className="text-surface-500 dark:text-surface-400 max-w-sm mb-8">
                Ouvrez une session de caisse pour commencer à enregistrer les mouvements et
                préparer la clôture journalière.
            </p>
            <button
                onClick={onOpenSession}
                className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold shadow-md shadow-brand-500/20 transition"
            >
                <Banknote size={18} />
                Ouvrir la caisse
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// State B — Open session view
// ─────────────────────────────────────────────────────────────────────────────

function OpenSessionView({
    session,
    summary,
    movements,
    onRefresh,
    onAddMovement,
    onCloseSession,
}: {
    session: CashSession;
    summary: SessionSummary;
    movements: CashMovement[];
    onRefresh: () => void;
    onAddMovement: () => void;
    onCloseSession: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* Session header card */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-brand-200 text-sm font-medium mb-1">Session ouverte</p>
                        <p className="text-3xl font-bold">{formatCFA(summary.expectedAmount)}</p>
                        <p className="text-brand-200 text-sm mt-1">Montant attendu en caisse</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end text-brand-200 text-sm">
                            <Clock size={14} />
                            <span>{formatDuration(session.openedAt)}</span>
                        </div>
                        <p className="text-brand-200 text-xs mt-1">
                            Ouverture à {formatTime(session.openedAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-brand-500/50">
                    <div>
                        <p className="text-brand-300 text-xs">Fond initial</p>
                        <p className="text-white font-semibold">{formatCFA(session.openingAmount)}</p>
                    </div>
                    <div className="w-px h-8 bg-brand-500/50" />
                    <div>
                        <p className="text-brand-300 text-xs">Mouvements</p>
                        <p className="text-white font-semibold">{summary.movementCount}</p>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard
                    label="Ventes cash"
                    value={formatCFA(summary.totalSales)}
                    icon={<ShoppingBag size={18} />}
                    colorClass="text-green-600 dark:text-green-400"
                />
                <SummaryCard
                    label="Entrées manuelles"
                    value={formatCFA(summary.totalCashIn)}
                    icon={<TrendingUp size={18} />}
                    colorClass="text-blue-600 dark:text-blue-400"
                />
                <SummaryCard
                    label="Sorties manuelles"
                    value={formatCFA(summary.totalCashOut)}
                    icon={<TrendingDown size={18} />}
                    colorClass="text-orange-600 dark:text-orange-400"
                />
                <SummaryCard
                    label="Remboursements"
                    value={formatCFA(summary.totalRefunds)}
                    icon={<ReceiptText size={18} />}
                    colorClass="text-red-600 dark:text-red-400"
                />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={onAddMovement}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-sm shadow-sm transition"
                >
                    <Plus size={16} />
                    Ajouter un mouvement
                </button>
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-4 py-2.5 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-xl font-medium text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition"
                >
                    <RefreshCw size={16} />
                    Actualiser
                </button>
                <button
                    onClick={onCloseSession}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm shadow-sm transition ml-auto"
                >
                    <Lock size={16} />
                    Clôturer la caisse
                </button>
            </div>

            {/* Recent movements table */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900 dark:text-white">
                        Mouvements récents
                    </h3>
                    <span className="text-xs text-surface-400">
                        {movements.length} mouvement{movements.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {movements.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <p className="text-surface-400 dark:text-surface-500 text-sm">
                            Aucun mouvement enregistré pour cette session
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
                        {movements.map((m) => {
                            const cfg = MOVEMENT_CONFIG[m.type];
                            return (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition"
                                >
                                    <MovementTypeBadge type={m.type} />
                                    <span className="flex-1 text-sm text-surface-700 dark:text-surface-300 truncate">
                                        {m.note ?? "—"}
                                    </span>
                                    <span
                                        className={`text-sm font-semibold tabular-nums shrink-0 ${cfg?.colorClass ?? ""}`}
                                    >
                                        {cfg?.sign}
                                        {formatCFA(m.amount)}
                                    </span>
                                    <span className="text-xs text-surface-400 shrink-0">
                                        {formatTime(m.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Session Details
// ─────────────────────────────────────────────────────────────────────────────

function SessionDetailModal({
    detail,
    onClose,
}: {
    detail: SessionDetail;
    onClose: () => void;
}) {
    const { session, movements } = detail;
    const hasDiscrepancy = (session.discrepancy ?? 0) !== 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                            Détails de la session
                        </h2>
                        <p className="text-xs text-surface-500 mt-1">
                            {formatDateTime(session.opened_at)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center text-surface-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Session Summary */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-surface-900 dark:text-white text-sm">
                            Récapitulatif
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                                <p className="text-xs text-surface-500 mb-1">Montant d'ouverture</p>
                                <p className="font-semibold text-surface-900 dark:text-white">
                                    {formatCFA(session.opening_amount)}
                                </p>
                            </div>
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                                <p className="text-xs text-surface-500 mb-1">Montant compté</p>
                                <p className="font-semibold text-surface-900 dark:text-white">
                                    {session.closing_amount !== null ? formatCFA(session.closing_amount) : "—"}
                                </p>
                            </div>
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                                <p className="text-xs text-surface-500 mb-1">Montant attendu</p>
                                <p className="font-semibold text-surface-900 dark:text-white">
                                    {session.expected_amount !== null ? formatCFA(session.expected_amount) : "—"}
                                </p>
                            </div>
                            <div className={`rounded-lg p-3 ${
                                !hasDiscrepancy
                                    ? "bg-green-50 dark:bg-green-500/10"
                                    : (session.discrepancy ?? 0) < 0
                                    ? "bg-red-50 dark:bg-red-500/10"
                                    : "bg-amber-50 dark:bg-amber-500/10"
                            }`}>
                                <p className={`text-xs mb-1 ${
                                    !hasDiscrepancy
                                        ? "text-green-600 dark:text-green-400"
                                        : (session.discrepancy ?? 0) < 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-amber-600 dark:text-amber-400"
                                }`}>
                                    Écart
                                </p>
                                <p className={`font-semibold ${
                                    !hasDiscrepancy
                                        ? "text-green-700 dark:text-green-300"
                                        : (session.discrepancy ?? 0) < 0
                                        ? "text-red-700 dark:text-red-300"
                                        : "text-amber-700 dark:text-amber-300"
                                }`}>
                                    {session.discrepancy !== null ? (
                                        <>
                                            {session.discrepancy > 0 ? "+" : ""}
                                            {formatCFA(session.discrepancy)}
                                        </>
                                    ) : (
                                        "—"
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                                Notes
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                                {session.notes}
                            </p>
                        </div>
                    )}

                    {/* Movements */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-surface-900 dark:text-white text-sm">
                            Mouvements ({movements.length})
                        </h3>
                        {movements.length === 0 ? (
                            <p className="text-xs text-surface-500 text-center py-4">
                                Aucun mouvement manuel enregistré
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {movements.map((m) => {
                                    const config = MOVEMENT_CONFIG[m.type] || {
                                        label: m.type,
                                        icon: null,
                                        colorClass: "text-surface-400",
                                        sign: "+",
                                    };
                                    return (
                                        <div
                                            key={m.id}
                                            className="flex items-center justify-between p-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-700 ${config.colorClass}`}>
                                                    {config.icon}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-surface-900 dark:text-white">
                                                        {config.label}
                                                    </p>
                                                    {m.note && (
                                                        <p className="text-xs text-surface-500">
                                                            {m.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`font-semibold ${config.colorClass}`}>
                                                {config.sign}{formatCFA(m.amount)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Timestamps */}
                    <div className="pt-4 border-t border-surface-200 dark:border-surface-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-surface-600 dark:text-surface-400">
                            <span>Ouverture:</span>
                            <span>{formatDateTime(session.opened_at)}</span>
                        </div>
                        <div className="flex items-center justify-between text-surface-600 dark:text-surface-400">
                            <span>Clôture:</span>
                            <span>{formatDateTime(session.closed_at)}</span>
                        </div>
                        <div className="flex items-center justify-between text-surface-600 dark:text-surface-400">
                            <span>Durée:</span>
                            <span>{formatDuration(session.opened_at, session.closed_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Close button */}
                <div className="sticky bottom-0 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-700 transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// State C — History view
// ─────────────────────────────────────────────────────────────────────────────

function HistoryView({
    sessions,
    onViewDetails,
}: {
    sessions: ClosedSession[];
    onViewDetails: (sessionId: string) => void;
}) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <History size={40} className="text-surface-300 dark:text-surface-600 mb-4" />
                <p className="text-surface-500 dark:text-surface-400">
                    Aucune session clôturée pour ce restaurant
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700">
                <h3 className="font-semibold text-surface-900 dark:text-white">
                    Historique des sessions
                </h3>
                <p className="text-xs text-surface-400 mt-0.5">30 dernières sessions clôturées</p>
            </div>

            <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
                {sessions.map((s) => {
                    const hasDiscrepancy = s.discrepancy !== null && s.discrepancy !== 0;
                    const isShort = s.discrepancy !== null && s.discrepancy < 0;

                    return (
                        <div
                            key={s.id}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition"
                        >
                            {/* Date + duration */}
                            <div className="shrink-0 text-center min-w-[80px]">
                                <p className="text-sm font-semibold text-surface-900 dark:text-white">
                                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
                                        new Date(s.closed_at),
                                    )}
                                </p>
                                <p className="text-xs text-surface-400 mt-0.5">
                                    {formatDuration(s.opened_at, s.closed_at)}
                                </p>
                            </div>

                            {/* Opening → Closing */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-surface-500 dark:text-surface-400">
                                        Fond:
                                    </span>
                                    <span className="font-medium text-surface-900 dark:text-white">
                                        {formatCFA(s.opening_amount)}
                                    </span>
                                    <ChevronRight size={14} className="text-surface-300 shrink-0" />
                                    <span className="font-medium text-surface-900 dark:text-white">
                                        {s.closing_amount !== null
                                            ? formatCFA(s.closing_amount)
                                            : "—"}
                                    </span>
                                </div>
                                <p className="text-xs text-surface-400 mt-0.5">
                                    Attendu: {s.expected_amount !== null ? formatCFA(s.expected_amount) : "—"}
                                </p>
                            </div>

                            {/* Discrepancy badge */}
                            <div className="shrink-0 text-right">
                                {s.discrepancy !== null ? (
                                    <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            !hasDiscrepancy
                                                ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                                                : isShort
                                                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                                        }`}
                                    >
                                        {!hasDiscrepancy ? (
                                            <CheckCircle2 size={12} />
                                        ) : (
                                            <AlertTriangle size={12} />
                                        )}
                                        {s.discrepancy > 0 ? "+" : ""}
                                        {formatCFA(s.discrepancy)}
                                    </span>
                                ) : (
                                    <span className="text-xs text-surface-400">—</span>
                                )}
                            </div>

                            {/* Time */}
                            <div className="shrink-0 text-right hidden sm:block">
                                <p className="text-xs text-surface-400">
                                    {formatDateTime(s.closed_at)}
                                </p>
                            </div>

                            {/* View Details Button */}
                            <button
                                onClick={() => onViewDetails(s.id)}
                                className="shrink-0 px-3 py-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition"
                            >
                                Détails
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CaissePage() {
    // ── State ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<ActiveTab>("session");
    const [isPageLoading, setIsPageLoading] = useState(true);

    // Session data
    const [session, setSession] = useState<CashSession | null>(null);
    const [summary, setSummary] = useState<SessionSummary | null>(null);
    const [movements, setMovements] = useState<CashMovement[]>([]);

    // History data
    const [history, setHistory] = useState<ClosedSession[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Modals
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showAddMovementModal, setShowAddMovementModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);

    // ── Fetch current session ───────────────────────────────────────────
    const fetchCurrent = useCallback(async () => {
        try {
            const res = await authFetch("/api/caisse/current");
            if (!res.ok) return;
            const data = await res.json();
            if (data.session) {
                setSession(data.session);
                setSummary(data.summary);
                setMovements(data.recentMovements ?? []);
            } else {
                setSession(null);
                setSummary(null);
                setMovements([]);
            }
        } catch {
            // silent — handled by loading state
        }
    }, []);

    // ── Fetch history ───────────────────────────────────────────────────
    const fetchHistory = useCallback(async () => {
        setIsHistoryLoading(true);
        try {
            const res = await authFetch("/api/caisse/history");
            if (!res.ok) return;
            const data = await res.json();
            setHistory(data.sessions ?? []);
        } catch {
            // silent
        } finally {
            setIsHistoryLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        (async () => {
            await fetchCurrent();
            setIsPageLoading(false);
        })();
    }, [fetchCurrent]);

    // Load history when switching tab
    useEffect(() => {
        if (activeTab === "history") {
            fetchHistory();
        }
    }, [activeTab, fetchHistory]);

    // ── Fetch session details ───────────────────────────────────────────
    const fetchSessionDetail = useCallback(async (sessionId: string) => {
        try {
            const res = await authFetch(`/api/caisse/${sessionId}/report`);
            if (!res.ok) return;
            const data = await res.json();
            setSessionDetail({
                session: data.session,
                movements: data.movements ?? [],
            });
        } catch {
            // silent
        }
    }, []);

    // ── Handlers ────────────────────────────────────────────────────────
    function handleSessionOpened() {
        fetchCurrent();
        setActiveTab("session");
    }

    function handleSessionClosed() {
        setSession(null);
        setSummary(null);
        setMovements([]);
        setActiveTab("session");
        // Refresh history in background
        fetchHistory();
    }

    function handleMovementAdded() {
        fetchCurrent();
    }

    async function handleViewDetails(sessionId: string) {
        await fetchSessionDetail(sessionId);
    }

    // ── Render ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <Banknote size={28} className="text-brand-500" />
                        Suivi de caisse
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">
                        Réconciliation journalière des espèces — conformité SYSCOHADA
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 self-start sm:self-auto">
                    <button
                        onClick={() => setActiveTab("session")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === "session"
                                ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                        }`}
                    >
                        <Banknote size={15} />
                        Session
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === "history"
                                ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                        }`}
                    >
                        <History size={15} />
                        Historique
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isPageLoading && (
                <div className="flex items-center justify-center py-24">
                    <Loader2 size={32} className="animate-spin text-brand-500" />
                </div>
            )}

            {/* Session tab */}
            {!isPageLoading && activeTab === "session" && (
                <>
                    {session && summary ? (
                        <OpenSessionView
                            session={session}
                            summary={summary}
                            movements={movements}
                            onRefresh={fetchCurrent}
                            onAddMovement={() => setShowAddMovementModal(true)}
                            onCloseSession={() => setShowCloseModal(true)}
                        />
                    ) : (
                        <EmptyState onOpenSession={() => setShowOpenModal(true)} />
                    )}
                </>
            )}

            {/* History tab */}
            {!isPageLoading && activeTab === "history" && (
                <>
                    {isHistoryLoading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 size={32} className="animate-spin text-brand-500" />
                        </div>
                    ) : (
                        <HistoryView sessions={history} onViewDetails={handleViewDetails} />
                    )}
                </>
            )}

            {/* Modals */}
            {showOpenModal && (
                <OpenSessionModal
                    onClose={() => setShowOpenModal(false)}
                    onOpened={handleSessionOpened}
                />
            )}

            {showAddMovementModal && (
                <AddMovementModal
                    onClose={() => setShowAddMovementModal(false)}
                    onAdded={handleMovementAdded}
                />
            )}

            {showCloseModal && summary && (
                <CloseSessionModal
                    expectedAmount={summary.expectedAmount}
                    onClose={() => setShowCloseModal(false)}
                    onClosed={handleSessionClosed}
                />
            )}

            {sessionDetail && (
                <SessionDetailModal
                    detail={sessionDetail}
                    onClose={() => setSessionDetail(null)}
                />
            )}
        </div>
    );
}
