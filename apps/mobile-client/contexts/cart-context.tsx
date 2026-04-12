/**
 * cart-context — shim over the Zustand cart store.
 *
 * All consumers (useCart / CartProvider) keep working unchanged.
 * State now lives in stores/cart-store.ts (persisted via AsyncStorage).
 */
import type { ReactNode } from 'react';
import { useCartStore, type CartItem } from '@/stores/cart-store';

export type { CartItem };

/** No-op provider kept for backwards compatibility. */
export function CartProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

/** Drop-in replacement — same shape as the old context value. */
export function useCart() {
    const store = useCartStore();
    return {
        items:          store.items,
        restaurantId:   store.restaurantId,
        restaurantName: store.restaurantName,
        addItem:        store.addItem,
        removeItem:     store.removeItem,
        updateQuantity: store.updateQuantity,
        clearCart:      store.clearCart,
        itemCount:      store.itemCount(),
        subtotal:       store.subtotal(),
        deliveryFee:    0, // actual fee comes from the restaurant, set in checkout
        total:          store.total(),
    };
}
