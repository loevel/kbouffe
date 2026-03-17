/**
 * hooks/use-restaurants.ts
 * Fetches and caches the restaurant list from /api/stores.
 * Falls back to an empty list on error so the app never crashes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getRestaurants, type MobileRestaurant, type ApiError } from '@/lib/api';

interface Params {
    q?: string;
    cuisine?: string;
    city?: string;
    sort?: 'recommended' | 'rating' | 'orders' | 'newest';
    limit?: number;
    skip?: boolean; // set true to prevent fetching
}

interface State {
    restaurants: MobileRestaurant[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useRestaurants(params: Params = {}): State {
    const [restaurants, setRestaurants] = useState<MobileRestaurant[]>([]);
    const [loading, setLoading]         = useState(!params.skip);
    const [error, setError]             = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetch = useCallback(async () => {
        if (params.skip) return;
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        setError(null);
        try {
            const data = await getRestaurants({
                q:       params.q,
                cuisine: params.cuisine,
                city:    params.city,
                sort:    params.sort,
                limit:   params.limit,
            });
            setRestaurants(data);
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setError((e as ApiError).message ?? 'Erreur de chargement');
            }
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.q, params.cuisine, params.city, params.sort, params.limit, params.skip]);

    useEffect(() => {
        void fetch();
        return () => abortRef.current?.abort();
    }, [fetch]);

    return { restaurants, loading, error, refresh: fetch };
}
