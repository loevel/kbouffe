import { Hono } from "hono";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

/**
 * Supplier Analytics Routes
 *
 * Metrics for the marketplace supplier dashboard. The supplier is resolved from
 * the authenticated user (suppliers.user_id), NOT from a restaurant. Les ventes
 * sont lues dans supplier_order_traces (voir TABLE_VENTES ci-dessous) et les
 * produits dans supplier_products — les acheteurs sont des RESTAURANTS.
 *
 * - GET /api/supplier/metrics        — Overview KPIs (sales, orders, buyers)
 * - GET /api/supplier/products       — Product performance (revenue, units)
 * - GET /api/supplier/buyers         — Buyer (restaurant) segments
 * - GET /api/supplier/categories     — Category breakdown (sales %)
 * - GET /api/supplier/sales-velocity — Orders trend (day/week/month)
 * - GET /api/supplier/stock          — Inventory levels + low stock alerts
 *
 * NOTE : la marge s'appuie sur supplier_products.cost_per_unit quand il est
 * renseigné, sinon sur l'estimation COST_RATIO.
 */

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Les ventes réelles vivent dans supplier_order_traces : la trace est saisie à
 * l'achat (produit, restaurant, quantité, prix) et c'est la seule table écrite
 * par le parcours d'achat. supplier_orders / supplier_order_items n'ont aucun
 * écrivain dans le dépôt et sont vides en base — s'appuyer dessus laissait tout
 * le pilotage fournisseur à zéro alors que l'accueil affichait un vrai CA.
 */
const TABLE_VENTES = "supplier_order_traces";

/**
 * Une trace vaut une ligne produit, pas une commande : compter les lignes
 * gonflerait le nombre de commandes et écraserait le panier moyen. Le panier
 * est donc reconstitué par (restaurant, jour d'achat).
 */
function clePanier(ligne: any): string {
  return `${ligne?.restaurant_id ?? "?"}|${String(ligne?.created_at ?? "").slice(0, 10)}`;
}

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

const COST_RATIO = 0.6; // fallback when cost_per_unit is not set

/** Real unit cost when known, else a 60% heuristic of the selling price. */
function effectiveCost(costPerUnit: number | null | undefined, price: number): number {
  return costPerUnit != null ? costPerUnit : price * COST_RATIO;
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

    const { data: lignes } = await supabase
      .from(TABLE_VENTES)
      .select("product_id, restaurant_id, quantity, total_price, delivery_status, created_at")
      .eq("supplier_id", supplierId)
      .neq("delivery_status", "cancelled")
      .gte("created_at", daysAgo(30));

    const valid = lignes ?? [];
    const totalSales = valid.reduce((sum: number, l: any) => sum + (l.total_price || 0), 0);
    const totalOrders = new Set(valid.map(clePanier)).size;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalCustomers = new Set(valid.map((l: any) => l.restaurant_id)).size;

    // Overall margin from real (or estimated) unit costs.
    let avgMargin = 0;
    if (valid.length > 0 && totalSales > 0) {
      const productIds = [...new Set(valid.map((l: any) => l.product_id).filter(Boolean))];
      const costMap = new Map<string, { cost: number | null; price: number }>();
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from("supplier_products")
          .select("id, cost_per_unit, price_per_unit")
          .in("id", productIds);
        for (const p of prods ?? []) {
          costMap.set((p as any).id, { cost: (p as any).cost_per_unit, price: (p as any).price_per_unit || 0 });
        }
      }
      let totalCost = 0;
      for (const l of valid) {
        const cm = costMap.get((l as any).product_id);
        if (!cm) continue;
        totalCost += effectiveCost(cm.cost, cm.price) * (Number((l as any).quantity) || 0);
      }
      avgMargin = Math.max(0, Math.round(((totalSales - totalCost) / totalSales) * 100));
    }

    const metrics: SupplierMetrics = {
      totalSales,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue),
      avgMargin,
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
      .select("id, name, category, cost_per_unit, price_per_unit")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    // Ventes de ce fournisseur sur les 30 derniers jours.
    const { data: lignes } = await supabase
      .from(TABLE_VENTES)
      .select("product_id, quantity, total_price")
      .eq("supplier_id", supplierId)
      .neq("delivery_status", "cancelled")
      .gte("created_at", daysAgo(30));

    const stats = new Map<string, { revenue: number; units: number }>();
    for (const item of lignes ?? []) {
      const pid = (item as any).product_id;
      if (!pid) continue;
      if (!stats.has(pid)) stats.set(pid, { revenue: 0, units: 0 });
      const s = stats.get(pid)!;
      s.revenue += (item as any).total_price || 0;
      s.units += Number((item as any).quantity) || 0;
    }

    const result: ProductPerformance[] = products.map((p: any) => {
      const s = stats.get(p.id) || { revenue: 0, units: 0 };
      const cost = effectiveCost(p.cost_per_unit, p.price_per_unit || 0);
      const avgPrice = s.units > 0 ? s.revenue / s.units : 0;
      const totalCost = cost * s.units;
      return {
        id: p.id,
        name: p.name,
        revenue: s.revenue,
        unitsSold: s.units,
        avgMargin: avgPrice > 0 ? Math.round(((avgPrice - cost) / avgPrice) * 100) : 0,
        roi: totalCost > 0 ? Math.round(((s.revenue - totalCost) / totalCost) * 100) : 0,
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
      .from(TABLE_VENTES)
      .select("restaurant_id, total_price, delivery_status, created_at")
      .eq("supplier_id", supplierId)
      .neq("delivery_status", "cancelled")
      .gte("created_at", daysAgo(30))
      .order("created_at", { ascending: false });

    const buyerMap = new Map<
      string,
      { paniers: Set<string>; total: number; lastOrder: string }
    >();
    for (const order of orders ?? []) {
      const rid = (order as any).restaurant_id;
      if (!rid) continue;
      if (!buyerMap.has(rid)) {
        buyerMap.set(rid, {
          paniers: new Set<string>(),
          total: 0,
          lastOrder: (order as any).created_at,
        });
      }
      const b = buyerMap.get(rid)!;
      b.paniers.add(clePanier(order));
      b.total += (order as any).total_price || 0;
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
      const commandes = data.paniers.size;
      const repeatRate = Math.min(Math.round((commandes / 10) * 100), 100);
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(data.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
      );
      const churnRisk: BuyerSegment["churnRisk"] =
        daysSinceLastOrder > 20 ? "high" : daysSinceLastOrder > 10 ? "medium" : "low";
      return {
        id: rid,
        name: nameMap.get(rid) || "Restaurant " + rid.slice(0, 8),
        totalOrders: commandes,
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
      .select("id, category, cost_per_unit, price_per_unit")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    const productInfo = new Map<string, { category: string; cost: number; price: number }>();
    const categoryMap = new Map<string, { sales: number; cost: number; products: Set<string> }>();
    for (const p of products) {
      const cat = (p as any).category || "Général";
      const price = (p as any).price_per_unit || 0;
      productInfo.set((p as any).id, { category: cat, cost: effectiveCost((p as any).cost_per_unit, price), price });
      if (!categoryMap.has(cat)) categoryMap.set(cat, { sales: 0, cost: 0, products: new Set() });
      categoryMap.get(cat)!.products.add((p as any).id);
    }

    // Ventes par produit sur les 30 derniers jours.
    const { data: items } = await supabase
      .from(TABLE_VENTES)
      .select("product_id, quantity, total_price")
      .eq("supplier_id", supplierId)
      .neq("delivery_status", "cancelled")
      .gte("created_at", daysAgo(30));

    for (const item of items ?? []) {
      const info = productInfo.get((item as any).product_id);
      if (info && categoryMap.has(info.category)) {
        const agg = categoryMap.get(info.category)!;
        agg.sales += (item as any).total_price || 0;
        agg.cost += info.cost * (Number((item as any).quantity) || 0);
      }
    }

    const totalSales = Array.from(categoryMap.values()).reduce((s, cat) => s + cat.sales, 0);

    const result: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        salesPercent: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0,
        avgMargin: data.sales > 0 ? Math.max(0, Math.round(((data.sales - data.cost) / data.sales) * 100)) : 0,
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
      .from(TABLE_VENTES)
      .select("restaurant_id, total_price, delivery_status, created_at")
      .eq("supplier_id", supplierId)
      .neq("delivery_status", "cancelled")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    const velocityMap = new Map<string, { paniers: Set<string>; revenue: number }>();

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

      if (!velocityMap.has(dateKey))
        velocityMap.set(dateKey, { paniers: new Set<string>(), revenue: 0 });
      const v = velocityMap.get(dateKey)!;
      v.paniers.add(clePanier(order));
      v.revenue += (order as any).total_price || 0;
    }

    const result: SalesVelocity[] = Array.from(velocityMap.entries())
      .map(([date, data]) => ({
        date,
        orders: data.paniers.size,
        revenue: data.revenue,
        avgOrder: data.paniers.size > 0 ? Math.round(data.revenue / data.paniers.size) : 0,
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
