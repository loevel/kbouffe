"use client";

/**
 * ServerCartPanel — POS in-progress order panel
 *
 * Displays cart items with quantity controls, per-item notes,
 * a covers counter, global notes, running total, and Park / Submit buttons.
 *
 * Must be rendered inside <ServerCartProvider>.
 *
 * Usage:
 *   <ServerCartPanel
 *     onPark={handlePark}
 *     onSubmit={handleSubmit}
 *     isSubmitting={isSubmitting}
 *     tableNumber="3"
 *   />
 */

import { useState } from "react";
import {
    FileEdit,
    Minus,
    ParkingSquare,
    Plus,
    Send,
    ShoppingCart,
    Trash2,
} from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useServerCart } from "@/contexts/ServerCartContext";
import { usePosOperator } from "@/contexts/PosOperatorContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
    owner: "Propriétaire",
    manager: "Gérant",
    cashier: "Caissier",
    cook: "Cuisinier",
    viewer: "Observateur",
    driver: "Livreur",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ServerCartPanelProps {
    /** Park current cart as a draft order */
    onPark: () => void;
    /** Submit cart as a pending (kitchen) order */
    onSubmit: () => void;
    isSubmitting: boolean;
    tableNumber?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServerCartPanel({
    onPark,
    onSubmit,
    isSubmitting,
    tableNumber,
}: ServerCartPanelProps) {
    const { state, dispatch, totalItems, totalPrice } = useServerCart();
    const { operator } = usePosOperator();

    /** Set of productIds whose inline note input is currently expanded */
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

    const roleLabel = operator
        ? (ROLE_LABELS[operator.role] ?? operator.role)
        : null;

    const isEmpty = state.items.length === 0;
    const isActionsDisabled = isEmpty || isSubmitting;

    const brandColor = "var(--brand-primary, #f97316)";

    function toggleNoteExpanded(productId: string) {
        setExpandedNotes((prev) => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            className="flex flex-col h-full bg-surface-50 dark:bg-surface-950"
            aria-label="Panier de commande"
        >
            {/* ── Header ── */}
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shrink-0">
                <div className="flex items-center gap-2">
                    <ShoppingCart
                        size={16}
                        className="text-surface-500 dark:text-surface-400 shrink-0"
                        aria-hidden
                    />
                    <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                        Commande
                        {tableNumber && (
                            <span className="font-normal text-surface-500 dark:text-surface-400 ml-1">
                                · Table {tableNumber}
                            </span>
                        )}
                    </h2>
                </div>
                {operator && (
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                        Opérateur : {operator.name}
                        {roleLabel && ` (${roleLabel})`}
                    </p>
                )}
            </div>

            {/* ── Item list ── */}
            <div className="flex-1 overflow-y-auto">
                {isEmpty ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full min-h-[12rem] px-4 text-center">
                        <ShoppingCart
                            size={36}
                            className="text-surface-200 dark:text-surface-700 mb-3"
                            aria-hidden
                        />
                        <p className="text-sm font-medium text-surface-400 dark:text-surface-500">
                            Panier vide
                        </p>
                        <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">
                            Sélectionnez des articles dans le menu
                        </p>
                    </div>
                ) : (
                    <ul
                        aria-label="Articles dans le panier"
                        className="divide-y divide-surface-100 dark:divide-surface-800"
                    >
                        {state.items.map((item) => {
                            const noteExpanded = expandedNotes.has(item.productId);

                            return (
                                <li key={item.productId} className="px-4 py-3 space-y-2">
                                    {/* Item name + line total + delete */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                                {formatCFA(item.price)} ×{" "}
                                                {item.quantity}
                                                {" = "}
                                                <span className="font-semibold text-surface-700 dark:text-surface-300">
                                                    {formatCFA(item.price * item.quantity)}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Delete item */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                dispatch({
                                                    type: "REMOVE_ITEM",
                                                    payload: { productId: item.productId },
                                                })
                                            }
                                            aria-label={`Supprimer ${item.name} du panier`}
                                            className="p-1 rounded-lg text-surface-300 dark:text-surface-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                                        >
                                            <Trash2 size={14} aria-hidden />
                                        </button>
                                    </div>

                                    {/* Qty controls + note toggle */}
                                    <div className="flex items-center justify-between gap-2">
                                        {/* − qty + */}
                                        <div
                                            role="group"
                                            aria-label={`Quantité de ${item.name}`}
                                            className="flex items-center rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    dispatch({
                                                        type: "UPDATE_QTY",
                                                        payload: {
                                                            productId: item.productId,
                                                            quantity: item.quantity - 1,
                                                        },
                                                    })
                                                }
                                                aria-label="Diminuer la quantité"
                                                className="px-2.5 py-1.5 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                            >
                                                <Minus size={12} aria-hidden />
                                            </button>

                                            <span
                                                aria-live="polite"
                                                className="min-w-[2rem] text-center text-sm font-semibold text-surface-900 dark:text-white select-none"
                                            >
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    dispatch({
                                                        type: "UPDATE_QTY",
                                                        payload: {
                                                            productId: item.productId,
                                                            quantity: item.quantity + 1,
                                                        },
                                                    })
                                                }
                                                aria-label="Augmenter la quantité"
                                                className="px-2.5 py-1.5 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                            >
                                                <Plus size={12} aria-hidden />
                                            </button>
                                        </div>

                                        {/* Inline note toggle */}
                                        <button
                                            type="button"
                                            onClick={() => toggleNoteExpanded(item.productId)}
                                            aria-expanded={noteExpanded}
                                            aria-label={`${noteExpanded ? "Masquer" : "Ajouter"} une note pour ${item.name}`}
                                            className={[
                                                "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                                                noteExpanded || item.notes
                                                    ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                                                    : "text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800",
                                            ].join(" ")}
                                        >
                                            <FileEdit size={11} aria-hidden />
                                            <span>Note</span>
                                        </button>
                                    </div>

                                    {/* Expandable per-item note */}
                                    {noteExpanded && (
                                        <input
                                            type="text"
                                            placeholder="Note pour cet article..."
                                            value={item.notes ?? ""}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: "UPDATE_ITEM_NOTES",
                                                    payload: {
                                                        productId: item.productId,
                                                        notes: e.target.value,
                                                    },
                                                })
                                            }
                                            aria-label={`Note pour ${item.name}`}
                                            // eslint-disable-next-line jsx-a11y/no-autofocus
                                            autoFocus
                                            className="w-full text-xs px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/10 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:focus:ring-amber-600 transition-colors"
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 pt-3 pb-4 space-y-3">
                {/* Covers counter */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                        Couverts
                    </span>
                    <div
                        role="group"
                        aria-label="Nombre de couverts"
                        className="flex items-center gap-1.5"
                    >
                        <button
                            type="button"
                            onClick={() =>
                                dispatch({
                                    type: "SET_COVERS",
                                    payload:
                                        state.covers !== null && state.covers > 1
                                            ? state.covers - 1
                                            : null,
                                })
                            }
                            aria-label="Réduire le nombre de couverts"
                            className="w-6 h-6 rounded-md border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        >
                            <Minus size={10} aria-hidden />
                        </button>

                        <span
                            aria-live="polite"
                            className="min-w-[2.5rem] text-center text-sm font-semibold text-surface-900 dark:text-white"
                        >
                            {state.covers ?? "—"}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                dispatch({
                                    type: "SET_COVERS",
                                    payload: (state.covers ?? 0) + 1,
                                })
                            }
                            aria-label="Augmenter le nombre de couverts"
                            className="w-6 h-6 rounded-md border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        >
                            <Plus size={10} aria-hidden />
                        </button>
                    </div>
                </div>

                {/* Global notes */}
                <textarea
                    placeholder="Notes globales pour la commande..."
                    value={state.globalNotes}
                    onChange={(e) =>
                        dispatch({ type: "SET_GLOBAL_NOTES", payload: e.target.value })
                    }
                    rows={2}
                    aria-label="Notes globales pour la commande"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 dark:focus:border-brand-500 transition-colors resize-none"
                />

                {/* Totals */}
                <div
                    aria-label="Récapitulatif des montants"
                    className="space-y-1 pt-1 border-t border-surface-100 dark:border-surface-800"
                >
                    <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400 mt-2">
                        <span>
                            Sous-total ({totalItems} article{totalItems !== 1 ? "s" : ""})
                        </span>
                        <span>{formatCFA(totalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-surface-900 dark:text-white">
                            Total
                        </span>
                        <span className="text-base font-extrabold text-surface-900 dark:text-white">
                            {formatCFA(totalPrice)}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                    {/* Park (garer) */}
                    <button
                        type="button"
                        onClick={onPark}
                        disabled={isActionsDisabled}
                        aria-label="Garer la commande comme brouillon"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ParkingSquare size={14} aria-hidden />
                        Garer
                    </button>

                    {/* Submit to kitchen */}
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isActionsDisabled}
                        aria-label="Envoyer la commande en cuisine"
                        className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                        style={
                            isActionsDisabled
                                ? { backgroundColor: "#9ca3af" }
                                : { backgroundColor: brandColor }
                        }
                    >
                        {isSubmitting ? (
                            <span
                                aria-label="Envoi en cours..."
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                            />
                        ) : (
                            <>
                                <Send size={14} aria-hidden />
                                Envoyer cuisine
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
