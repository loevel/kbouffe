/**
 * Orders module — self-contained SWR hooks & mutation helpers.
 *
 * Mirrors the pattern used by @kbouffe/module-reservations.
 * Previously these lived in apps/web-dashboard/src/hooks/use-data.ts.
 */
"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { authFetch } from "@kbouffe/module-core/ui";
import type { Order, OrderStatus } from "../lib/types";

// ── Fetcher ───────────────────────────────────────────────────────────────

async function fetcher<T>(url: string): Promise<T> {
    const res = await authFetch(url);
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────

interface OrdersResponse {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
}

export interface DashboardStats {
    revenue: { today: number; week: number; month: number };
    orders: { today: number; pending: number; total: number };
    averageOrderValue: number;
    totalCustomers: number;
}

export interface RevenueDataPoint {
    label: string;
    value: number;
}

interface StatsResponse {
    stats: DashboardStats;
    revenueChart: RevenueDataPoint[];
}

// ── useOrders ─────────────────────────────────────────────────────────────

export function useOrders(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    payment?: string;
    delivery?: string;
}) {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "all")
        searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.payment && params.payment !== "all")
        searchParams.set("payment", params.payment);
    if (params?.delivery && params.delivery !== "all")
        searchParams.set("delivery", params.delivery);

    const qs = searchParams.toString();
    const key = `/api/orders${qs ? `?${qs}` : ""}`;

    const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
        key,
        fetcher,
        { revalidateOnFocus: true, refreshInterval: 30_000 },
    );

    return {
        orders: data?.orders ?? [],
        total: data?.total ?? 0,
        isLoading,
        error,
        mutate,
    };
}

// ── useOrder ──────────────────────────────────────────────────────────────

export function useOrder(id: string) {
    const { data, error, isLoading, mutate } = useSWR<{ order: Order }>(
        id ? `/api/orders/${id}` : null,
        fetcher,
    );

    return {
        order: data?.order ?? null,
        isLoading,
        error,
        mutate,
    };
}

// ── updateOrderStatus ─────────────────────────────────────────────────────

export async function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string,
    preparationTimeMinutes?: number,
    deliveryNote?: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const payload: Record<string, unknown> = { status, notes };
        if (typeof preparationTimeMinutes === "number") {
            payload.preparation_time_minutes = preparationTimeMinutes;
        }
        if (status === "delivered" && deliveryNote) {
            payload.delivery_note = deliveryNote;
        }

        const res = await authFetch(`/api/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            return { success: false, error: body.error ?? "Erreur" };
        }

        // Revalidate all orders-related SWR keys
        globalMutate(
            (key: string) =>
                typeof key === "string" && key.startsWith("/api/orders"),
            undefined,
            { revalidate: true },
        );
        globalMutate("/api/dashboard/stats", undefined, { revalidate: true });

        return { success: true };
    } catch {
        return { success: false, error: "Erreur réseau" };
    }
}

// ── refundOrder ───────────────────────────────────────────────────────────

export async function refundOrder(
    orderId: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await authFetch(`/api/orders/${orderId}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            return { success: false, error: body.error ?? "Erreur" };
        }

        globalMutate(
            (key: string) =>
                typeof key === "string" && key.startsWith("/api/orders"),
            undefined,
            { revalidate: true },
        );
        globalMutate("/api/dashboard/stats", undefined, { revalidate: true });

        return { success: true };
    } catch {
        return { success: false, error: "Erreur réseau" };
    }
}

// ── useDashboardStats ─────────────────────────────────────────────────────

export function useDashboardStats(period?: "7d" | "30d" | "3m") {
    const key =
        period && period !== "7d"
            ? `/api/dashboard/stats?period=${period}`
            : "/api/dashboard/stats";

    const { data, error, isLoading } = useSWR<StatsResponse>(key, fetcher);

    return {
        stats: data?.stats ?? {
            revenue: { today: 0, week: 0, month: 0 },
            orders: { today: 0, pending: 0, total: 0 },
            averageOrderValue: 0,
            totalCustomers: 0,
        },
        revenueChart: data?.revenueChart ?? [],
        isLoading,
        error,
    };
}

// ── usePendingOrderCount ──────────────────────────────────────────────────

export function usePendingOrderCount() {
    const { data } = useSWR<OrdersResponse>(
        "/api/orders?status=pending&limit=0",
        fetcher,
    );

    return data?.total ?? 0;
}
