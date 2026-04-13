"use client";

import { useMemo } from "react";
import { useAdminQuery } from "../use-admin-query";

export interface AdminSupportFilters {
    status?: string;
    priority?: string;
    assigned_to?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface AdminSupportTicket {
    id: string;
    userId: string;
    userEmail: string | null;
    userName: string | null;
    restaurantId: string | null;
    restaurantName: string | null;
    subject: string;
    message: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface AdminSupportResponse {
    data: AdminSupportTicket[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function useAdminSupport(filters?: AdminSupportFilters) {
    const url = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(filters?.page ?? 1));
        params.set("limit", String(filters?.limit ?? 20));
        if (filters?.search) params.set("q", filters.search);
        if (filters?.status) params.set("status", filters.status);
        if (filters?.priority) params.set("priority", filters.priority);
        if (filters?.assigned_to) params.set("assigned_to", filters.assigned_to);
        return `/api/admin/support?${params.toString()}`;
    }, [
        filters?.search,
        filters?.status,
        filters?.priority,
        filters?.assigned_to,
        filters?.page,
        filters?.limit,
    ]);

    const { data, loading, error, refetch } = useAdminQuery<AdminSupportResponse>(url);

    return {
        tickets: data?.data ?? [],
        total: data?.pagination?.total ?? 0,
        page: data?.pagination?.page ?? 1,
        totalPages: data?.pagination?.totalPages ?? 0,
        loading,
        error,
        refetch,
    };
}
