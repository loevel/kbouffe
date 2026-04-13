"use client";

import { useMemo } from "react";
import { useAdminQuery } from "../use-admin-query";

export interface AdminOrdersFilters {
    search?: string;
    status?: string;
    restaurant_id?: string;
    date_from?: string;
    date_to?: string;
    payment_status?: string;
    page?: number;
    limit?: number;
}

export interface AdminOrderRow {
    id: string;
    restaurantId: string;
    restaurantName: string;
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    deliveryType: string;
    itemCount: number;
    createdAt: string;
}

interface AdminOrdersResponse {
    data: AdminOrderRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function useAdminOrders(filters?: AdminOrdersFilters) {
    const url = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(filters?.page ?? 1));
        params.set("limit", String(filters?.limit ?? 20));
        if (filters?.search) params.set("q", filters.search);
        if (filters?.status) params.set("status", filters.status);
        if (filters?.restaurant_id) params.set("restaurant_id", filters.restaurant_id);
        if (filters?.date_from) params.set("date_from", filters.date_from);
        if (filters?.date_to) params.set("date_to", filters.date_to);
        if (filters?.payment_status) params.set("payment_status", filters.payment_status);
        return `/api/admin/orders?${params.toString()}`;
    }, [
        filters?.search,
        filters?.status,
        filters?.restaurant_id,
        filters?.date_from,
        filters?.date_to,
        filters?.payment_status,
        filters?.page,
        filters?.limit,
    ]);

    const { data, loading, error, refetch } = useAdminQuery<AdminOrdersResponse>(url);

    return {
        orders: data?.data ?? [],
        total: data?.pagination?.total ?? 0,
        page: data?.pagination?.page ?? 1,
        totalPages: data?.pagination?.totalPages ?? 0,
        loading,
        error,
        refetch,
    };
}
