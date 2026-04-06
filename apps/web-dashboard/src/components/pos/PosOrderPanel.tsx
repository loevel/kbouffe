"use client";

/**
 * PosOrderPanel — Full-screen POS order-taking overlay
 *
 * Combines MenuBrowserPanel + ServerCartPanel in a split layout.
 * Wraps everything in ServerCartProvider (no external provider needed).
 *
 * Desktop layout: Menu (60%) | Cart (40%) side by side
 * Mobile layout:  Tab switcher between Menu and Panier
 *
 * Usage:
 *   <PosOrderPanel
 *     tableNumber="3"
 *     tableId="uuid-..."
 *     isOpen={true}
 *     onClose={() => setOpen(false)}
 *   />
 *
 *   // Editing an existing draft:
 *   <PosOrderPanel
 *     tableNumber="3"
 *     tableId="uuid-..."
 *     isOpen={true}
 *     onClose={() => setOpen(false)}
 *     existingDraft={{
 *       orderId: "order-uuid",
 *       draftLabel: "Table 3 — midi",
 *       items: [...],
 *       covers: 2,
 *       notes: "Sans piment",
 *     }}
 *   />
 */

import { useCallback, useEffect, useState } from "react";
import { ChefHat, ShoppingCart, X } from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { ServerCartProvider, useServerCart } from "@/contexts/ServerCartContext";
import { usePosOperator } from "@/contexts/PosOperatorContext";
import { MenuBrowserPanel } from "./MenuBrowserPanel";
import { ServerCartPanel } from "./ServerCartPanel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExistingDraftItem {
    id: string;
    name: string;
    unit_price?: number;
    price?: number;
    quantity: number;
    notes?: string;
}

interface ExistingDraft {
    orderId: string;
    draftLabel: string;
    items: ExistingDraftItem[];
    covers?: number | null;
    notes?: string | null;
}

export interface PosOrderPanelProps {
    tableNumber: string;
    tableId?: string;
    isOpen: boolean;
    onClose: () => void;
    existingDraft?: ExistingDraft | null;
}

// ── Inner component ───────────────────────────────────────────────────────────
// Needs to be inside ServerCartProvider to access useServerCart.

interface InnerProps {
    tableNumber: string;
    tableId?: string;
    onClose: () => void;
    existingDraft?: ExistingDraft | null;
}

function PosOrderPanelInner({ tableNumber, tableId, onClose, existingDraft }: InnerProps) {
    const { state, dispatch, totalItems, addItem } = useServerCart();
    const { operator } = usePosOperator();

    const [isSubmitting, setIsSubmitting] = useState(false);
    /** Mobile tab: "menu" | "cart" */
    const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu");

    const brandColor = "var(--brand-primary, #f97316)";

    // ── Initialize cart state on mount ────────────────────────────────────────

    useEffect(() => {
        // Always set the table
        dispatch({ type: "SET_TABLE", payload: { tableNumber, tableId } });

        if (existingDraft) {
            // Load existing draft into cart
            dispatch({
                type: "LOAD_DRAFT",
                payload: {
                    orderId: existingDraft.orderId,
                    draftLabel: existingDraft.draftLabel,
                    items: existingDraft.items.map((i) => ({
                        cartKey: i.id,
                        productId: i.id,
                        name: i.name,
                        price: i.unit_price ?? i.price ?? 0,
                        quantity: i.quantity,
                        notes: i.notes,
                    })),
                    covers: existingDraft.covers ?? null,
                    notes: existingDraft.notes ?? "",
                },
            });
        } else {
            // Fresh order — auto-generate label
            dispatch({
                type: "SET_DRAFT_LABEL",
                payload: `Table ${tableNumber}`,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableNumber, tableId, existingDraft]);

    // ── apiItems helper ───────────────────────────────────────────────────────

    const getApiItems = useCallback(
        () =>
            state.items.map((item) => ({
                id: item.productId,
                name: item.name,
                unit_price: item.price,
                quantity: item.quantity,
                notes: item.notes,
                ...(item.selectedOptions && Object.keys(item.selectedOptions).length > 0
                    ? {
                          options: Object.entries(item.selectedOptions).map(
                              ([name, value]) => ({ name, value }),
                          ),
                      }
                    : {}),
            })),
        [state.items],
    );

    // ── Park handler (save as draft) ──────────────────────────────────────────

    const handlePark = useCallback(async () => {
        setIsSubmitting(true);
        try {
            const apiItems = getApiItems();
            const isUpdate = !!state.draftOrderId;

            const url = isUpdate
                ? `/api/orders/${state.draftOrderId}/items`
                : "/api/orders/draft";

            const body = isUpdate
                ? {
                      items: apiItems,
                      covers: state.covers,
                      notes: state.globalNotes,
                      draftLabel: state.draftLabel,
                  }
                : {
                      draftLabel: state.draftLabel || `Table ${tableNumber}`,
                      items: apiItems,
                      tableNumber: state.tableNumber,
                      tableId: state.tableId,
                      covers: state.covers,
                      notes: state.globalNotes,
                      operatorMemberId: operator?.memberId,
                  };

            const res = await authFetch(url, {
                method: isUpdate ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                throw new Error(data.error ?? "Erreur inconnue");
            }

            toast.success("Commande garée ✓");
            dispatch({ type: "CLEAR_CART" });
            onClose();
        } catch {
            toast.error("Erreur lors de la mise en attente");
        } finally {
            setIsSubmitting(false);
        }
    }, [state, operator, tableNumber, getApiItems, dispatch, onClose]);

    // ── Submit to kitchen handler ─────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        try {
            const apiItems = getApiItems();

            if (state.draftOrderId) {
                // Update items on existing draft first
                const updateRes = await authFetch(
                    `/api/orders/${state.draftOrderId}/items`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            items: apiItems,
                            covers: state.covers,
                        }),
                    },
                );

                if (!updateRes.ok) {
                    const data = (await updateRes.json()) as { error?: string };
                    throw new Error(data.error ?? "Erreur mise à jour des articles");
                }

                // Then recall draft → pending
                const recallRes = await authFetch(
                    `/api/orders/${state.draftOrderId}/recall`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paymentMethod: "cash" }),
                    },
                );

                if (!recallRes.ok) {
                    const data = (await recallRes.json()) as { error?: string };
                    throw new Error(data.error ?? "Erreur lors du rappel");
                }
            } else {
                // Create directly as pending order
                const res = await authFetch("/api/orders/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: apiItems,
                        tableNumber: state.tableNumber,
                        tableId: state.tableId,
                        covers: state.covers,
                        notes: state.globalNotes,
                        operatorMemberId: operator?.memberId,
                        paymentMethod: "cash",
                        isDraft: false,
                    }),
                });

                if (!res.ok) {
                    const data = (await res.json()) as { error?: string };
                    throw new Error(data.error ?? "Erreur création commande");
                }
            }

            toast.success("Commande envoyée en cuisine ✓");
            dispatch({ type: "CLEAR_CART" });
            onClose();
        } catch {
            toast.error("Erreur lors de l'envoi en cuisine");
        } finally {
            setIsSubmitting(false);
        }
    }, [state, operator, getApiItems, dispatch, onClose]);

    // ── Derived ───────────────────────────────────────────────────────────────

    const panelTitle = existingDraft?.draftLabel
        ? existingDraft.draftLabel
        : `Table ${tableNumber} — Nouvelle commande`;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-surface-950"
            role="dialog"
            aria-modal="true"
            aria-label={panelTitle}
        >
            {/* ── Top bar ── */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Close */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer le panneau de commande"
                        className="p-1.5 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
                    >
                        <X size={18} aria-hidden />
                    </button>

                    {/* Title */}
                    <div className="flex items-center gap-2 min-w-0">
                        <ChefHat
                            size={16}
                            aria-hidden
                            style={{ color: brandColor, flexShrink: 0 }}
                        />
                        <h1 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                            {panelTitle}
                        </h1>
                    </div>
                </div>

                {/* Mobile: cart count badge — taps to cart tab */}
                <button
                    type="button"
                    onClick={() => setActiveTab("cart")}
                    aria-label={`Voir le panier — ${totalItems} article${totalItems !== 1 ? "s" : ""}`}
                    className="flex items-center gap-1.5 md:hidden px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors shrink-0"
                >
                    <ShoppingCart size={15} aria-hidden />
                    <span>Panier</span>
                    {totalItems > 0 && (
                        <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold"
                            style={{ backgroundColor: brandColor }}
                            aria-hidden
                        >
                            {totalItems}
                        </span>
                    )}
                </button>
            </header>

            {/* ── Mobile tab bar ── */}
            <nav
                className="flex md:hidden border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shrink-0"
                role="tablist"
                aria-label="Navigation POS"
            >
                <button
                    role="tab"
                    aria-selected={activeTab === "menu"}
                    aria-controls="pos-panel-menu"
                    onClick={() => setActiveTab("menu")}
                    className={[
                        "flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2",
                        activeTab === "menu"
                            ? "text-surface-900 dark:text-white"
                            : "border-transparent text-surface-500 dark:text-surface-400",
                    ].join(" ")}
                    style={
                        activeTab === "menu"
                            ? { borderBottomColor: brandColor }
                            : undefined
                    }
                >
                    Menu
                </button>

                <button
                    role="tab"
                    aria-selected={activeTab === "cart"}
                    aria-controls="pos-panel-cart"
                    onClick={() => setActiveTab("cart")}
                    className={[
                        "flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 relative",
                        activeTab === "cart"
                            ? "text-surface-900 dark:text-white"
                            : "border-transparent text-surface-500 dark:text-surface-400",
                    ].join(" ")}
                    style={
                        activeTab === "cart"
                            ? { borderBottomColor: brandColor }
                            : undefined
                    }
                >
                    Panier
                    {totalItems > 0 && (
                        <span
                            className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold"
                            style={{ backgroundColor: brandColor }}
                            aria-hidden
                        >
                            {totalItems}
                        </span>
                    )}
                </button>
            </nav>

            {/* ── Body: desktop side-by-side / mobile tabs ── */}
            <div className="flex-1 overflow-hidden flex">
                {/* ── Menu panel ── */}
                <div
                    id="pos-panel-menu"
                    role="tabpanel"
                    aria-label="Menu"
                    className={[
                        // Always visible on desktop
                        "md:flex md:w-[60%] overflow-hidden",
                        // Mobile: show only on "menu" tab
                        activeTab === "menu" ? "flex flex-1" : "hidden",
                    ].join(" ")}
                >
                    <MenuBrowserPanel
                        onAddProduct={(product) => {
                            addItem({
                                cartKey: product.cartKey,
                                productId: product.productId,
                                name: product.name,
                                price: product.price,
                                selectedOptions: product.selectedOptions,
                            });
                        }}
                        cartItems={state.items}
                        className="h-full w-full"
                    />
                </div>

                {/* ── Vertical divider (desktop only) ── */}
                <div
                    className="hidden md:block w-px bg-surface-200 dark:bg-surface-700 shrink-0"
                    aria-hidden
                />

                {/* ── Cart panel ── */}
                <div
                    id="pos-panel-cart"
                    role="tabpanel"
                    aria-label="Panier"
                    className={[
                        // Always visible on desktop
                        "md:flex md:w-[40%] overflow-hidden",
                        // Mobile: show only on "cart" tab
                        activeTab === "cart" ? "flex flex-1" : "hidden",
                    ].join(" ")}
                >
                    <ServerCartPanel
                        onPark={handlePark}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        tableNumber={tableNumber}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Public export — wraps with ServerCartProvider ─────────────────────────────

export function PosOrderPanel({
    isOpen,
    tableNumber,
    tableId,
    onClose,
    existingDraft,
}: PosOrderPanelProps) {
    // Return null early — no portal, no animation, keep simple
    if (!isOpen) return null;

    return (
        <ServerCartProvider>
            <PosOrderPanelInner
                tableNumber={tableNumber}
                tableId={tableId}
                onClose={onClose}
                existingDraft={existingDraft}
            />
        </ServerCartProvider>
    );
}
