import { Hono } from "hono";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

/**
 * Supplier Analytics Routes
 *
 * Metrics for the marketplace supplier dashboard. The supplier is resolved from
 * the authenticated user (suppliers.user_id), NOT from a restaurant. Data comes
 * from the supplier_* tables (supplier_orders, supplier_order_items,
 * supplier_products) — buyers are RESTAURANTS purchasing from the supplier.
 *
 * - GET /api/supplier/metrics        — Overview KPIs (sales, orders, buyers)
 * - GET /api/supplier/products       — Product performance (revenue, units)
 * - GET /api/supplier/buyers         — Buyer (restaurant) segments
 * - GET /api/supplier/categories     — Category breakdown (sales %)
 * - GET /api/supplier/sales-velocity — Orders trend (day/week/month)
 * - GET /api/supplier/stock          — Inventory levels + low stock alerts
 *
 * NOTE: supplier_products has no cost field, so margin/ROI cannot be derived
 * and are returned as 0 (revenue / units / sales counts are real).
 */

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

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
  repeatRate: number; // 0-100%
  ltv: number; // lifetime value
  churnRisk: "low" | "medium" | "high";
  lastOrderDate: string;
}

interface CategoryBreakdown {
  name: string;
  salesPercent: number;
  avgMargin: number;
  growth: number; // % vs previous period
  productCount: number;
}

interface SalesVelocity {
  date: string;
  orders: number;
  revenue: number;
  avgOrder: number;
}

/** Build a service-role client (chat/analytics do their own authorization). */
function db(c: any): SupabaseClient | null {
  if (!c.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Resolve the supplier owned by the authenticated user. */
async function resolveSupplierId(c: any, supabase: SupabaseClient): Promise<string | null> {
  const userId = c.var.userId;
  if (!userId) return null;
  const { data } = await supabase
    .from("suppliers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/**
 * GET /api/supplier/metrics — Overview KPIs (last 30 days)
 */
router.get("/metrics", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);

    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: orders } = await supabase
      .from("supplier_orders")
      .select("id, total_amount, restaurant_id, status, created_at")
      .eq("supplier_id", supplierId)
      .gte("created_at", daysAgo(30));

    const valid = (orders ?? []).filter((o: any) => o.status !== "cancelled");
    const totalSales = valid.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
    const totalOrders = valid.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalCustomers = new Set(valid.map((o: any) => o.restaurant_id)).size;

    const metrics: SupplierMetrics = {
      totalSales,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue),
      avgMargin: 0, // no cost data on supplier_products
      totalCustomers,
      periodLabel: "30 derniers jours",
    };

    return c.json(metrics);
  } catch (error) {
    console.error("[Supplier API] metrics error:", error);
    return c.json({ error: "Failed to fetch metrics" }, 500);
  }
});

/**
 * GET /api/supplier/products — Product performance (last 30 days)
 */
router.get("/products", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);

    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, category")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    // Order items belonging to this supplier's orders in the last 30 days.
    const { data: orders } = await supabase
      .from("supplier_orders")
      .select("id")
      .eq("supplier_id", supplierId)
      .neq("status", "cancelled")
      .gte("created_at", daysAgo(30));

    const orderIds = (orders ?? []).map((o: any) => o.id);

    const stats = new Map<string, { revenue: number; units: number }>();
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from("supplier_order_items")
        .select("product_id, quantity, total_price, order_id")
        .in("order_id", orderIds);

      for (const item of items ?? []) {
        const pid = (item as any).product_id;
        if (!pid) continue;
        if (!stats.has(pid)) stats.set(pid, { revenue: 0, units: 0 });
        const s = stats.get(pid)!;
        s.revenue += (item as any).total_price || 0;
        s.units += Number((item as any).quantity) || 0;
      }
    }

    const result: ProductPerformance[] = products.map((p: any) => {
      const s = stats.get(p.id) || { revenue: 0, units: 0 };
      return {
        id: p.id,
        name: p.name,
        revenue: s.revenue,
        unitsSold: s.units,
        avgMargin: 0, // no cost data
        roi: 0, // no cost data
        trend: "flat",
        category: p.category || "Général",
      };
    });

    return c.json(result.sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    console.error("[Supplier API] products error:", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

/**
 * GET /api/supplier/buyers — Buyer (restaurant) segments (last 30 days)
 */
router.get("/buyers", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);

    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: orders } = await supabase
      .from("supplier_orders")
      .select("restaurant_id, total_amount, status, created_at")
      .eq("supplier_id", supplierId)
      .neq("status", "cancelled")
      .gte("created_at", daysAgo(30))
      .order("created_at", { ascending: false });

    const buyerMap = new Map<string, { orders: number; total: number; lastOrder: string }>();
    for (const order of orders ?? []) {
      const rid = (order as any).restaurant_id;
      if (!rid) continue;
      if (!buyerMap.has(rid)) {
        buyerMap.set(rid, { orders: 0, total: 0, lastOrder: (order as any).created_at });
      }
      const b = buyerMap.get(rid)!;
      b.orders += 1;
      b.total += (order as any).total_amount || 0;
      // orders are sorted desc, so the first seen is the most recent
    }

    // Resolve buyer (restaurant) names.
    const restaurantIds = Array.from(buyerMap.keys());
    const nameMap = new Map<string, string>();
    if (restaurantIds.length > 0) {
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("id, name")
        .in("id", restaurantIds);
      for (const r of restaurants ?? []) {
        nameMap.set((r as any).id, (r as any).name);
      }
    }

    const result: BuyerSegment[] = Array.from(buyerMap.entries()).map(([rid, data]) => {
      const repeatRate = Math.min(Math.round((data.orders / 10) * 100), 100);
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(data.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
      );
      const churnRisk: BuyerSegment["churnRisk"] =
        daysSinceLastOrder > 20 ? "high" : daysSinceLastOrder > 10 ? "medium" : "low";
      return {
        id: rid,
        name: nameMap.get(rid) || "Restaurant " + rid.slice(0, 8),
        totalOrders: data.orders,
        repeatRate,
        ltv: data.total,
        churnRisk,
        lastOrderDate: data.lastOrder,
      };
    });

    return c.json(result.sort((a, b) => b.ltv - a.ltv).slice(0, 20));
  } catch (error) {
    console.error("[Supplier API] buyers error:", error);
    return c.json({ error: "Failed to fetch buyers" }, 500);
  }
});

/**
 * GET /api/supplier/categories — Category performance (last 30 days)
 */
router.get("/categories", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);

    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, category")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    const productCategory = new Map<string, string>();
    const categoryMap = new Map<string, { sales: number; products: Set<string> }>();
    for (const p of products) {
      const cat = (p as any).category || "Général";
      productCategory.set((p as any).id, cat);
      if (!categoryMap.has(cat)) categoryMap.set(cat, { sales: 0, products: new Set() });
      categoryMap.get(cat)!.products.add((p as any).id);
    }

    // Sales per product from this supplier's recent order items.
    const { data: orders } = await supabase
      .from("supplier_orders")
      .select("id")
      .eq("supplier_id", supplierId)
      .neq("status", "cancelled")
      .gte("created_at", daysAgo(30));

    const orderIds = (orders ?? []).map((o: any) => o.id);
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from("supplier_order_items")
        .select("product_id, total_price, order_id")
        .in("order_id", orderIds);

      for (const item of items ?? []) {
        const cat = productCategory.get((item as any).product_id);
        if (cat && categoryMap.has(cat)) {
          categoryMap.get(cat)!.sales += (item as any).total_price || 0;
        }
      }
    }

    const totalSales = Array.from(categoryMap.values()).reduce((s, cat) => s + cat.sales, 0);

    const result: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        salesPercent: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0,
        avgMargin: 0, // no cost data
        growth: 0, // previous-period comparison not computed
        productCount: data.products.size,
      }))
      .sort((a, b) => b.salesPercent - a.salesPercent);

    return c.json(result);
  } catch (error) {
    console.error("[Supplier API] categories error:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

/**
 * GET /api/supplier/sales-velocity — Orders trend over time
 */
router.get("/sales-velocity", async (c: any) => {
  try {
    const period = c.req.query("period") || "daily";

    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);

    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const daysBack = period === "monthly" ? 90 : period === "weekly" ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: orders } = await supabase
      .from("supplier_orders")
      .select("id, total_amount, status, created_at")
      .eq("supplier_id", supplierId)
      .neq("status", "cancelled")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    const velocityMap = new Map<string, { orders: number; revenue: number }>();

    for (const order of orders ?? []) {
      const created = new Date((order as any).created_at);
      let dateKey: string;
      if (period === "monthly") {
        dateKey = created.toLocaleDateString("fr-FR", { year: "numeric", month: "short" });
      } else if (period === "weekly") {
        const weekNum = Math.floor(
          (created.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        dateKey = `Sem ${weekNum + 1}`;
      } else {
        dateKey = created.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      }

      if (!velocityMap.has(dateKey)) velocityMap.set(dateKey, { orders: 0, revenue: 0 });
      const v = velocityMap.get(dateKey)!;
      v.orders += 1;
      v.revenue += (order as any).total_amount || 0;
    }

    const result: SalesVelocity[] = Array.from(velocityMap.entries())
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue,
        avgOrder: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
      }))
      .slice(-14);

    return c.json(result);
  } catch (error) {
    console.error("[Supplier API] sales-velocity error:", error);
    return c.json({ error: "Failed to fetch sales velocity" }, 500);
  }
});

/**
 * GET /api/supplier/stock — Inventory levels + low stock alerts
 */
router.get("/stock", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);

    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, stock_quantity, available_quantity")
      .eq("supplier_id", supplierId);

    const all = products ?? [];
    const lowStockProducts = all.filter(
      (p: any) => Number(p.stock_quantity ?? p.available_quantity ?? 0) < 50
    );

    return c.json({
      lowStockProducts,
      totalProducts: all.length,
    });
  } catch (error) {
    console.error("[Supplier API] stock error:", error);
    return c.json({ error: "Failed to fetch stock" }, 500);
  }
});

export default router;
