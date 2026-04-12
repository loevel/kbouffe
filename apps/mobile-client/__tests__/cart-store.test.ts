/**
 * Unit tests — cart Zustand store
 */
import { act } from 'react-test-renderer';

// Mock AsyncStorage before importing the store
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { useCartStore } from '../stores/cart-store';
import type { CartItem } from '../stores/cart-store';

const mockProduct = {
    id: 'prod-1',
    name: 'Ndolé',
    price: 2500,
    description: 'Plat traditionnel',
    categoryId: 'cat-1',
    restaurantId: 'resto-1',
    image: null,
    isAvailable: true,
    options: [],
} as any;

const RESTO_ID = 'resto-1';
const RESTO_NAME = 'Chez Mama';

beforeEach(() => {
    // Reset Zustand store between tests
    useCartStore.setState({ items: [], restaurantId: null, restaurantName: null });
});

describe('cart store — addItem', () => {
    it('ajoute un article au panier vide', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 1, {}, RESTO_ID, RESTO_NAME);
        });
        const { items, restaurantId } = useCartStore.getState();
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(1);
        expect(items[0].unitPrice).toBe(2500);
        expect(restaurantId).toBe(RESTO_ID);
    });

    it('incrémente la quantité si le même article est ajouté', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 2, {}, RESTO_ID, RESTO_NAME);
            useCartStore.getState().addItem(mockProduct, 1, {}, RESTO_ID, RESTO_NAME);
        });
        expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it('vide le panier si on change de restaurant', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 1, {}, RESTO_ID, RESTO_NAME);
            useCartStore.getState().addItem(mockProduct, 1, {}, 'autre-resto', 'Autre resto');
        });
        const { items, restaurantId } = useCartStore.getState();
        expect(items).toHaveLength(1);
        expect(restaurantId).toBe('autre-resto');
    });
});

describe('cart store — removeItem', () => {
    it('supprime un article par id', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 1, {}, RESTO_ID, RESTO_NAME);
        });
        const itemId = useCartStore.getState().items[0].id;
        act(() => {
            useCartStore.getState().removeItem(itemId);
        });
        expect(useCartStore.getState().items).toHaveLength(0);
        expect(useCartStore.getState().restaurantId).toBeNull();
    });
});

describe('cart store — updateQuantity', () => {
    it('met à jour la quantité', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 1, {}, RESTO_ID, RESTO_NAME);
        });
        const itemId = useCartStore.getState().items[0].id;
        act(() => {
            useCartStore.getState().updateQuantity(itemId, 5);
        });
        expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('supprime l\'article si quantité <= 0', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 1, {}, RESTO_ID, RESTO_NAME);
        });
        const itemId = useCartStore.getState().items[0].id;
        act(() => {
            useCartStore.getState().updateQuantity(itemId, 0);
        });
        expect(useCartStore.getState().items).toHaveLength(0);
    });
});

describe('cart store — clearCart', () => {
    it('vide entièrement le panier', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 3, {}, RESTO_ID, RESTO_NAME);
            useCartStore.getState().clearCart();
        });
        const { items, restaurantId, restaurantName } = useCartStore.getState();
        expect(items).toHaveLength(0);
        expect(restaurantId).toBeNull();
        expect(restaurantName).toBeNull();
    });
});

describe('cart store — calculs dérivés', () => {
    it('calcule correctement le sous-total', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 2, {}, RESTO_ID, RESTO_NAME);
        });
        expect(useCartStore.getState().subtotal()).toBe(5000); // 2500 × 2
    });

    it('calcule correctement itemCount', () => {
        act(() => {
            useCartStore.getState().addItem(mockProduct, 3, {}, RESTO_ID, RESTO_NAME);
        });
        expect(useCartStore.getState().itemCount()).toBe(3);
    });
});
