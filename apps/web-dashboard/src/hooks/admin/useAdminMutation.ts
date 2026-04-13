"use client";

import { useState, useCallback } from "react";
import { adminFetch, toast } from "@kbouffe/module-core/ui";

interface MutationState {
    loading: boolean;
    error: string | null;
}

interface UseAdminMutationOptions {
    successMessage?: string;
    errorMessage?: string;
}

export function useAdminMutation<TData = unknown, TBody = unknown>(
    url: string,
    method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST",
    options?: UseAdminMutationOptions,
) {
    const [state, setState] = useState<MutationState>({ loading: false, error: null });

    const mutate = useCallback(
        async (body?: TBody): Promise<TData> => {
            setState({ loading: true, error: null });
            let handled = false;

            try {
                const res = await adminFetch(url, {
                    method,
                    ...(body !== undefined && { body: JSON.stringify(body) }),
                });

                const json = await res.json().catch(() => ({}));

                if (!res.ok) {
                    const message =
                        (json as { error?: string }).error ??
                        options?.errorMessage ??
                        `Erreur ${res.status}`;
                    setState({ loading: false, error: message });
                    toast.error(message);
                    handled = true;
                    throw new Error(message);
                }

                setState({ loading: false, error: null });
                if (options?.successMessage) {
                    toast.success(options.successMessage);
                }
                return json as TData;
            } catch (err) {
                if (!handled) {
                    const message =
                        err instanceof Error ? err.message : "Erreur de connexion au serveur";
                    setState({ loading: false, error: message });
                    toast.error(options?.errorMessage ?? message);
                }
                throw err;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [url, method, options?.successMessage, options?.errorMessage],
    );

    const reset = useCallback(() => setState({ loading: false, error: null }), []);

    return { mutate, loading: state.loading, error: state.error, reset };
}
