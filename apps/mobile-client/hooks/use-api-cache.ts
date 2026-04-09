import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const STORAGE_PREFIX = '@kbouffe:cache:';

// ── AsyncStorage helpers ──────────────────────────────────────────────────────

async function readFromStorage<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        return JSON.parse(raw) as CacheEntry<T>;
    } catch {
        return null;
    }
}

async function writeToStorage<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // Storage full or unavailable — silent fail, in-memory cache still works
    }
}

async function removeFromStorage(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_PREFIX + key);
    } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Persistent cache for API calls with stale-while-revalidate support.
 *
 * - In-memory Map for synchronous reads (fast path)
 * - AsyncStorage for persistence across app restarts
 * - Request deduplication: concurrent calls for the same key share one Promise
 * - Stale-while-revalidate: expired entries are returned immediately while a
 *   background refetch updates the cache
 */
export function useApiCache() {
    const cacheRef   = useRef<Map<string, CacheEntry<any>>>(new Map());
    const pendingRef = useRef<Map<string, Promise<any>>>(new Map());

    // Hydrate in-memory cache from AsyncStorage on first mount
    useEffect(() => {
        AsyncStorage.getAllKeys().then((allKeys) => {
            const ours = (allKeys ?? []).filter((k) => k.startsWith(STORAGE_PREFIX));
            if (ours.length === 0) return;
            return AsyncStorage.multiGet(ours).then((pairs) => {
                for (const [storageKey, raw] of pairs) {
                    if (!raw) continue;
                    try {
                        const entry = JSON.parse(raw) as CacheEntry<any>;
                        const cacheKey = storageKey.slice(STORAGE_PREFIX.length);
                        cacheRef.current.set(cacheKey, entry);
                    } catch {}
                }
            });
        }).catch(() => {});
    }, []);

    // ── Primitives ────────────────────────────────────────────────────────────

    const getCached = useCallback(
        <T,>(key: string, ttl: number = DEFAULT_TTL): T | null => {
            const entry = cacheRef.current.get(key);
            if (!entry) return null;
            if (Date.now() - entry.timestamp > ttl) return null; // expired
            return entry.data as T;
        },
        [],
    );

    /** Returns a stale entry regardless of TTL, or null if absent. */
    const getStale = useCallback(<T,>(key: string): T | null => {
        const entry = cacheRef.current.get(key);
        return entry ? (entry.data as T) : null;
    }, []);

    const setCached = useCallback(<T,>(key: string, data: T): void => {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        cacheRef.current.set(key, entry);
        void writeToStorage(key, entry);
    }, []);

    const invalidate = useCallback((key: string): void => {
        cacheRef.current.delete(key);
        void removeFromStorage(key);
    }, []);

    const clearAll = useCallback((): void => {
        const keys = [...cacheRef.current.keys()];
        cacheRef.current.clear();
        pendingRef.current.clear();
        void AsyncStorage.multiRemove(keys.map((k) => STORAGE_PREFIX + k)).catch(() => {});
    }, []);

    // ── withCache — cache-first + deduplication ───────────────────────────────

    /**
     * Returns cached data if fresh, otherwise fetches and caches the result.
     * Concurrent calls for the same key share one in-flight Promise.
     */
    const withCache = useCallback(
        <T,>(key: string, fn: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> => {
            const cached = getCached<T>(key, ttl);
            if (cached !== null) return Promise.resolve(cached);

            const pending = pendingRef.current.get(key);
            if (pending) return pending as Promise<T>;

            const promise = fn()
                .then((data) => {
                    setCached(key, data);
                    pendingRef.current.delete(key);
                    return data;
                })
                .catch((err) => {
                    pendingRef.current.delete(key);
                    throw err;
                });

            pendingRef.current.set(key, promise);
            return promise;
        },
        [getCached, setCached],
    );

    // ── withSWR — stale-while-revalidate ──────────────────────────────────────

    /**
     * Returns stale data immediately (if any), then triggers a background
     * refetch when the entry is expired. Calls `onUpdate` with fresh data.
     *
     * Usage:
     *   const stale = cache.withSWR('key', fetcher, ttl, (fresh) => setState(fresh));
     *   if (stale !== null) setState(stale); // instant render
     */
    const withSWR = useCallback(
        <T,>(
            key: string,
            fn: () => Promise<T>,
            ttl: number = DEFAULT_TTL,
            onUpdate?: (data: T) => void,
        ): T | null => {
            const entry = cacheRef.current.get(key);
            const isExpired = !entry || Date.now() - entry.timestamp > ttl;

            if (isExpired && !pendingRef.current.has(key)) {
                const promise = fn()
                    .then((data) => {
                        setCached(key, data);
                        pendingRef.current.delete(key);
                        onUpdate?.(data);
                        return data;
                    })
                    .catch(() => {
                        pendingRef.current.delete(key);
                    });
                pendingRef.current.set(key, promise);
            }

            return entry ? (entry.data as T) : null;
        },
        [setCached],
    );

    return { getCached, getStale, setCached, withCache, withSWR, invalidate, clearAll };
}
