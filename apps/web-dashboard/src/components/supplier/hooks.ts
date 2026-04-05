import { useMemo } from "react";
import useSWR from "swr";
import { authFetch } from "@kbouffe/module-core/ui";

interface SupplierMetrics {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  avgMargin: number;
  totalCustomers: number;
  periodLabel: string;
}

interface ProductPerformance {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  avgMargin: number;
  roi: number;
  trend: "up" | "down" | "flat";
  category: string;
}

interface BuyerSegment {
  id: string;
  name: string;
  totalOrders: number;
  repeatRate: number;
  ltv: number;
  churnRisk: "low" | "medium" | "high";
  lastOrderDate: string;
}

interface CategoryBreakdown {
  name: string;
  salesPercent: number;
  avgMargin: number;
  growth: number;
  productCount: number;
}

interface SalesVelocity {
  date: string;
  orders: number;
  revenue: number;
  avgOrder: number;
}

/**
 * useSupplierMetrics — Fetch supplier overview KPIs
 */
export function useSupplierMetrics(supplierId: string) {
  const { data, error, isLoading } = useSWR<SupplierMetrics>(
    supplierId ? `/api/supplier/metrics?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 } // 1 min cache
  );

  return {
    metrics: data,
    error,
    isLoading,
  };
}

/**
 * useSupplierProducts — Fetch product performance data
 */
export function useSupplierProducts(supplierId: string) {
  const { data, error, isLoading } = useSWR<ProductPerformance[]>(
    supplierId ? `/api/supplier/products?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    products: data || [],
    error,
    isLoading,
  };
}

/**
 * useSupplierBuyers — Fetch buyer segment data
 */
export function useSupplierBuyers(supplierId: string) {
  const { data, error, isLoading } = useSWR<BuyerSegment[]>(
    supplierId ? `/api/supplier/buyers?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    buyers: data || [],
    error,
    isLoading,
  };
}

/**
 * useSupplierCategories — Fetch category performance
 */
export function useSupplierCategories(supplierId: string) {
  const { data, error, isLoading } = useSWR<CategoryBreakdown[]>(
    supplierId ? `/api/supplier/categories?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    categories: data || [],
    error,
    isLoading,
  };
}

/**
 * useSupplierSalesVelocity — Fetch sales trend data
 */
export function useSupplierSalesVelocity(supplierId: string, period: "daily" | "weekly" | "monthly" = "daily") {
  const { data, error, isLoading } = useSWR<SalesVelocity[]>(
    supplierId ? `/api/supplier/sales-velocity?supplierId=${supplierId}&period=${period}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    velocity: data || [],
    error,
    isLoading,
  };
}

/**
 * Formatting utilities
 */

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
}

export function formatPercent(value: number, decimals = 1): string {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals) + "%";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getChurnRiskColor(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low":
      return "text-emerald-400";
    case "medium":
      return "text-amber-400";
    case "high":
      return "text-red-400";
  }
}

export function getChurnRiskBg(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low":
      return "bg-emerald-500/10 border-emerald-500/25";
    case "medium":
      return "bg-amber-500/10 border-amber-500/25";
    case "high":
      return "bg-red-500/10 border-red-500/25";
  }
}
