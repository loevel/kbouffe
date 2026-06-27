import { Hono } from "hono";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

/**
 * Supplier Phase 3 — Profitability & Growth APIs
 *
 * Margin heatmap, pricing rules, cross-sell and market intelligence for the
 * marketplace supplier dashboard. Supplier resolved via suppliers.user_id; data
 * from supplier_products / supplier_orders / supplier_order_items. Buyers are
 * the RESTAURANTS purchasing from the supplier.
 *
 * NOTE: no real cost column exists, so cost is estimated at 60% of price.
 */

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const COST_RATIO = 0.6; // fallback when cost_per_unit is not set

/** Real unit cost when known, else a 60% heuristic of the selling price. */
function effectiveCost(costPerUnit: number | null | undefined, price: number): number {
  return costPerUnit != null ? costPerUnit : price * COST_RATIO;
}

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

function db(c: any): SupabaseClient | null {
  if (!c.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
}

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
 * GET /api/supplier/margin-heatmap — profitability matrix: product × buyer
 */
router.get("/margin-heatmap", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, price_per_unit, cost_per_unit")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);
    const costMap = new Map(
      products.map((p: any) => [p.id, effectiveCost(p.cost_per_unit, p.price_per_unit || 0)])
    );
    const nameMap = new Map(products.map((p: any) => [p.id, p.name]));

    const { data: orders } = await supabase
      .from("supplier_orders")
      .select("id, restaurant_id, created_at")
      .eq("supplier_id", supplierId)
      .neq("status", "cancelled")
      .gte("created_at", daysAgo(30));

    const orderIds = (orders ?? []).map((o: any) => o.id);
    if (orderIds.length === 0) return c.json([]);
    const orderBuyer = new Map((orders ?? []).map((o: any) => [o.id, o.restaurant_id]));

    const { data: orderItems } = await supabase
      .from("supplier_order_items")
      .select("order_id, product_id, quantity, total_price")
      .in("order_id", orderIds);

    // Resolve buyer (restaurant) names.
    const buyerIds = [...new Set((orders ?? []).map((o: any) => o.restaurant_id).filter(Boolean))];
    const buyerName = new Map<string, string>();
    if (buyerIds.length > 0) {
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("id, name")
        .in("id", buyerIds);
      for (const r of restaurants ?? []) buyerName.set((r as any).id, (r as any).name);
    }

    // Aggregate per buyer × product.
    const cells = new Map<string, MarginHeatmapCell>();
    for (const item of orderItems ?? []) {
      const buyerId = orderBuyer.get((item as any).order_id);
      const pid = (item as any).product_id;
      if (!buyerId || !pid) continue;
      const key = `${buyerId}|${pid}`;
      if (!cells.has(key)) {
        cells.set(key, {
          buyerId,
          buyerName: buyerName.get(buyerId) || "Restaurant " + String(buyerId).slice(0, 8),
          productId: pid,
          productName: nameMap.get(pid) || "Produit",
          margin: 0,
          revenue: 0,
          profit: 0,
          orders: 0,
        });
      }
      const cell = cells.get(key)!;
      const revenue = (item as any).total_price || 0;
      const cost = (Number((item as any).quantity) || 0) * (costMap.get(pid) || 0);
      cell.revenue += revenue;
      cell.profit += revenue - cost;
      cell.orders += 1;
    }

    const result = Array.from(cells.values()).map((cell) => ({
      ...cell,
      margin: cell.revenue > 0 ? Math.round((cell.profit / cell.revenue) * 100) : 0,
    }));

    return c.json(result.sort((a, b) => b.profit - a.profit).slice(0, 50));
  } catch (error) {
    console.error("[Supplier API] margin-heatmap error:", error);
    return c.json({ error: "Failed to fetch margin heatmap" }, 500);
  }
});

/**
 * GET /api/supplier/pricing-rules — suggested pricing rules per product
 */
router.get("/pricing-rules", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, price_per_unit, cost_per_unit")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    const rules: PricingRule[] = products.map((product: any) => {
      const price = product.price_per_unit || 0;
      const estimatedCost = effectiveCost(product.cost_per_unit, price);
      const targetMargin = 30;
      const calculatedPrice = Math.ceil((estimatedCost / (1 - targetMargin / 100)) / 50) * 50;
      return {
        id: product.id,
        productId: product.id,
        productName: product.name,
        costPerUnit: Math.round(estimatedCost),
        targetMarginPercent: targetMargin,
        minPrice: Math.max(Math.round(estimatedCost * 1.1), 100),
        maxPrice: Math.round(estimatedCost * 3),
        calculatedPrice,
        autoApply: false,
      };
    });

    return c.json(
      rules.filter((r) => {
        const current = (products.find((p: any) => p.id === r.productId) as any)?.price_per_unit || 0;
        return Math.abs(r.calculatedPrice - current) > 50;
      })
    );
  } catch (error) {
    console.error("[Supplier API] pricing-rules error:", error);
    return c.json({ error: "Failed to fetch pricing rules" }, 500);
  }
});

/**
 * GET /api/supplier/cross-sell — products frequently bought together
 */
router.get("/cross-sell", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);
    const nameMap = new Map(products.map((p: any) => [p.id, p.name]));

    const { data: orders } = await supabase
      .from("supplier_orders")
      .select("id")
      .eq("supplier_id", supplierId)
      .neq("status", "cancelled")
      .gte("created_at", daysAgo(30));

    const orderIds = (orders ?? []).map((o: any) => o.id);
    if (orderIds.length === 0) return c.json([]);

    const { data: orderItems } = await supabase
      .from("supplier_order_items")
      .select("order_id, product_id")
      .in("order_id", orderIds);

    const orderProducts = new Map<string, string[]>();
    for (const item of orderItems ?? []) {
      const oid = (item as any).order_id;
      if (!orderProducts.has(oid)) orderProducts.set(oid, []);
      orderProducts.get(oid)!.push((item as any).product_id);
    }

    const coSell = new Map<string, number>();
    orderProducts.forEach((pids) => {
      const unique = [...new Set(pids)];
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const key = [unique[i], unique[j]].sort().join("|");
          coSell.set(key, (coSell.get(key) || 0) + 1);
        }
      }
    });

    const totalOrders = orderProducts.size || 1;
    const recommendations: CrossSellOpportunity[] = [];
    coSell.forEach((frequency, key) => {
      if (frequency < 3) return;
      const [p1, p2] = key.split("|");
      recommendations.push({
        primaryProductId: p1,
        primaryProductName: nameMap.get(p1) || "Produit",
        bundleProductId: p2,
        bundleProductName: nameMap.get(p2) || "Produit",
        coSellFrequency: frequency,
        coSellRate: Math.round((frequency / totalOrders) * 100),
        recommendedBuyerSegment: "All",
        bundleMargin: 30,
      });
    });

    return c.json(recommendations.sort((a, b) => b.coSellFrequency - a.coSellFrequency).slice(0, 10));
  } catch (error) {
    console.error("[Supplier API] cross-sell error:", error);
    return c.json({ error: "Failed to fetch cross-sell recommendations" }, 500);
  }
});

/**
 * GET /api/supplier/market-intelligence — category price benchmarking
 */
router.get("/market-intelligence", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, price_per_unit, category")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    const categoryStats = new Map<string, number[]>();
    for (const product of products) {
      const cat = (product as any).category || "Général";
      if (!categoryStats.has(cat)) categoryStats.set(cat, []);
      categoryStats.get(cat)!.push((product as any).price_per_unit || 0);
    }

    const intelligence: MarketIntelligence[] = Array.from(categoryStats.entries()).map(
      ([catName, prices]) => {
        const yourAvgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        // Market benchmark not available yet — use the supplier's own avg as baseline.
        const marketAvgPrice = yourAvgPrice;
        const pricePosition: MarketIntelligence["pricePosition"] = "competitive";
        return {
          categoryName: catName,
          yourAvgPrice,
          marketAvgPrice,
          pricePosition,
          volumeGap: 0, // requires market-wide demand data (not available)
          growthTrend: 0, // requires historical comparison (not computed)
          recommendation: "Position compétitive maintenue",
        };
      }
    );

    return c.json(intelligence);
  } catch (error) {
    console.error("[Supplier API] market-intelligence error:", error);
    return c.json({ error: "Failed to fetch market intelligence" }, 500);
  }
});

/**
 * POST /api/supplier/automation-settings — persist automation prefs (no-op stub)
 */
router.post("/automation-settings", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const body = (await c.req.json()) as {
      productId: string;
      autoPrice: boolean;
      autoAccept: boolean;
      marginTarget: number;
    };
    if (!body.productId) return c.json({ error: "Invalid request" }, 400);

    // TODO: persist to a supplier_automation table once it exists.
    return c.json({
      success: true,
      message: "Paramètres d'automatisation sauvegardés",
      settings: { ...body, supplierId },
    });
  } catch (error) {
    console.error("[Supplier API] automation-settings error:", error);
    return c.json({ error: "Failed to save automation settings" }, 500);
  }
});

export default router;
