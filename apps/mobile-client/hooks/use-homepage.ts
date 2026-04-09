/**
 * hooks/use-homepage.ts
 * Fetches cuisine categories and homepage sections.
 *
 * Strategy:
 * - On first render, stale data from AsyncStorage is shown immediately (no loading flash).
 * - A background revalidation updates the UI silently when data is expired.
 * - Pull-to-refresh (refresh()) invalidates the cache and forces a fresh fetch.
 */
import { useCallback, useEffect, useState } from 'react';
import {
    getCuisineCategories,
    getHomepageSections,
    type CuisineCategory,
    type HomepageSection,
} from '@/lib/api';
import { useApiCacheContext } from '@/contexts/api-cache-context';

const TTL_CATEGORIES = 60 * 60 * 1000; // 1h — quasi-statiques
const TTL_SECTIONS   =  5 * 60 * 1000; // 5 min — dépendent du filtre cuisine

interface HomepageState {
    categories: CuisineCategory[];
    sections: HomepageSection[];
    /** true only when there is no cached data at all (first ever load) */
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useHomepage(activeCuisine?: string): HomepageState {
    const cache = useApiCacheContext();
    const sectionsKey = `homepage:sections:${activeCuisine ?? ''}`;

    // Seed state from in-memory cache synchronously (populated from AsyncStorage on mount)
    const [categories, setCategories] = useState<CuisineCategory[]>(
        () => cache.getStale<CuisineCategory[]>('homepage:categories') ?? [],
    );
    const [sections, setSections] = useState<HomepageSection[]>(
        () => cache.getStale<HomepageSection[]>(sectionsKey) ?? [],
    );
    // loading=true only when we have no data at all (no stale fallback)
    const [loading, setLoading] = useState(() =>
        cache.getStale('homepage:categories') === null,
    );
    const [error, setError] = useState<string | null>(null);

    // ── Background revalidation via SWR ──────────────────────────────────────
    useEffect(() => {
        // withSWR returns stale data immediately and triggers a background fetch
        // if the entry is expired. onUpdate callbacks update the UI silently.
        cache.withSWR(
            'homepage:categories',
            getCuisineCategories,
            TTL_CATEGORIES,
            (fresh) => {
                setCategories(fresh);
                setLoading(false);
            },
        );

        cache.withSWR(
            sectionsKey,
            () => getHomepageSections(activeCuisine),
            TTL_SECTIONS,
            (fresh) => {
                setSections(fresh);
                setLoading(false);
            },
        );

        // If we had no stale data, wait for the first fetch to complete
        const hasCats = cache.getStale('homepage:categories') !== null;
        const hasSecs = cache.getStale(sectionsKey) !== null;
        if (!hasCats || !hasSecs) {
            setLoading(true);
            Promise.all([
                cache.withCache('homepage:categories', getCuisineCategories, TTL_CATEGORIES),
                cache.withCache(sectionsKey, () => getHomepageSections(activeCuisine), TTL_SECTIONS),
            ])
                .then(([cats, secs]) => {
                    setCategories(cats);
                    setSections(secs);
                })
                .catch((e) => setError((e as Error).message ?? 'Erreur de chargement'))
                .finally(() => setLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCuisine]);

    // ── Pull-to-refresh: invalidate + force fresh fetch ───────────────────────
    const refresh = useCallback(async () => {
        cache.invalidate('homepage:categories');
        cache.invalidate(sectionsKey);
        setError(null);
        try {
            const [cats, secs] = await Promise.all([
                cache.withCache('homepage:categories', getCuisineCategories, TTL_CATEGORIES),
                cache.withCache(sectionsKey, () => getHomepageSections(activeCuisine), TTL_SECTIONS),
            ]);
            setCategories(cats);
            setSections(secs);
        } catch (e) {
            setError((e as Error).message ?? 'Erreur de chargement');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCuisine, cache, sectionsKey]);

    return { categories, sections, loading, error, refresh };
}
