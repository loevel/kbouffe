"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminFetch } from "@kbouffe/module-core/ui";

interface UseAdminQueryState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseAdminQueryResult<T> extends UseAdminQueryState<T> {
    refetch: () => void;
}

/**
 * Simple hook for admin data fetching with loading state, error handling, and retry.
 * Auto-fetches on mount. Retries once after 1s on network error.
 *
 * @example
 * const { data, loading, error, refetch } = useAdminQuery<UsersResponse>('/api/admin/users')
 */
export function useAdminQuery<T>(
    url: string,
    options?: RequestInit,
): UseAdminQueryResult<T> {
    const [state, setState] = useState<UseAdminQueryState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    const retryCount = useRef(0);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const execute = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const attempt = async (): Promise<void> => {
            try {
                const res = await adminFetch(url, optionsRef.current);
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    const message = (json as { error?: string }).error ?? `Erreur ${res.status}`;
                    setState({ data: null, loading: false, error: message });
                    return;
                }
                const data: T = await res.json();
                setState({ data, loading: false, error: null });
                retryCount.current = 0;
            } catch (err) {
                if (retryCount.current < 1) {
                    retryCount.current += 1;
                    await new Promise(r => setTimeout(r, 1000));
                    return attempt();
                }
                retryCount.current = 0;
                const message =
                    err instanceof Error ? err.message : "Erreur de connexion au serveur";
                setState({ data: null, loading: false, error: message });
            }
        };

        await attempt();
    }, [url]);

    useEffect(() => {
        retryCount.current = 0;
        execute();
    }, [execute]);

    return { ...state, refetch: execute };
}
