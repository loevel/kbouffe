"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Gift,
    Plus,
    Loader2,
    X,
    ChevronRight,
    Wallet,
    Calendar,
    User,
    Hash,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowDownLeft,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GiftCard {
    id: string;
    code: string;
    initial_balance: number;
    current_balance: number;
    issued_to: string | null;
    note: string | null;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

interface GiftCardMovement {
    id: string;
    gift_card_id: string;
    order_id: string | null;
    amount: number;
    balance_after: number;
    type: "issue" | "redeem" | "reload" | "expire";
    note: string | null;
    created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCardStatus(card: GiftCard): "active" | "expired" | "depleted" | "inactive" {
    if (!card.is_active) return "inactive";
    if (card.expires_at && new Date(card.expires_at) < new Date()) return "expired";
    if (card.current_balance === 0) return "depleted";
    return "active";
}

function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(dateStr));
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    active:   { label: "Actif",   className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",  icon: <CheckCircle2 size={12} /> },
    expired:  { label: "Expiré",  className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",  icon: <Clock size={12} /> },
    depleted: { label: "Épuisé",  className: "bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400", icon: <XCircle size={12} /> },
    inactive: { label: "Inactif", className: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",          icon: <XCircle size={12} /> },
};

const MOVEMENT_LABELS: Record<string, string> = {
    issue:  "Émission",
    redeem: "Utilisation",
    reload: "Rechargement",
    expire: "Expiration",
};

// ── CreateModal ───────────────────────────────────────────────────────────────

interface CreateModalProps {
    onClose: () => void;
    onCreated: (card: GiftCard) => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
    const [amount, setAmount] = useState("");
    const [issuedTo, setIssuedTo] = useState("");
    const [note, setNote] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const balance = Number(amount);
        if (!balance || balance <= 0 || !Number.isInteger(balance)) {
            setError("Entrez un montant entier positif en FCFA.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await authFetch("/api/gift-cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    initial_balance: balance,
                    issued_to: issuedTo.trim() || undefined,
                    note: note.trim() || undefined,
                    expires_at: expiresAt || undefined,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? "Erreur lors de la création");
                return;
            }

            onCreated(json.gift_card as GiftCard);
        } catch {
            setError("Erreur réseau. Réessayez.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center">
                            <Gift size={16} className="text-brand-500" />
                        </div>
                        <h2 className="font-bold text-surface-900 dark:text-white">
                            Nouvelle carte cadeau
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        aria-label="Fermer"
                    >
                        <X size={18} className="text-surface-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Montant */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                            Montant (FCFA) *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="ex : 5000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-brand-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-surface-400 font-semibold">
                                FCFA
                            </span>
                        </div>
                    </div>

                    {/* Bénéficiaire */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                            Bénéficiaire (optionnel)
                        </label>
                        <input
                            type="text"
                            placeholder="Nom ou téléphone"
                            value={issuedTo}
                            onChange={(e) => setIssuedTo(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-brand-500"
                        />
                    </div>

                    {/* Note / Occasion */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                            Occasion / Note (optionnel)
                        </label>
                        <input
                            type="text"
                            placeholder="ex : Anniversaire, Noël…"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-brand-500"
                        />
                    </div>

                    {/* Expiration */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                            Date d&apos;expiration (optionnel)
                        </label>
                        <input
                            type="date"
                            value={expiresAt}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3">
                            <AlertCircle size={15} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {submitting ? (
                                <><Loader2 size={14} className="animate-spin" /> Création…</>
                            ) : (
                                <><Gift size={14} /> Créer la carte</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── CreatedSuccessModal ───────────────────────────────────────────────────────

function CreatedSuccessModal({ card, onClose }: { card: GiftCard; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-surface-900 rounded-2xl shadow-2xl text-center p-8">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
                    Carte créée !
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
                    Communiquez ce code au bénéficiaire.
                </p>
                <div className="bg-brand-50 dark:bg-brand-500/10 rounded-2xl px-6 py-4 mb-6 border border-brand-200 dark:border-brand-500/30">
                    <p className="text-xs text-brand-500 font-semibold uppercase tracking-wide mb-1">Code carte cadeau</p>
                    <p className="text-2xl font-mono font-black tracking-[0.2em] text-brand-600 dark:text-brand-400">
                        {card.code}
                    </p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-2">
                        {formatCFA(card.initial_balance)}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
}

// ── DetailDrawer ──────────────────────────────────────────────────────────────

interface DetailDrawerProps {
    card: GiftCard;
    onClose: () => void;
    onDeactivate: (id: string) => void;
}

function DetailDrawer({ card, onClose, onDeactivate }: DetailDrawerProps) {
    const [movements, setMovements] = useState<GiftCardMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [deactivating, setDeactivating] = useState(false);

    const status = getCardStatus(card);
    const badge = STATUS_BADGE[status];

    useEffect(() => {
        authFetch(`/api/gift-cards/${card.id}`)
            .then((r) => r.json())
            .then((json) => setMovements(json.movements ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [card.id]);

    const handleDeactivate = async () => {
        if (!confirm("Désactiver cette carte cadeau ? Cette action est irréversible.")) return;
        setDeactivating(true);
        try {
            await authFetch(`/api/gift-cards/${card.id}`, { method: "DELETE" });
            onDeactivate(card.id);
        } catch {
            alert("Erreur lors de la désactivation.");
        } finally {
            setDeactivating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-surface-900 shadow-2xl h-full overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700 sticky top-0 bg-white dark:bg-surface-900">
                    <div>
                        <p className="font-mono font-bold text-surface-900 dark:text-white tracking-widest">
                            {card.code}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${badge.className}`}>
                            {badge.icon}
                            {badge.label}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                        <X size={18} className="text-surface-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 px-6 py-5 space-y-6">
                    {/* Solde */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Solde initial</p>
                            <p className="font-bold text-surface-900 dark:text-white">{formatCFA(card.initial_balance)}</p>
                        </div>
                        <div className="bg-brand-50 dark:bg-brand-500/10 rounded-xl p-4 border border-brand-100 dark:border-brand-500/20">
                            <p className="text-xs text-brand-500 mb-1">Solde actuel</p>
                            <p className="font-bold text-brand-600 dark:text-brand-400">{formatCFA(card.current_balance)}</p>
                        </div>
                    </div>

                    {/* Infos */}
                    <div className="space-y-3">
                        {card.issued_to && (
                            <div className="flex items-center gap-3 text-sm">
                                <User size={15} className="text-surface-400 shrink-0" />
                                <span className="text-surface-700 dark:text-surface-300">{card.issued_to}</span>
                            </div>
                        )}
                        {card.note && (
                            <div className="flex items-center gap-3 text-sm">
                                <Hash size={15} className="text-surface-400 shrink-0" />
                                <span className="text-surface-700 dark:text-surface-300">{card.note}</span>
                            </div>
                        )}
                        {card.expires_at && (
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar size={15} className="text-surface-400 shrink-0" />
                                <span className="text-surface-700 dark:text-surface-300">
                                    Expire le {formatDate(card.expires_at)}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar size={15} className="text-surface-400 shrink-0" />
                            <span className="text-surface-500 dark:text-surface-400">
                                Créée le {formatDate(card.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Mouvements */}
                    <div>
                        <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-3">
                            Historique
                        </p>
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 size={20} className="animate-spin text-surface-400" />
                            </div>
                        ) : movements.length === 0 ? (
                            <p className="text-sm text-surface-400 text-center py-4">
                                Aucun mouvement enregistré.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {movements.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-xl px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${m.amount < 0 ? "bg-red-100 dark:bg-red-500/15" : "bg-green-100 dark:bg-green-500/15"}`}>
                                                <ArrowDownLeft
                                                    size={13}
                                                    className={m.amount < 0 ? "text-red-500 rotate-0" : "text-green-500 rotate-180"}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                                                    {MOVEMENT_LABELS[m.type] ?? m.type}
                                                </p>
                                                <p className="text-xs text-surface-400">{formatDate(m.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${m.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                                {m.amount < 0 ? "-" : "+"}{formatCFA(Math.abs(m.amount))}
                                            </p>
                                            <p className="text-xs text-surface-400">
                                                Solde : {formatCFA(m.balance_after)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer — désactivation */}
                {card.is_active && (
                    <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700">
                        <button
                            onClick={handleDeactivate}
                            disabled={deactivating}
                            className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                            {deactivating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Désactiver la carte"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── GiftCardsPage ─────────────────────────────────────────────────────────────

export default function GiftCardsPage() {
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
    const [showCreate, setShowCreate] = useState(false);
    const [createdCard, setCreatedCard] = useState<GiftCard | null>(null);
    const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);

    const fetchCards = useCallback(async () => {
        setLoading(true);
        try {
            const params = filterActive !== "all" ? `?is_active=${filterActive === "active"}` : "";
            const res = await authFetch(`/api/gift-cards${params}`);
            const json = await res.json();
            setCards(json.gift_cards ?? []);
        } catch (err) {
            console.error("Failed to fetch gift cards:", err);
        } finally {
            setLoading(false);
        }
    }, [filterActive]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const handleCreated = (card: GiftCard) => {
        setShowCreate(false);
        setCreatedCard(card);
        setCards((prev) => [card, ...prev]);
    };

    const handleDeactivated = (id: string) => {
        setSelectedCard(null);
        setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, is_active: false } : c))
        );
    };

    const activeCount = cards.filter((c) => getCardStatus(c) === "active").length;
    const totalBalance = cards
        .filter((c) => getCardStatus(c) === "active")
        .reduce((sum, c) => sum + c.current_balance, 0);

    return (
        <div>
            {/* Modals */}
            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}
            {createdCard && (
                <CreatedSuccessModal
                    card={createdCard}
                    onClose={() => setCreatedCard(null)}
                />
            )}
            {selectedCard && (
                <DetailDrawer
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    onDeactivate={handleDeactivated}
                />
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                    <Gift size={24} className="text-brand-500" />
                    Cartes Cadeaux
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Gérez les cartes cadeaux de votre restaurant
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Gift size={16} className="text-brand-500" />
                        <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Cartes actives</p>
                    </div>
                    <p className="text-2xl font-black text-surface-900 dark:text-white">{activeCount}</p>
                </div>
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet size={16} className="text-green-500" />
                        <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Solde total</p>
                    </div>
                    <p className="text-2xl font-black text-surface-900 dark:text-white">{formatCFA(totalBalance)}</p>
                </div>
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-4 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Hash size={16} className="text-surface-400" />
                        <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Total émises</p>
                    </div>
                    <p className="text-2xl font-black text-surface-900 dark:text-white">{cards.length}</p>
                </div>
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between gap-4 mb-5">
                {/* Filter tabs */}
                <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
                    {(["all", "active", "inactive"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilterActive(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                filterActive === f
                                    ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                                    : "text-surface-500 dark:text-surface-400 hover:text-surface-700"
                            }`}
                        >
                            {f === "all" ? "Toutes" : f === "active" ? "Actives" : "Inactives"}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <Plus size={15} />
                    Nouvelle carte
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-surface-400" />
                </div>
            ) : cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                        <Gift size={28} className="text-surface-300 dark:text-surface-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-surface-700 dark:text-surface-300">
                            Aucune carte cadeau
                        </p>
                        <p className="text-sm text-surface-400 mt-1">
                            Créez votre première carte cadeau pour vos clients.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors mt-1"
                    >
                        <Plus size={15} />
                        Créer une carte cadeau
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card) => {
                        const status = getCardStatus(card);
                        const badge = STATUS_BADGE[status];
                        const progressPercent = card.initial_balance > 0
                            ? Math.round((card.current_balance / card.initial_balance) * 100)
                            : 0;

                        return (
                            <button
                                key={card.id}
                                onClick={() => setSelectedCard(card)}
                                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 text-left hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all group"
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/25">
                                        <Gift size={18} className="text-white" />
                                    </div>
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                                        {badge.icon}
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Code */}
                                <p className="font-mono font-bold text-sm tracking-widest text-surface-700 dark:text-surface-300 mb-3">
                                    {card.code}
                                </p>

                                {/* Balance progress */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-surface-500 dark:text-surface-400">Solde</span>
                                        <span className="font-bold text-surface-900 dark:text-white">
                                            {formatCFA(card.current_balance)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-500 rounded-full transition-all"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-surface-400 mt-1">
                                        sur {formatCFA(card.initial_balance)} initial
                                    </p>
                                </div>

                                {/* Meta */}
                                <div className="space-y-1 text-xs text-surface-500 dark:text-surface-400">
                                    {card.issued_to && (
                                        <p className="flex items-center gap-1.5 truncate">
                                            <User size={11} className="shrink-0" />
                                            {card.issued_to}
                                        </p>
                                    )}
                                    {card.expires_at && (
                                        <p className="flex items-center gap-1.5">
                                            <Calendar size={11} className="shrink-0" />
                                            Expire le {formatDate(card.expires_at)}
                                        </p>
                                    )}
                                </div>

                                {/* Arrow */}
                                <div className="flex justify-end mt-3">
                                    <ChevronRight
                                        size={16}
                                        className="text-surface-300 dark:text-surface-600 group-hover:text-brand-500 transition-colors"
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
