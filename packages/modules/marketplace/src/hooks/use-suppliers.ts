"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { authFetch } from "@kbouffe/module-core/ui";
import type {
  Supplier,
  SupplierProduct,
  SupplierFilters,
  RegisterSupplierRequest,
  CreateSupplierProductRequest,
} from "../lib/types";

// ── Fetcher ───────────────────────────────────────────────────────────────

async function fetcher<T>(url: string): Promise<T> {
  const res = await authFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Response types ────────────────────────────────────────────────────────

interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
}

interface SupplierResponse {
  supplier: Supplier;
}

interface SupplierProductsResponse {
  products: SupplierProduct[];
}

// ── Hooks ─────────────────────────────────────────────────────────────────

export function useSuppliers(filters?: SupplierFilters) {
  const params = new URLSearchParams();
  if (filters?.region) params.set("region", filters.region);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.page) params.set("page", String(filters.page));

  const query = params.toString();
  const url = `/api/marketplace/suppliers${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<SuppliersResponse>(
    url,
    fetcher
  );

  return {
    suppliers: data?.suppliers ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useSupplier(id: string) {
  const { data, error, isLoading } = useSWR<SupplierResponse>(
    id ? `/api/marketplace/suppliers/${id}` : null,
    fetcher
  );

  return {
    supplier: data?.supplier ?? null,
    isLoading,
    error,
  };
}

export function useMySupplierProducts(supplierId: string) {
  const { data, error, isLoading, mutate } = useSWR<SupplierProductsResponse>(
    supplierId ? `/api/marketplace/suppliers/${supplierId}/products` : null,
    fetcher
  );

  return {
    products: data?.products ?? [],
    isLoading,
    error,
    mutate,
  };
}

// ── Self-service hooks (fournisseur connecté) ──────────────────────────────

interface MySupplierResponse {
  supplier: Supplier & { supplier_products?: SupplierProduct[] };
}

interface MyOrdersResponse {
  orders: Array<Record<string, unknown>>;
  summary: { total_orders: number; total_revenue_fcfa: number };
}

interface MyProductsResponse {
  products: SupplierProduct[];
  kyc_status: string;
}

export function useMySupplier() {
  const { data, error, isLoading, mutate } = useSWR<MySupplierResponse>(
    "/api/marketplace/suppliers/me",
    fetcher
  );

  return {
    supplier: data?.supplier ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useMyOrders() {
  const { data, error, isLoading, mutate } = useSWR<MyOrdersResponse>(
    "/api/marketplace/suppliers/me/orders",
    fetcher
  );

  return {
    orders: data?.orders ?? [],
    summary: data?.summary ?? { total_orders: 0, total_revenue_fcfa: 0 },
    isLoading,
    error,
    mutate,
  };
}

export function useMyProducts() {
  const { data, error, isLoading, mutate } = useSWR<MyProductsResponse>(
    "/api/marketplace/suppliers/me/products",
    fetcher
  );

  return {
    products: data?.products ?? [],
    kycStatus: data?.kyc_status ?? "pending",
    isLoading,
    error,
    mutate,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────

export async function registerSupplier(
  data: RegisterSupplierRequest
): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
  try {
    const res = await authFetch("/api/marketplace/suppliers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) return { success: false, error: body.error };

    globalMutate(
      (key: unknown) =>
        typeof key === "string" && key.includes("/marketplace/suppliers"),
      undefined,
      { revalidate: true }
    );

    return { success: true, supplier: body.supplier };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function updateMyProfile(
  data: Partial<{ description: string; logo_url: string; address: string; locality: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch("/api/marketplace/suppliers/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: (body as { error?: string }).error };
    }

    globalMutate("/api/marketplace/suppliers/me", undefined, { revalidate: true });
    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function createMyProduct(
  data: CreateSupplierProductRequest
): Promise<{ success: boolean; product?: SupplierProduct; error?: string }> {
  try {
    const res = await authFetch("/api/marketplace/suppliers/me/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json() as { success?: boolean; product?: SupplierProduct; error?: string };
    if (!res.ok) return { success: false, error: body.error };

    globalMutate("/api/marketplace/suppliers/me/products", undefined, { revalidate: true });
    return { success: true, product: body.product };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function createSupplierProduct(
  supplierId: string,
  data: CreateSupplierProductRequest
): Promise<{ success: boolean; product?: SupplierProduct; error?: string }> {
  try {
    const res = await authFetch(
      `/api/marketplace/suppliers/${supplierId}/products`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const body = await res.json();
    if (!res.ok) return { success: false, error: body.error };

    globalMutate(
      (key: unknown) =>
        typeof key === "string" &&
        key.includes(`/marketplace/suppliers/${supplierId}/products`),
      undefined,
      { revalidate: true }
    );

    return { success: true, product: body.product };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function updateSupplierProduct(
  id: string,
  data: Partial<CreateSupplierProductRequest>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/marketplace/supplier-products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error };
    }

    globalMutate(
      (key: unknown) =>
        typeof key === "string" && key.includes("/marketplace/suppliers"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function deleteSupplierProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/marketplace/supplier-products/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error };
    }

    globalMutate(
      (key: unknown) =>
        typeof key === "string" && key.includes("/marketplace/suppliers"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}
