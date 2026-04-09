/**
 * hooks/use-restaurants.ts
 * Fetches and caches the restaurant list from /api/stores.
 *
 * Strategy:
 * - Stale data from AsyncStorage is shown immediately (no loading flash on revisit).
 * - Background revalidation when the cache is expired.
 * - refresh() invalidates cache and forces a fresh fetch (pull-to-refresh).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getRestaurants, type MobileRestaurant, type ApiError } from '@/lib/api';
import { useApiCacheContext } from '@/contexts/api-cache-context';

const TTL = 10 * 60 * 1000; // 10 minutes

interface Params {
    q?: string;
    cuisine?: string;
    city?: string;
    sort?: 'recommended' | 'rating' | 'orders' | 'newest';
    limit?: number;
    skip?: boolean;
}

interface State {
    restaurants: MobileRestaurant[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

function buildKey(params: Params) {
    return `restaurants:${JSON.stringify({
        q: params.q, cuisine: params.cuisine, city: params.city,
        sort: params.sort, limit: params.limit,
    })}`;
}

export function useRestaurants(params: Params = {}): State {
    const cache     = useApiCacheContext();
    const abortRef  = useRef<AbortController | null>(null);
    const cacheKey  = buildKey(params);

    const [restaurants, setRestaurants] = useState<MobileRestaurant[]>(
        () => cache.getStale<MobileRestaurant[]>(cacheKey) ?? [],
    );
    const [loading, setLoading] = useState(
        () => !params.skip && cache.getStale(cacheKey) === null,
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.skip) return;

        // SWR: return stale data now, silently revalidate in background
        cache.withSWR(
            cacheKey,
            () => getRestaurants({ q: params.q, cuisine: params.cuisine, city: params.city, sort: params.sort, limit: params.limit }),
            TTL,
            (fresh) => {
                setRestaurants(fresh);
                setLoading(false);
            },
        );

        // First-time load (no stale data): show loading state
        if (cache.getStale(cacheKey) === null) {
            setLoading(true);
            cache.withCache(
                cacheKey,
                () => getRestaurants({ q: params.q, cuisine: params.cuisine, city: params.city, sort: params.sort, limit: params.limit }),
                TTL,
            )
                .then((data) => setRestaurants(data))
                .catch((e) => {
                    if ((e as Error).name !== 'AbortError') {
                        setError((e as ApiError).message ?? 'Erreur de chargement');
                    }
                })
                .finally(() => setLoading(false));
        }

        return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.q, params.cuisine, params.city, params.sort, params.limit, params.skip]);

    const refresh = useCallback(async () => {
        if (params.skip) return;
        cache.invalidate(cacheKey);
        setError(null);
        setLoading(true);
        try {
            const data = await cache.withCache(
                cacheKey,
                () => getRestaurants({ q: params.q, cuisine: params.cuisine, city: params.city, sort: params.sort, limit: params.limit }),
                TTL,
            );
            setRestaurants(data);
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setError((e as ApiError).message ?? 'Erreur de chargement');
            }
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.q, params.cuisine, params.city, params.sort, params.limit, params.skip, cache, cacheKey]);

    return { restaurants, loading, error, refresh };
}
