"use client";

import {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SelectedOption {
    name: string;
    choice: string;
    extra_price: number;
}

export interface CartItem {
    id: string;
    /** Unique key: productId for simple items, productId|JSON(opts) for items with options */
    cartKey: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
    selectedOptions?: SelectedOption[];
    notes?: string;
}

interface CartRestaurant {
    id: string;
    name: string;
    slug: string;
    /**
     * Tarif de livraison du restaurant (FCFA). Absent des paniers enregistrés
     * avant son introduction : le forfait sert alors de repli, et le serveur
     * tranche de toute façon à la création de la commande.
     */
    deliveryFee?: number | null;
}

interface CartState {
    restaurant: CartRestaurant | null;
    items: CartItem[];
}

type CartAction =
    | { type: "ADD_ITEM"; restaurant: CartRestaurant; item: CartItem }
    | { type: "REMOVE_ITEM"; cartKey: string }
    | { type: "UPDATE_QTY"; cartKey: string; qty: number }
    | { type: "CLEAR" }
    | { type: "HYDRATE"; state: CartState };

interface CartContextValue {
    restaurant: CartRestaurant | null;
    items: CartItem[];
    /** false tant que le panier localStorage n'a pas été relu (évite le flash "panier vide"). */
    hydrated: boolean;
    itemCount: number;
    subtotal: number;
    addItem: (restaurant: CartRestaurant, item: Omit<CartItem, "quantity">) => void;
    removeItem: (cartKey: string) => void;
    updateQty: (cartKey: string, qty: number) => void;
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
            const existing = baseItems.find((i) => i.cartKey === action.item.cartKey);
            const items = existing
                ? baseItems.map((i) =>
                      i.cartKey === action.item.cartKey ? { ...i, quantity: i.quantity + 1 } : i,
                  )
                : [...baseItems, { ...action.item, quantity: 1 }];
            return { restaurant: action.restaurant, items };
        }
        case "REMOVE_ITEM": {
            const items = state.items.filter((i) => i.cartKey !== action.cartKey);
            return { ...state, items, restaurant: items.length === 0 ? null : state.restaurant };
        }
        case "UPDATE_QTY": {
            if (action.qty <= 0) {
                const items = state.items.filter((i) => i.cartKey !== action.cartKey);
                return { ...state, items, restaurant: items.length === 0 ? null : state.restaurant };
            }
            return {
                ...state,
                items: state.items.map((i) =>
                    i.cartKey === action.cartKey ? { ...i, quantity: action.qty } : i,
                ),
            };
        }
        case "CLEAR":
            return EMPTY;
        case "HYDRATE":
            // Backfill cartKey for items persisted before the cartKey field was added
            return {
                ...action.state,
                items: action.state.items.map((i) => ({
                    ...i,
                    cartKey: i.cartKey ?? i.id,
                })),
            };
        default:
            return state;
    }
}

// ── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "kbouffe_web_cart";

export function CartProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, EMPTY);
    const [hydrated, setHydrated] = useState(false);

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
        finally {
            setHydrated(true);
        }
    }, []);

    // Persist to localStorage — jamais avant l'hydratation, sinon le premier
    // rendu (panier vide) écrase le panier réellement stocké.
    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {}
    }, [state, hydrated]);

    const addItem = useCallback(
        (restaurant: CartRestaurant, item: Omit<CartItem, "quantity">) => {
            dispatch({ type: "ADD_ITEM", restaurant, item: { ...item, quantity: 1 } });
        },
        [],
    );

    const removeItem = useCallback((cartKey: string) => {
        dispatch({ type: "REMOVE_ITEM", cartKey });
    }, []);

    const updateQty = useCallback((cartKey: string, qty: number) => {
        dispatch({ type: "UPDATE_QTY", cartKey, qty });
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
            hydrated,
            itemCount,
            subtotal,
            addItem,
            removeItem,
            updateQty,
            clear,
        }),
        [state, hydrated, itemCount, subtotal, addItem, removeItem, updateQty, clear],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}
