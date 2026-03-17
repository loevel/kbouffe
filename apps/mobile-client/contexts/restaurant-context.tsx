/**
 * contexts/restaurant-context.tsx
 * Caches the currently viewed restaurant's full data (products + categories)
 * so the product-modal can access product details without a second fetch.
 */
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { StoreDetail, MobileProduct, MobileRestaurant } from '@/lib/api';

interface RestaurantContextType {
    /** Currently cached restaurant + menu */
    current: StoreDetail | null;
    /** Set the currently viewed restaurant */
    setCurrentStore: (store: StoreDetail) => void;
    /** Get a product by id from the cache */
    getProduct: (id: string) => MobileProduct | undefined;
    /** Get the restaurant object */
    getRestaurant: () => MobileRestaurant | undefined;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
    const [current, setCurrent] = useState<StoreDetail | null>(null);
    // Keep a ref map for fast product lookups
    const productMapRef = useRef<Map<string, MobileProduct>>(new Map());

    const setCurrentStore = useCallback((store: StoreDetail) => {
        setCurrent(store);
        productMapRef.current = new Map(store.products.map((p) => [p.id, p]));
    }, []);

    const getProduct = useCallback(
        (id: string) => productMapRef.current.get(id),
        [],
    );

    const getRestaurant = useCallback(() => current?.restaurant, [current]);

    const value = useMemo(
        () => ({ current, setCurrentStore, getProduct, getRestaurant }),
        [current, setCurrentStore, getProduct, getRestaurant],
    );

    return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurantCache() {
    const ctx = useContext(RestaurantContext);
    if (!ctx) throw new Error('useRestaurantCache must be used within RestaurantProvider');
    return ctx;
}
