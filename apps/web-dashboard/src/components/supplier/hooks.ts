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

/**
 * Phase 2 — Predictions Hooks
 */

interface DemandForecast {
  productId: string;
  productName: string;
  currentStock: number;
  historicalAvgPerDay: number;
  forecast30d: number;
  suggestedReorderQty: number;
  reorderUrgency: "low" | "medium" | "high";
  daysUntilStockout: number;
}

interface PriceRecommendation {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  priceDelta: number;
  targetMarginPercent: number;
  estimatedMargin: number;
  confidence: number;
}

interface MarginAlert {
  productId: string;
  productName: string;
  currentMargin: number;
  targetMargin: number;
  daysAboveTarget: number;
  recommendation: string;
  severity: "info" | "warning" | "critical";
}

interface CogsPriceData {
  productId: string;
  productName: string;
  costPerUnit: number;
  sellingPrice: number;
  unitsSoldLast30d: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  marginPercent: number;
  roiPercent: number;
}

export function useDemandForecast(supplierId: string) {
  const { data, error, isLoading } = useSWR<DemandForecast[]>(
    supplierId ? `/api/supplier/forecast?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return { forecast: data || [], error, isLoading };
}

export function usePriceSuggestions(supplierId: string, targetMargin: number = 30) {
  const { data, error, isLoading } = useSWR<PriceRecommendation[]>(
    supplierId ? `/api/supplier/price-suggestions?supplierId=${supplierId}&targetMargin=${targetMargin}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return { suggestions: data || [], error, isLoading };
}

export function useMarginAlerts(supplierId: string, targetMargin: number = 30) {
  const { data, error, isLoading } = useSWR<MarginAlert[]>(
    supplierId ? `/api/supplier/margin-alerts?supplierId=${supplierId}&targetMargin=${targetMargin}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return { alerts: data || [], error, isLoading };
}

export function useCOGSAnalysis(supplierId: string) {
  const { data, error, isLoading } = useSWR<CogsPriceData[]>(
    supplierId ? `/api/supplier/cogs-analysis?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return { analysis: data || [], error, isLoading };
}

/**
 * Phase 3 — Profitability Hooks
 */

interface MarginHeatmapCell {
  buyerId: string;
  buyerName: string;
  productId: string;
  productName: string;
  margin: number;
  revenue: number;
  profit: number;
  orders: number;
}

interface PricingRule {
  id: string;
  productId: string;
  productName: string;
  costPerUnit: number;
  targetMarginPercent: number;
  minPrice: number;
  maxPrice: number;
  calculatedPrice: number;
  autoApply: boolean;
}

interface CrossSellOpportunity {
  primaryProductId: string;
  primaryProductName: string;
  bundleProductId: string;
  bundleProductName: string;
  coSellFrequency: number;
  coSellRate: number;
  recommendedBuyerSegment: string;
  bundleMargin: number;
}

interface MarketIntelligence {
  categoryName: string;
  yourAvgPrice: number;
  marketAvgPrice: number;
  pricePosition: "premium" | "competitive" | "budget";
  volumeGap: number;
  growthTrend: number;
  recommendation: string;
}

export function useMarginHeatmap(supplierId: string) {
  const { data, error, isLoading } = useSWR<MarginHeatmapCell[]>(
    supplierId ? `/api/supplier/margin-heatmap?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  return { heatmap: data || [], error, isLoading };
}

export function usePricingRules(supplierId: string) {
  const { data, error, isLoading } = useSWR<PricingRule[]>(
    supplierId ? `/api/supplier/pricing-rules?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  return { rules: data || [], error, isLoading };
}

export function useCrossSellRecommendations(supplierId: string) {
  const { data, error, isLoading } = useSWR<CrossSellOpportunity[]>(
    supplierId ? `/api/supplier/cross-sell?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  return { recommendations: data || [], error, isLoading };
}

export function useMarketIntelligence(supplierId: string) {
  const { data, error, isLoading } = useSWR<MarketIntelligence[]>(
    supplierId ? `/api/supplier/market-intelligence?supplierId=${supplierId}` : null,
    (url) => authFetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  return { intelligence: data || [], error, isLoading };
}
