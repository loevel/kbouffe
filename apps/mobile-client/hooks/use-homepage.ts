/**
 * hooks/use-homepage.ts
 * Fetches cuisine categories and homepage sections.
 * Re-fetches sections when the active cuisine filter changes.
 */
import { useCallback, useEffect, useState } from 'react';
import {
    getCuisineCategories,
    getHomepageSections,
    type CuisineCategory,
    type HomepageSection,
} from '@/lib/api';

interface HomepageState {
    categories: CuisineCategory[];
    sections: HomepageSection[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useHomepage(activeCuisine?: string): HomepageState {
    const [categories, setCategories] = useState<CuisineCategory[]>([]);
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [cats, secs] = await Promise.all([
                getCuisineCategories(),
                getHomepageSections(activeCuisine),
            ]);
            setCategories(cats);
            setSections(secs);
        } catch (e) {
            setError((e as Error).message ?? 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [activeCuisine]);

    useEffect(() => { void fetch(); }, [fetch]);

    return { categories, sections, loading, error, refresh: fetch };
}
