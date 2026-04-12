/**
 * Favorites hook — extracted from loyalty-context.
 * Manages restaurant and product favorites with optimistic UI updates.
 */
import { useCallback, useMemo } from 'react';
import { useLoyalty } from '@/contexts/loyalty-context';

export function useFavorites() {
    const {
        favoriteRestaurantIds,
        favoriteProductIds,
        toggleRestaurantFavorite,
        toggleProductFavorite,
        isRestaurantFavorite,
        isProductFavorite,
    } = useLoyalty();

    return {
        favoriteRestaurantIds,
        favoriteProductIds,
        toggleRestaurantFavorite,
        toggleProductFavorite,
        isRestaurantFavorite,
        isProductFavorite,
    };
}
