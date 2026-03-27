"use client";

import {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
}

interface CartRestaurant {
    id: string;
    name: string;
    slug: string;
}

interface CartState {
    restaurant: CartRestaurant | null;
    items: CartItem[];
}

type CartAction =
    | { type: "ADD_ITEM"; restaurant: CartRestaurant; item: CartItem }
    | { type: "REMOVE_ITEM"; itemId: string }
    | { type: "UPDATE_QTY"; itemId: string; qty: number }
    | { type: "CLEAR" }
    | { type: "HYDRATE"; state: CartState };

interface CartContextValue {
    restaurant: CartRestaurant | null;
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    addItem: (restaurant: CartRestaurant, item: Omit<CartItem, "quantity">) => void;
    removeItem: (itemId: string) => void;
    updateQty: (itemId: string, qty: number) => void;
    clear: () => void;
}

// ── Reducer ──────────────────────────────────────────────────────────────────

const EMPTY: CartState = { restaurant: null, items: [] };

function reducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "ADD_ITEM": {
            // If new restaurant → clear previous cart
            const sameRestaurant = state.restaurant?.id === action.restaurant.id;
            const baseItems = sameRestaurant ? state.items : [];
            const existing = baseItems.find((i) => i.id === action.item.id);
            const items = existing
                ? baseItems.map((i) =>
                      i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i,
                  )
                : [...baseItems, { ...action.item, quantity: 1 }];
            return { restaurant: action.restaurant, items };
        }
        case "REMOVE_ITEM": {
            const items = state.items.filter((i) => i.id !== action.itemId);
            return { ...state, items, restaurant: items.length === 0 ? null : state.restaurant };
        }
        case "UPDATE_QTY": {
            if (action.qty <= 0) {
                const items = state.items.filter((i) => i.id !== action.itemId);
                return { ...state, items, restaurant: items.length === 0 ? null : state.restaurant };
            }
            return {
                ...state,
                items: state.items.map((i) =>
                    i.id === action.itemId ? { ...i, quantity: action.qty } : i,
                ),
            };
        }
        case "CLEAR":
            return EMPTY;
        case "HYDRATE":
            return action.state;
        default:
            return state;
    }
}

// ── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "kbouffe_web_cart";

export function CartProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, EMPTY);

    // Hydrate from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: CartState = JSON.parse(raw);
                if (parsed?.items?.length) {
                    dispatch({ type: "HYDRATE", state: parsed });
                }
            }
        } catch {}
    }, []);

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {}
    }, [state]);

    const addItem = useCallback(
        (restaurant: CartRestaurant, item: Omit<CartItem, "quantity">) => {
            dispatch({ type: "ADD_ITEM", restaurant, item: { ...item, quantity: 1 } });
        },
        [],
    );

    const removeItem = useCallback((itemId: string) => {
        dispatch({ type: "REMOVE_ITEM", itemId });
    }, []);

    const updateQty = useCallback((itemId: string, qty: number) => {
        dispatch({ type: "UPDATE_QTY", itemId, qty });
    }, []);

    const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

    const itemCount = useMemo(
        () => state.items.reduce((sum, i) => sum + i.quantity, 0),
        [state.items],
    );

    const subtotal = useMemo(
        () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [state.items],
    );

    const value = useMemo<CartContextValue>(
        () => ({
            restaurant: state.restaurant,
            items: state.items,
            itemCount,
            subtotal,
            addItem,
            removeItem,
            updateQty,
            clear,
        }),
        [state, itemCount, subtotal, addItem, removeItem, updateQty, clear],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}
