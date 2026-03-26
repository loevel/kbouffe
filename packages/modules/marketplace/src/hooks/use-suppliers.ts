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

export async function updateSupplier(
  id: string,
  data: Partial<RegisterSupplierRequest>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/marketplace/suppliers/${id}`, {
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
