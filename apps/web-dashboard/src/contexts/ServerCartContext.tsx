"use client";

/**
 * ServerCartContext — POS server-side cart state
 *
 * useReducer + Context pattern (consistent with cart-context.tsx).
 * Manages the in-progress order a staff member builds on the POS panel.
 *
 * Usage:
 *   <ServerCartProvider>
 *     <MyPosComponent />
 *   </ServerCartProvider>
 *
 *   const { state, dispatch, totalItems, totalPrice, addItem } = useServerCart();
 */

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
    type Dispatch,
    type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
    /** Unique key for deduplication — equals productId when no options, or `${productId}|${JSON.stringify(selectedOptions)}` when options are chosen */
    cartKey: string;
    productId: string;
    name: string;
    price: number; // FCFA unit price (includes extra_price from selected options)
    quantity: number;
    notes?: string;
    /** Option selections, e.g. { "Format": "Grande (65cl)", "Température": "Bien fraîche" } */
    selectedOptions?: Record<string, string>;
}

export interface ServerCartState {
    items: CartItem[];
    tableNumber: string | null;
    tableId: string | null;
    draftLabel: string;
    covers: number | null;
    globalNotes: string;
    draftOrderId: string | null; // set when editing an existing draft
}

export type CartAction =
    | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
    | { type: "REMOVE_ITEM"; payload: { cartKey: string } }
    | { type: "UPDATE_QTY"; payload: { cartKey: string; quantity: number } }
    | { type: "UPDATE_ITEM_NOTES"; payload: { cartKey: string; notes: string } }
    | { type: "SET_TABLE"; payload: { tableNumber: string; tableId?: string } }
    | { type: "SET_COVERS"; payload: number | null }
    | { type: "SET_GLOBAL_NOTES"; payload: string }
    | { type: "SET_DRAFT_LABEL"; payload: string }
    | {
          type: "LOAD_DRAFT";
          payload: {
              orderId: string;
              items: CartItem[];
              draftLabel: string;
              covers?: number | null;
              notes?: string;
          };
      }
    | { type: "CLEAR_CART" };

interface ServerCartContextValue {
    state: ServerCartState;
    dispatch: Dispatch<CartAction>;
    /** Sum of all item quantities */
    totalItems: number;
    /** Sum of price × quantity for all items */
    totalPrice: number;
    addItem: (product: Omit<CartItem, "quantity">) => void;
    removeItem: (cartKey: string) => void;
    updateQty: (cartKey: string, quantity: number) => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE: ServerCartState = {
    items: [],
    tableNumber: null,
    tableId: null,
    draftLabel: "",
    covers: null,
    globalNotes: "",
    draftOrderId: null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: ServerCartState, action: CartAction): ServerCartState {
    switch (action.type) {
        case "ADD_ITEM": {
            const existing = state.items.find(
                (i) => i.cartKey === action.payload.cartKey,
            );
            if (existing) {
                // Increment quantity if same product+options already in cart
                return {
                    ...state,
                    items: state.items.map((i) =>
                        i.cartKey === action.payload.cartKey
                            ? { ...i, quantity: i.quantity + 1 }
                            : i,
                    ),
                };
            }
            return {
                ...state,
                items: [...state.items, { ...action.payload, quantity: 1 }],
            };
        }

        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter(
                    (i) => i.cartKey !== action.payload.cartKey,
                ),
            };

        case "UPDATE_QTY": {
            // Remove item if quantity drops to 0 or below
            if (action.payload.quantity <= 0) {
                return {
                    ...state,
                    items: state.items.filter(
                        (i) => i.cartKey !== action.payload.cartKey,
                    ),
                };
            }
            return {
                ...state,
                items: state.items.map((i) =>
                    i.cartKey === action.payload.cartKey
                        ? { ...i, quantity: action.payload.quantity }
                        : i,
                ),
            };
        }

        case "UPDATE_ITEM_NOTES":
            return {
                ...state,
                items: state.items.map((i) =>
                    i.cartKey === action.payload.cartKey
                        ? { ...i, notes: action.payload.notes }
                        : i,
                ),
            };

        case "SET_TABLE":
            return {
                ...state,
                tableNumber: action.payload.tableNumber,
                tableId: action.payload.tableId ?? state.tableId,
            };

        case "SET_COVERS":
            return { ...state, covers: action.payload };

        case "SET_GLOBAL_NOTES":
            return { ...state, globalNotes: action.payload };

        case "SET_DRAFT_LABEL":
            return { ...state, draftLabel: action.payload };

        case "LOAD_DRAFT":
            return {
                ...state,
                draftOrderId: action.payload.orderId,
                items: action.payload.items,
                draftLabel: action.payload.draftLabel,
                covers: action.payload.covers ?? null,
                globalNotes: action.payload.notes ?? "",
            };

        case "CLEAR_CART":
            return INITIAL_STATE;

        default:
            return state;
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

const ServerCartContext = createContext<ServerCartContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ServerCartProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    const totalItems = useMemo(
        () => state.items.reduce((sum, i) => sum + i.quantity, 0),
        [state.items],
    );

    const totalPrice = useMemo(
        () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [state.items],
    );

    const addItem = useCallback((product: Omit<CartItem, "quantity">) => {
        dispatch({ type: "ADD_ITEM", payload: product });
    }, []);

    const removeItem = useCallback((cartKey: string) => {
        dispatch({ type: "REMOVE_ITEM", payload: { cartKey } });
    }, []);

    const updateQty = useCallback((cartKey: string, quantity: number) => {
        dispatch({ type: "UPDATE_QTY", payload: { cartKey, quantity } });
    }, []);

    const value = useMemo<ServerCartContextValue>(
        () => ({
            state,
            dispatch,
            totalItems,
            totalPrice,
            addItem,
            removeItem,
            updateQty,
        }),
        [state, totalItems, totalPrice, addItem, removeItem, updateQty],
    );

    return (
        <ServerCartContext.Provider value={value}>
            {children}
        </ServerCartContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useServerCart(): ServerCartContextValue {
    const ctx = useContext(ServerCartContext);
    if (!ctx) {
        throw new Error("useServerCart must be used inside <ServerCartProvider>");
    }
    return ctx;
}
