import React, { createContext, useContext, ReactNode } from 'react';
import { useApiCache } from '@/hooks/use-api-cache';

interface ApiCacheContextType {
    getCached: <T,>(key: string, ttl?: number) => T | null;
    getStale: <T,>(key: string) => T | null;
    setCached: <T,>(key: string, data: T) => void;
    withCache: <T,>(key: string, fn: () => Promise<T>, ttl?: number) => Promise<T>;
    withSWR: <T,>(key: string, fn: () => Promise<T>, ttl?: number, onUpdate?: (data: T) => void) => T | null;
    invalidate: (key: string) => void;
    clearAll: () => void;
}

const ApiCacheContext = createContext<ApiCacheContextType | null>(null);

export function ApiCacheProvider({ children }: { children: ReactNode }) {
    const cache = useApiCache();

    return (
        <ApiCacheContext.Provider value={cache}>
            {children}
        </ApiCacheContext.Provider>
    );
}

export function useApiCacheContext() {
    const ctx = useContext(ApiCacheContext);
    if (!ctx) {
        throw new Error('useApiCacheContext must be used within ApiCacheProvider');
    }
    return ctx;
}
