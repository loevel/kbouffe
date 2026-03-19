import useSWR from "swr";
import { type Payout } from "@kbouffe/module-core/ui";
import { MOCK_PAYOUTS } from "@kbouffe/module-core/ui";

async function fetcher<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.json() as any;
        throw new Error(body.error ?? `API error ${res.status}`);
    }
    return res.json();
}

interface PayoutsResponse {
    payouts: Payout[];
}

export function usePayouts() {
    const { data, error, isLoading, mutate } = useSWR<PayoutsResponse>(
        "/api/payouts",
        fetcher,
        {
            fallbackData: { payouts: MOCK_PAYOUTS },
        }
    );

    return {
        payouts: data?.payouts ?? MOCK_PAYOUTS,
        isLoading,
        error,
        mutate,
    };
}
