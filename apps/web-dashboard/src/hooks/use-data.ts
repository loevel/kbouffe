/**
 * Centralized data-fetching hooks with SWR.
 * Provides caching, deduplication, revalidation, and optimistic mutations
 * for all dashboard data needs.
 *
 * Falls back to mock data when APIs are unavailable (development mode).
 */
"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type {
  Order,
  Product,
  Category,
  Payout,
  OrderStatus,
  Coupon,
  AdCampaign,
  Reservation,
  RestaurantTable,
  TableZone,
} from "@/lib/supabase/types";
// Mock data imports removed
import { authFetch } from "@kbouffe/module-core/ui";

// ── Fetcher ───────────────────────────────────────────────────────────────

async function fetcher<T>(url: string): Promise<T> {
  const res = await authFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────

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

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

interface ProductsResponse {
  products: Product[];
  total: number;
}

interface CategoriesResponse {
  categories: Category[];
}

interface StatsResponse {
  stats: DashboardStats;
  revenueChart: RevenueDataPoint[];
}

interface PayoutsResponse {
  payouts: Payout[];
}

// ── Orders Hooks (Re-exported from module) ──────────────────────────────────
export { 
  useOrders, 
  useOrder, 
  updateOrderStatus, 
  refundOrder, 
  useDashboardStats, 
  usePendingOrderCount 
} from "@kbouffe/module-orders/ui";

// ── Catalog Hooks (Re-exported from module) ────────────────────────────────
export {
  useProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  useCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  importCategoryPack,
  useUploadImage
} from "@kbouffe/module-catalog/ui";



// ── Payouts Hook ──────────────────────────────────────────────────────────

export function usePayouts() {
  const { data, error, isLoading } = useSWR<PayoutsResponse>(
    "/api/payouts",
    fetcher
  );

  return {
    payouts: data?.payouts ?? [],
    isLoading,
    error,
  };
}


// ── Coupons ───────────────────────────────────────────────────────────────────

interface CouponsResponse {
  coupons: Coupon[];
  total: number;
}

export function useCoupons() {
  const { data, error, isLoading, mutate } = useSWR<CouponsResponse>(
    "/api/coupons",
    fetcher,
    { fallbackData: { coupons: [], total: 0 } }
  );

  async function createCoupon(body: Partial<Coupon>) {
    const res = await authFetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur création coupon");
    }
    await mutate();
    return res.json();
  }

  async function updateCoupon(id: string, body: Partial<Coupon>) {
    const res = await authFetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur mise à jour coupon");
    }
    await mutate();
    return res.json();
  }

  async function deleteCoupon(id: string) {
    const res = await authFetch(`/api/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur suppression coupon");
    }
    await mutate();
  }

  return {
    coupons: data?.coupons ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    mutate,
  };
}

// ── Ad Campaigns ──────────────────────────────────────────────────────────────

interface CampaignsResponse {
  campaigns: AdCampaign[];
  activeCampaign: AdCampaign | null;
  total: number;
}

export function useCampaigns() {
  const { data, error, isLoading, mutate } = useSWR<CampaignsResponse>(
    "/api/marketing/campaigns",
    fetcher,
    { fallbackData: { campaigns: [], activeCampaign: null, total: 0 } }
  );

  async function createCampaign(body: {
    package: "basic" | "premium" | "elite";
    starts_at?: string;
    include_push?: boolean;
    push_message?: string;
    notes?: string;
  }) {
    const res = await authFetch("/api/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur création campagne");
    }
    await mutate();
    return res.json();
  }

  async function cancelCampaign(id: string) {
    const res = await authFetch(`/api/marketing/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur annulation campagne");
    }
    await mutate();
  }

  return {
    campaigns: data?.campaigns ?? [],
    activeCampaign: data?.activeCampaign ?? null,
    total: data?.total ?? 0,
    isLoading,
    error,
    createCampaign,
    cancelCampaign,
    mutate,
  };
}

// ── Reservations ─────────────────────────────────────────────────────────────

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "no_show"
  | "cancelled";

interface ReservationsResponse {
  reservations: Reservation[];
  total: number;
}

export function useReservations(params?: {
  status?: string;
  search?: string;
  date?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "all")
    searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.date) searchParams.set("date", params.date);

  const qs = searchParams.toString();
  const key = `/api/reservations${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<ReservationsResponse>(
    key,
    fetcher
  );

  return {
    reservations: data?.reservations ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useReservation(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    reservation: Reservation;
  }>(id ? `/api/reservations/${id}` : null, fetcher);

  return {
    reservation: data?.reservation ?? null,
    isLoading,
    error,
    mutate,
  };
}

export async function createReservation(
  body: Partial<Reservation>
): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
  try {
    const res = await authFetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };

    globalMutate(
      (key: string) =>
        typeof key === "string" && key.startsWith("/api/reservations"),
      undefined,
      { revalidate: true }
    );

    return { success: true, reservation: data.reservation };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function updateReservation(
  id: string,
  body: Partial<Reservation>
): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
  try {
    const res = await authFetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };

    globalMutate(
      (key: string) =>
        typeof key === "string" && key.startsWith("/api/reservations"),
      undefined,
      { revalidate: true }
    );

    return { success: true, reservation: data.reservation };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function deleteReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/reservations/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error };
    }

    globalMutate(
      (key: string) =>
        typeof key === "string" && key.startsWith("/api/reservations"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

// ── Tables ───────────────────────────────────────────────────────────────

interface TablesResponse {
  tables: RestaurantTable[];
}

export function useTables() {
  const { data, error, isLoading, mutate } = useSWR<TablesResponse>(
    "/api/tables",
    fetcher
  );

  return {
    tables: data?.tables ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useTableZones() {
  const { data, error, isLoading, mutate } = useSWR<{ zones: TableZone[] }>(
    "/api/tables/zones",
    fetcher
  );

  return {
    zones: data?.zones ?? [],
    isLoading,
    error,
    mutate,
  };
}

// ── Restaurant Hook ──────────────────────────────────────────────────────────

interface RestaurantResponse {
  success: boolean;
  restaurant: any;
}

export function useRestaurant() {
  const { data, error, isLoading, mutate } = useSWR<RestaurantResponse>(
    "/api/restaurant",
    fetcher
  );

  async function updateRestaurant(body: any) {
    const res = await authFetch("/api/restaurant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur mise à jour restaurant");
    }
    await mutate();
    return res.json();
  }

  return {
    restaurant: data?.restaurant ?? null,
    isLoading,
    error,
    updateRestaurant,
    mutate,
  };
}

// ── useNavBadges ─────────────────────────────────────────────────────────

interface NavBadges extends Record<string, number> {
    orders: number;
    messages: number;
    reviews: number;
}

export function useNavBadges(): NavBadges {
    const { data } = useSWR<NavBadges>(
        "/api/restaurant/badges",
        (url: string) => fetcher<NavBadges>(url),
        { refreshInterval: 30_000, fallbackData: { orders: 0, messages: 0, reviews: 0 } }
    );
    return data ?? { orders: 0, messages: 0, reviews: 0 };
}
