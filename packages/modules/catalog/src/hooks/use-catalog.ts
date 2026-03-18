"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { authFetch, adminFetch } from "@kbouffe/module-core/ui";
import type { Product, Category } from "../lib/types";

// ── Fetcher ───────────────────────────────────────────────────────────────

async function fetcher<T>(url: string): Promise<T> {
  const fetchFn = url.includes("/api/admin/") ? adminFetch : authFetch;
  const res = await fetchFn(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────

interface ProductsResponse {
  products: Product[];
  total: number;
}

interface CategoriesResponse {
  categories: Category[];
}

// ── Products Hook ─────────────────────────────────────────────────────────

export function useProducts(restaurantId?: string, isAdmin = false) {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  const url = restaurantId 
    ? `${prefix}/products?restaurantId=${restaurantId}`
    : `${prefix}/products`;

  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    url,
    fetcher
  );

  return {
    products: data?.products ?? (data as any)?.data ?? [], // Handle both response formats
    total: data?.total ?? (data as any)?.pagination?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

// ── Product Mutations ─────────────────────────────────────────────────────

export async function createProduct(
  productData: Partial<Product>,
  isAdmin = false
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  try {
    const fetchFn = isAdmin ? adminFetch : authFetch;
    const res = await fetchFn(`${prefix}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    const body = await res.json();
    if (!res.ok) return { success: false, error: body.error };

    const product = body.product || body.data;

    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/products"),
      undefined,
      { revalidate: true }
    );
    if (!isAdmin) {
      globalMutate("/api/dashboard/stats", undefined, { revalidate: true });
    }

    return { success: true, product };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function updateProduct(
  id: string,
  productData: Partial<Product>,
  isAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  try {
    const fetchFn = isAdmin ? adminFetch : authFetch;
    const res = await fetchFn(`${prefix}/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error };
    }

    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/products"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function deleteProduct(
  id: string,
  isAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  try {
    const fetchFn = isAdmin ? adminFetch : authFetch;
    const res = await fetchFn(`${prefix}/products/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error };
    }

    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/products"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

// ── Categories Hook ───────────────────────────────────────────────────────

export function useCategories(restaurantId?: string, isAdmin = false) {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  const url = restaurantId 
    ? `${prefix}/categories?restaurantId=${restaurantId}`
    : `${prefix}/categories`;

  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    url,
    fetcher
  );

  return {
    categories: data?.categories ?? (data as any)?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}


export async function createCategory(
  categoryData: Partial<Category>,
  isAdmin = false
): Promise<{ success: boolean; category?: Category; error?: string }> {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  try {
    const fetchFn = isAdmin ? adminFetch : authFetch;
    const res = await fetchFn(`${prefix}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    });

    const body = await res.json();
    if (!res.ok) return { success: false, error: body.error };

    const category = body.category || body.data;

    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/categories"),
      undefined,
      { revalidate: true }
    );

    return { success: true, category };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}


export async function importCategoryPack(
  packId: string,
  restaurantId: string,
  isAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  try {
    const fetchFn = isAdmin ? adminFetch : authFetch;
    const res = await fetchFn(`${prefix}/categories/import-pack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId, restaurantId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error || "Erreur lors de l'importation du pack" };
    }

    // Revalidate the cache
    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/categories"),
      undefined,
      { revalidate: true }
    );
    // Also revalidate products since we might have imported some
    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/products"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Erreur d'importation de pack:", error);
    return { success: false, error: "Erreur de connexion" };
  }
}


export async function updateCategory(
  id: string,
  categoryData: Partial<Category>,
  isAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  try {
    const fetchFn = isAdmin ? adminFetch : authFetch;
    const res = await fetchFn(`${prefix}/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error };
    }

    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/categories"),
      undefined,
      { revalidate: true }
    );
    globalMutate(
      (key: string) => typeof key === "string" && key.startsWith("/api/products"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function deleteCategory(
  id: string,
  isAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const prefix = isAdmin ? "/api/admin/catalog" : "/api";
  try {
    const fetchFn = isAdmin ? adminFetch : authFetch;
    const res = await fetchFn(`${prefix}/categories/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error };
    }

    globalMutate(
      (key: string) => typeof key === "string" && key.includes("/categories"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}
