import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductOption } from '@kbouffe/shared-types';

const CART_STORAGE_KEY = '@kbouffe/cart';

/** Shape written to / read from AsyncStorage. */
interface PersistedCart {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
}

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    selectedOptions: Record<string, string>;
    unitPrice: number;
    restaurantId: string;
    restaurantName: string;
}

interface CartContextType {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
    addItem: (product: Product, quantity: number, selectedOptions: Record<string, string>, restaurantId: string, restaurantName: string) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState<string | null>(null);

    /**
     * Guards the save-effect from firing before the initial AsyncStorage
     * read has completed. Using a ref (not state) so toggling it does NOT
     * trigger an extra render or re-run the save-effect prematurely.
     */
    const isHydrated = useRef(false);

    // ─── Load cart from AsyncStorage on mount ──────────────────────────────
    useEffect(() => {
        const loadCart = async () => {
            try {
                const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
                if (raw) {
                    const persisted: PersistedCart = JSON.parse(raw);
                    // Only restore when there are actual items to avoid a
                    // redundant save-cycle after a previous clearCart.
                    if (Array.isArray(persisted.items) && persisted.items.length > 0) {
                        setItems(persisted.items);
                        setRestaurantId(persisted.restaurantId ?? null);
                        setRestaurantName(persisted.restaurantName ?? null);
                    }
                }
            } catch (error) {
                console.warn('[CartProvider] Erreur lors du chargement du panier :', error);
            } finally {
                // Mark hydration complete — must happen AFTER the setXxx calls
                // so the save-effect (triggered by the resulting re-render) sees
                // isHydrated.current === true and doesn't skip the first save.
                isHydrated.current = true;
            }
        };

        loadCart();
    }, []); // runs once on mount

    // ─── Persist cart to AsyncStorage on every change (debounced) ──────────────
    const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Skip the initial render(s) that happen before the load effect has
        // finished reading from AsyncStorage.
        if (!isHydrated.current) return;

        // Clear previous timeout to avoid multiple writes
        if (persistTimeoutRef.current) {
            clearTimeout(persistTimeoutRef.current);
        }

        // Debounce: wait 500ms before writing to AsyncStorage
        persistTimeoutRef.current = setTimeout(async () => {
            try {
                if (items.length === 0) {
                    // Empty cart → remove the key entirely (covers clearCart
                    // and the case where the last item was removed).
                    await AsyncStorage.removeItem(CART_STORAGE_KEY);
                } else {
                    const payload: PersistedCart = { items, restaurantId, restaurantName };
                    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
                }
            } catch (error) {
                console.warn('[CartProvider] Erreur lors de la persistance du panier :', error);
            }
        }, 500);

        return () => {
            if (persistTimeoutRef.current) {
                clearTimeout(persistTimeoutRef.current);
            }
        };
    }, [items, restaurantId, restaurantName]);

    const addItem = useCallback((product: Product, quantity: number, selectedOptions: Record<string, string>, restId: string, restName: string) => {
        // If cart has items from different restaurant, clear first
        if (restaurantId && restaurantId !== restId) {
            setItems([]);
        }
        setRestaurantId(restId);
        setRestaurantName(restName);

        // Calculate extra price from options
        let extraPrice = 0;
        if (product.options) {
            product.options.forEach(opt => {
                const selectedChoice = selectedOptions[opt.name];
                if (selectedChoice) {
                    const choice = opt.choices.find(c => c.label === selectedChoice);
                    if (choice) extraPrice += choice.extraPrice;
                }
            });
        }

        const unitPrice = product.price + extraPrice;
        const itemId = `${product.id}-${JSON.stringify(selectedOptions)}`;

        setItems(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (existing) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { id: itemId, product, quantity, selectedOptions, unitPrice, restaurantId: restId, restaurantName: restName }];
        });
    }, [restaurantId]);

    const removeItem = useCallback((itemId: string) => {
        setItems(prev => {
            const updated = prev.filter(i => i.id !== itemId);
            if (updated.length === 0) {
                setRestaurantId(null);
                setRestaurantName(null);
            }
            return updated;
        });
    }, []);

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(itemId);
            return;
        }
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    }, [removeItem]);

    const clearCart = useCallback(() => {
        setItems([]);
        setRestaurantId(null);
        setRestaurantName(null);
    }, []);

    const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
    const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items]);
    const deliveryFee = restaurantId ? 1000 : 0; // Default fee
    const total = subtotal + deliveryFee;

    const value = useMemo(() => ({
        items, restaurantId, restaurantName, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, deliveryFee, total,
    }), [items, restaurantId, restaurantName, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, deliveryFee, total]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
}
