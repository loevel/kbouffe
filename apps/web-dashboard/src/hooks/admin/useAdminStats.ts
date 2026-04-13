"use client";

import { useEffect } from "react";
import { useAdminQuery } from "../use-admin-query";

export interface AdminStatsData {
    users?: {
        total: number;
        customers: number;
        merchants: number;
        drivers: number;
    };
    restaurants?: {
        total: number;
        active: number;
        pending: number;
    };
    orders?: {
        today: number;
        total: number;
        pending: number;
    };
    revenue?: {
        today: number;
        week: number;
        month: number;
    };
}

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function useAdminStats() {
    const { data, loading, error, refetch } = useAdminQuery<AdminStatsData>("/api/admin/stats");

    useEffect(() => {
        const interval = setInterval(refetch, AUTO_REFRESH_MS);
        return () => clearInterval(interval);
    }, [refetch]);

    return { stats: data, loading, error, refetch };
}
