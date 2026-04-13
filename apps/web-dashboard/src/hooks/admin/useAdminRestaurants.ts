"use client";

import { useAdminQuery } from "../use-admin-query";

export interface AdminRestaurantsFilters {
    search?: string;
    kyc_status?: "pending" | "approved" | "rejected" | "incomplete";
    status?: "active" | "blocked";
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface AdminRestaurantRow {
    id: string;
    name: string;
    slug: string;
    city: string;
    cuisineType: string;
    rating: number;
    reviewCount: number;
    orderCount: number;
    isActive: boolean;
    isVerified: boolean;
    isPremium: boolean;
    isSponsored: boolean;
    kycStatus: "pending" | "approved" | "rejected" | "incomplete";
    complianceStatus?: "pending" | "in_review" | "compliant" | "blocked";
    complianceBlockReason?: string | null;
    createdAt: string;
    ownerId: string;
}

interface AdminRestaurantsResponse {
    data: AdminRestaurantRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function useAdminRestaurants(filters?: AdminRestaurantsFilters) {
    const params = new URLSearchParams();
    params.set("page", String(filters?.page ?? 1));
    params.set("limit", String(filters?.limit ?? 20));
    if (filters?.search) params.set("q", filters.search);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.kyc_status) params.set("kyc_status", filters.kyc_status);
    if (filters?.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters?.dateTo) params.set("date_to", filters.dateTo);
    const url = `/api/admin/restaurants?${params.toString()}`;

    const { data, loading, error, refetch } = useAdminQuery<AdminRestaurantsResponse>(url);

    return {
        restaurants: data?.data ?? [],
        total: data?.pagination?.total ?? 0,
        page: data?.pagination?.page ?? 1,
        totalPages: data?.pagination?.totalPages ?? 0,
        loading,
        error,
        refetch,
    };
}
