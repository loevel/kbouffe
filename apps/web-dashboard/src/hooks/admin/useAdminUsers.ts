"use client";

import { useMemo } from "react";
import { useAdminQuery } from "../use-admin-query";

export interface AdminUsersFilters {
    search?: string;
    role?: "client" | "merchant" | "livreur" | "admin";
    status?: "active" | "banned";
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface AdminUserRow {
    id: string;
    email: string;
    emailRaw?: string | null;
    fullName: string | null;
    phone: string | null;
    phoneRaw?: string | null;
    avatarUrl: string | null;
    role: string;
    adminRole: string | null;
    restaurantId: string | null;
    createdAt: string;
    lastLoginAt: string | null;
}

interface AdminUsersResponse {
    data: AdminUserRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function useAdminUsers(filters?: AdminUsersFilters) {
    const url = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(filters?.page ?? 1));
        params.set("limit", String(filters?.limit ?? 20));
        if (filters?.search) params.set("q", filters.search);
        if (filters?.role) params.set("role", filters.role);
        if (filters?.status) params.set("status", filters.status);
        if (filters?.dateFrom) params.set("date_from", filters.dateFrom);
        if (filters?.dateTo) params.set("date_to", filters.dateTo);
        return `/api/admin/users?${params.toString()}`;
    }, [
        filters?.search,
        filters?.role,
        filters?.status,
        filters?.dateFrom,
        filters?.dateTo,
        filters?.page,
        filters?.limit,
    ]);

    const { data, loading, error, refetch } = useAdminQuery<AdminUsersResponse>(url);

    return {
        users: data?.data ?? [],
        total: data?.pagination?.total ?? 0,
        page: data?.pagination?.page ?? 1,
        totalPages: data?.pagination?.totalPages ?? 0,
        loading,
        error,
        refetch,
    };
}
