import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '@kbouffe/shared-types';

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    selectedOptions: Record<string, string>;
    unitPrice: number;
    restaurantId: string;
    restaurantName: string;
}

interface CartState {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
    // Actions
    addItem: (
        product: Product,
        quantity: number,
        selectedOptions: Record<string, string>,
        restaurantId: string,
        restaurantName: string,
    ) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    // Derived (computed inline — no selector overhead)
    itemCount: () => number;
    subtotal: () => number;
    total: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            restaurantId: null,
            restaurantName: null,

            addItem: (product, quantity, selectedOptions, restaurantId, restaurantName) => {
                set((state) => {
                    // Clear cart if switching restaurant
                    const baseItems = state.restaurantId && state.restaurantId !== restaurantId ? [] : state.items;

                    let extraPrice = 0;
                    if (product.options) {
                        product.options.forEach((opt) => {
                            const selectedChoice = selectedOptions[opt.name];
                            if (selectedChoice) {
                                const choice = opt.choices.find((c) => c.label === selectedChoice);
                                if (choice) extraPrice += choice.extraPrice;
                            }
                        });
                    }

                    const unitPrice = product.price + extraPrice;
                    const itemId = `${product.id}-${JSON.stringify(selectedOptions)}`;
                    const existing = baseItems.find((i) => i.id === itemId);

                    const updatedItems = existing
                        ? baseItems.map((i) =>
                              i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i,
                          )
                        : [
                              ...baseItems,
                              { id: itemId, product, quantity, selectedOptions, unitPrice, restaurantId, restaurantName },
                          ];

                    return { items: updatedItems, restaurantId, restaurantName };
                });
            },

            removeItem: (itemId) => {
                set((state) => {
                    const updated = state.items.filter((i) => i.id !== itemId);
                    return {
                        items: updated,
                        restaurantId: updated.length === 0 ? null : state.restaurantId,
                        restaurantName: updated.length === 0 ? null : state.restaurantName,
                    };
                });
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }
                set((state) => ({
                    items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
                }));
            },

            clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

            itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
            total: () => get().subtotal(),
        }),
        {
            name: '@kbouffe/cart',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist data fields, not functions
            partialize: (state) => ({
                items: state.items,
                restaurantId: state.restaurantId,
                restaurantName: state.restaurantName,
            }),
        },
    ),
);
