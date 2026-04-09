import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@kbouffe/shared-types';

const FAVORITES_STORAGE_KEY = '@kbouffe/favorites';

export interface FavoriteItem {
    id: string;
    product: Product;
    restaurantId: string;
    restaurantName: string;
    restaurantLogo?: string;
    addedAt: number;
}

interface FavoritesContextType {
    favorites: FavoriteItem[];
    isFavorite: (productId: string) => boolean;
    addFavorite: (product: Product, restaurantId: string, restaurantName: string, restaurantLogo?: string) => void;
    removeFavorite: (productId: string) => void;
    getFavoritesByRestaurant: (restaurantId: string) => FavoriteItem[];
    favoriteCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const isHydrated = useRef(false);

    // Load favorites from AsyncStorage
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
                if (raw) {
                    const persisted: FavoriteItem[] = JSON.parse(raw);
                    if (Array.isArray(persisted)) {
                        setFavorites(persisted);
                    }
                }
            } catch (error) {
                console.warn('[FavoritesProvider] Error loading favorites:', error);
            } finally {
                isHydrated.current = true;
            }
        };

        loadFavorites();
    }, []);

    // Persist to AsyncStorage
    useEffect(() => {
        if (!isHydrated.current) return;

        const saveFavorites = async () => {
            try {
                await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            } catch (error) {
                console.warn('[FavoritesProvider] Error saving favorites:', error);
            }
        };

        saveFavorites();
    }, [favorites]);

    const isFavorite = useCallback((productId: string) => {
        return favorites.some(fav => fav.product.id === productId);
    }, [favorites]);

    const addFavorite = useCallback((
        product: Product,
        restaurantId: string,
        restaurantName: string,
        restaurantLogo?: string
    ) => {
        setFavorites(prev => {
            // Don't add if already exists
            if (prev.some(fav => fav.product.id === product.id)) {
                return prev;
            }
            return [...prev, {
                id: `${restaurantId}-${product.id}`,
                product,
                restaurantId,
                restaurantName,
                restaurantLogo,
                addedAt: Date.now(),
            }];
        });
    }, []);

    const removeFavorite = useCallback((productId: string) => {
        setFavorites(prev => prev.filter(fav => fav.product.id !== productId));
    }, []);

    const getFavoritesByRestaurant = useCallback((restaurantId: string) => {
        return favorites.filter(fav => fav.restaurantId === restaurantId);
    }, [favorites]);

    const value: FavoritesContextType = {
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        getFavoritesByRestaurant,
        favoriteCount: favorites.length,
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within FavoritesProvider');
    }
    return context;
}
