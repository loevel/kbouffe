"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Clock, Trash2, ArrowUpRight, ParkingSquare } from "lucide-react";
import { Button, toast } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";
import { RecallOrderModal, type DraftOrder } from "./RecallOrderModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
    const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return `il y a ${mins} min`;
    }
    const hours = Math.floor(diff / 3600);
    return `il y a ${hours}h`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParkedOrdersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when a draft is recalled or discarded, so the parent can refresh the count */
    onCountChange?: (count: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ParkedOrdersPanel({ isOpen, onClose, onCountChange }: ParkedOrdersPanelProps) {
    const [drafts, setDrafts] = useState<DraftOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [discarding, setDiscarding] = useState<string | null>(null);
    const [selectedDraft, setSelectedDraft] = useState<DraftOrder | null>(null);
    const [showRecallModal, setShowRecallModal] = useState(false);

    // ── Fetch drafts ──────────────────────────────────────────────────────────

    const fetchDrafts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/orders/drafts");
            if (!res.ok) return;
            const data = await res.json() as { drafts: DraftOrder[] };
            const list = data.drafts ?? [];
            setDrafts(list);
            onCountChange?.(list.length);
        } catch {
            // silent — panel still shows empty state
        } finally {
            setLoading(false);
        }
    }, [onCountChange]);

    // Initial load + auto-refresh every 30 s
    useEffect(() => {
        if (!isOpen) return;
        fetchDrafts();
        const interval = setInterval(fetchDrafts, 30_000);
        return () => clearInterval(interval);
    }, [isOpen, fetchDrafts]);

    // ── Discard a draft ───────────────────────────────────────────────────────

    const handleDiscard = async (draft: DraftOrder) => {
        if (!window.confirm(`Supprimer la commande garée "${draft.draft_label ?? draft.customer_name}" ?`)) return;

        setDiscarding(draft.id);
        try {
            const res = await authFetch(`/api/orders/${draft.id}/draft`, {
                method: "DELETE",
            });

            const data = await res.json() as { success?: boolean; error?: string };
            if (!res.ok) {
                toast.error(data.error ?? "Erreur lors de la suppression");
                return;
            }

            toast.success("Commande garée supprimée");
            fetchDrafts();
        } catch {
            toast.error("Erreur réseau");
        } finally {
            setDiscarding(null);
        }
    };

    // ── Recall a draft ────────────────────────────────────────────────────────

    const handleOpenRecall = (draft: DraftOrder) => {
        setSelectedDraft(draft);
        setShowRecallModal(true);
    };

    const handleRecalled = () => {
        setShowRecallModal(false);
        setSelectedDraft(null);
        fetchDrafts();
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Slide-over panel */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white dark:bg-surface-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-700 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <ParkingSquare size={20} className="text-brand-500" />
                        <h2 className="text-base font-bold text-surface-900 dark:text-white">
                            Commandes Garées
                        </h2>
                        {drafts.length > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                {drafts.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        aria-label="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {loading && drafts.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ParkingSquare size={40} className="text-surface-300 dark:text-surface-600 mb-3" />
                            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                                Aucune commande garée
                            </p>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1 max-w-[200px]">
                                Les commandes garées apparaîtront ici pour être rappelées.
                            </p>
                        </div>
                    ) : (
                        drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-4 space-y-3"
                            >
                                {/* Draft info */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                                            {draft.draft_label ?? draft.customer_name}
                                        </p>
                                        {draft.table_number && (
                                            <p className="text-xs text-surface-500 mt-0.5">
                                                Table {draft.table_number}
                                            </p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-base font-bold text-surface-900 dark:text-white">
                                        {formatCFA(draft.total)}
                                    </span>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-3 text-xs text-surface-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {timeAgo(draft.created_at)}
                                    </span>
                                    <span>·</span>
                                    <span>
                                        {draft.items_count} article{draft.items_count !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        className="flex-1 gap-1.5"
                                        onClick={() => handleOpenRecall(draft)}
                                        leftIcon={<ArrowUpRight size={14} />}
                                    >
                                        Rappeler
                                    </Button>
                                    <button
                                        onClick={() => handleDiscard(draft)}
                                        disabled={discarding === draft.id}
                                        className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                        aria-label="Supprimer la commande garée"
                                        title="Supprimer"
                                    >
                                        {discarding === draft.id ? (
                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                {drafts.length > 0 && (
                    <div className="shrink-0 px-4 py-3 border-t border-surface-200 dark:border-surface-700">
                        <p className="text-xs text-surface-400 text-center">
                            Actualisé automatiquement toutes les 30 secondes
                        </p>
                    </div>
                )}
            </div>

            {/* Recall modal */}
            <RecallOrderModal
                order={selectedDraft}
                isOpen={showRecallModal}
                onClose={() => {
                    setShowRecallModal(false);
                    setSelectedDraft(null);
                }}
                onRecalled={handleRecalled}
            />
        </>
    );
}
