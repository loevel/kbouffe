"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Loader2, XCircle } from "lucide-react";
import { Card, Button, authFetch } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { DateRangePicker, type DateRange } from "@/components/admin/DateRangePicker";
import { FinanceSummaryCards } from "@/components/dashboard/finances/FinanceSummaryCards";
import { TransactionsTable } from "@/components/dashboard/finances/TransactionsTable";
import { PayoutsList } from "@kbouffe/module-hr/ui";

// Fetcher for SWR
async function fetcher<T>(url: string): Promise<T> {
    const res = await authFetch(url);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `API error ${res.status}`);
    }
    return res.json();
}

// Types from the API response
interface FinanceSummary {
    summary: {
        grossRevenue: number;
        deliveryRevenue: number;
        feesRevenue: number;
        tipsRevenue: number;
        totalRevenue: number;
        transactionCount: number;
        avgOrderValue: number;
        totalPaidOut: number;
        pendingPayouts: number;
    };
    transactions: Array<{
        id: string;
        customer_name: string;
        total: number;
        payment_method: string;
        payment_status: string;
        status: string;
        created_at: string;
    }>;
    payouts: any[];
}

export default function FinancesPage() {
    const { t } = useLocale();
    const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });

    // Build API URL with date range params
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (dateRange.from) params.set("from", dateRange.from);
        if (dateRange.to) params.set("to", dateRange.to);
        const query = params.toString();
        return `/api/finances/summary${query ? `?${query}` : ""}`;
    }, [dateRange]);

    const { data, error, isLoading, mutate } = useSWR<FinanceSummary>(
        apiUrl,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // 1 minute dedup
        }
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.finances.title}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">{t.finances.subtitle}</p>
                </div>
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-surface-400" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.finances.title}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">{t.finances.subtitle}</p>
                </div>
                <div className="text-center py-20">
                    <XCircle size={40} className="mx-auto text-red-400 mb-4" />
                    <p className="text-surface-500">{error?.message ?? "Impossible de charger les données"}</p>
                    <Button variant="outline" onClick={() => mutate()} className="mt-4">
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.finances.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.finances.subtitle}</p>
            </div>

            {/* Date Range Filter */}
            <Card className="mb-6 p-4">
                <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onChange={setDateRange}
                    label="Période d'analyse"
                />
            </Card>

            <div className="space-y-6">
                <FinanceSummaryCards summary={data.summary} />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <TransactionsTable transactions={data.transactions} />
                    </div>
                    <PayoutsList />
                </div>
            </div>
        </>
    );
}
