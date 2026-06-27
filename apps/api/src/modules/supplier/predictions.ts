import { Hono } from "hono";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

/**
 * Supplier Predictions & Automation Routes
 *
 * Demand forecasting, price optimization, margin alerts and COGS tracking for
 * the marketplace supplier dashboard. The supplier is resolved from the
 * authenticated user (suppliers.user_id); data comes from supplier_products /
 * supplier_order_items.
 *
 * NOTE: supplier_products has no real cost column yet, so cost is estimated at
 * 60% of the selling price (a heuristic) for margin/COGS calculations.
 */

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const COST_RATIO = 0.6; // fallback when cost_per_unit is not set

/** Real unit cost when known, else a 60% heuristic of the selling price. */
function effectiveCost(costPerUnit: number | null | undefined, price: number): number {
  return costPerUnit != null ? costPerUnit : price * COST_RATIO;
}

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
  confidence: number; // 0-100
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

/** Aggregate supplier_order_items (revenue + units) per product for a supplier. */
async function productSales(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Map<string, { revenue: number; units: number }>> {
  const stats = new Map<string, { revenue: number; units: number }>();
  if (productIds.length === 0) return stats;
  const { data: items } = await supabase
    .from("supplier_order_items")
    .select("product_id, quantity, total_price, created_at")
    .in("product_id", productIds)
    .gte("created_at", daysAgo(30));
  for (const item of items ?? []) {
    const pid = (item as any).product_id;
    if (!pid) continue;
    if (!stats.has(pid)) stats.set(pid, { revenue: 0, units: 0 });
    const s = stats.get(pid)!;
    s.revenue += (item as any).total_price || 0;
    s.units += Number((item as any).quantity) || 0;
  }
  return stats;
}

/**
 * GET /api/supplier/forecast — 30-day demand forecast + reorder suggestions
 */
router.get("/forecast", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, available_quantity, stock_quantity")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    const productIds = products.map((p: any) => p.id);
    const { data: orderItems } = await supabase
      .from("supplier_order_items")
      .select("product_id, quantity, created_at")
      .in("product_id", productIds)
      .gte("created_at", daysAgo(30));

    const productDemand = new Map<string, number>();
    for (const item of orderItems ?? []) {
      const pid = (item as any).product_id;
      productDemand.set(pid, (productDemand.get(pid) || 0) + (Number((item as any).quantity) || 1));
    }

    const forecasts: DemandForecast[] = products.map((product: any) => {
      const totalQty = productDemand.get(product.id) || 0;
      const avgPerDay = totalQty / 30;
      const stock = Number(product.available_quantity ?? product.stock_quantity ?? 0);
      const forecast30d = Math.ceil(avgPerDay * 30);
      const suggestedQty = Math.max(forecast30d - stock, 0);
      const daysUntilStockout = avgPerDay > 0 ? Math.floor(stock / avgPerDay) : 999;

      let urgency: "low" | "medium" | "high" = "low";
      if (daysUntilStockout < 7) urgency = "high";
      else if (daysUntilStockout < 14) urgency = "medium";

      return {
        productId: product.id,
        productName: product.name,
        currentStock: stock,
        historicalAvgPerDay: Math.round(avgPerDay * 10) / 10,
        forecast30d,
        suggestedReorderQty: suggestedQty,
        reorderUrgency: urgency,
        daysUntilStockout: Math.max(daysUntilStockout, 0),
      };
    });

    return c.json(forecasts.filter((f) => f.reorderUrgency !== "low"));
  } catch (error) {
    console.error("[Supplier API] forecast error:", error);
    return c.json({ error: "Failed to fetch forecast" }, 500);
  }
});

/**
 * GET /api/supplier/price-suggestions — price recos based on a target margin
 */
router.get("/price-suggestions", async (c: any) => {
  try {
    const targetMargin = parseFloat(c.req.query("targetMargin") || "30");
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, price_per_unit, cost_per_unit")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    const suggestions: PriceRecommendation[] = products.map((product: any) => {
      const price = product.price_per_unit || 0;
      const estimatedCost = effectiveCost(product.cost_per_unit, price);
      const suggestedPrice = Math.ceil((estimatedCost / (1 - targetMargin / 100)) / 50) * 50;
      const priceDelta = suggestedPrice - price;
      const estimatedMargin =
        suggestedPrice > 0 ? Math.round(((suggestedPrice - estimatedCost) / suggestedPrice) * 100) : 0;

      return {
        productId: product.id,
        productName: product.name,
        currentPrice: price,
        suggestedPrice,
        priceDelta,
        targetMarginPercent: targetMargin,
        estimatedMargin,
        confidence: 65,
      };
    });

    return c.json(suggestions.filter((s) => Math.abs(s.priceDelta) > 100));
  } catch (error) {
    console.error("[Supplier API] price-suggestions error:", error);
    return c.json({ error: "Failed to fetch price suggestions" }, 500);
  }
});

/**
 * GET /api/supplier/margin-alerts — products selling below the target margin
 */
router.get("/margin-alerts", async (c: any) => {
  try {
    const targetMargin = parseFloat(c.req.query("targetMargin") || "30");
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const { data: products } = await supabase
      .from("supplier_products")
      .select("id, name, price_per_unit, cost_per_unit")
      .eq("supplier_id", supplierId);

    if (!products || products.length === 0) return c.json([]);

    const stats = await productSales(supabase, products.map((p: any) => p.id));

    const alerts: MarginAlert[] = products
      .map((product: any): MarginAlert | null => {
        const stat = stats.get(product.id);
        if (!stat || stat.units === 0) return null;

        const estimatedCost = effectiveCost(product.cost_per_unit, product.price_per_unit || 0);
        const avgPrice = stat.revenue / stat.units;
        if (avgPrice <= 0) return null;
        const currentMargin = Math.round(((avgPrice - estimatedCost) / avgPrice) * 100);

        if (currentMargin >= targetMargin) return null;

        return {
          productId: product.id,
          productName: product.name,
          currentMargin,
          targetMargin,
          daysAboveTarget: 0,
          recommendation:
            currentMargin < targetMargin - 10
              ? `Augmenter le prix de ${Math.ceil(((targetMargin - currentMargin) / 100) * 200)} FCFA`
              : "Surveiller la marge",
          severity:
            currentMargin < targetMargin - 15
              ? "critical"
              : currentMargin < targetMargin - 5
                ? "warning"
                : "info",
        };
      })
      .filter((a): a is MarginAlert => a !== null);

    return c.json(alerts);
  } catch (error) {
    console.error("[Supplier API] margin-alerts error:", error);
    return c.json({ error: "Failed to fetch margin alerts" }, 500);
  }
});

/**
 * GET /api/supplier/cogs-analysis — COGS + margin breakdown (estimated cost)
 */
router.get("/cogs-analysis", async (c: any) => {
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

    const stats = await productSales(supabase, products.map((p: any) => p.id));

    const analysis: CogsPriceData[] = products
      .map((product: any): CogsPriceData | null => {
        const stat = stats.get(product.id);
        if (!stat || stat.units === 0) return null;

        const price = product.price_per_unit || 0;
        const costPerUnit = effectiveCost(product.cost_per_unit, price);
        const totalCost = costPerUnit * stat.units;
        const totalProfit = stat.revenue - totalCost;
        const marginPercent = stat.revenue > 0 ? Math.round((totalProfit / stat.revenue) * 100) : 0;

        return {
          productId: product.id,
          productName: product.name,
          costPerUnit: Math.round(costPerUnit),
          sellingPrice: price,
          unitsSoldLast30d: stat.units,
          totalRevenue: Math.round(stat.revenue),
          totalCost: Math.round(totalCost),
          totalProfit: Math.round(totalProfit),
          marginPercent,
          roiPercent: totalCost > 0 ? Math.round((totalProfit / totalCost) * 100) : 0,
        };
      })
      .filter((a): a is CogsPriceData => a !== null)
      .sort((a, b) => b.totalProfit - a.totalProfit);

    return c.json(analysis);
  } catch (error) {
    console.error("[Supplier API] cogs-analysis error:", error);
    return c.json({ error: "Failed to fetch COGS analysis" }, 500);
  }
});

/**
 * POST /api/supplier/apply-price-change — bulk update supplier product prices
 */
router.post("/apply-price-change", async (c: any) => {
  try {
    const supabase = db(c);
    if (!supabase) return c.json({ error: "Service non configuré" }, 500);
    const supplierId = await resolveSupplierId(c, supabase);
    if (!supplierId) return c.json({ error: "Fournisseur introuvable" }, 404);

    const body = (await c.req.json()) as {
      products: Array<{ productId: string; newPrice: number }>;
    };
    if (!body.products || body.products.length === 0) {
      return c.json({ error: "Invalid request" }, 400);
    }

    // Scope every update to this supplier's products (anti-IDOR).
    const updates = body.products.map((p) =>
      supabase
        .from("supplier_products")
        .update({ price_per_unit: p.newPrice, updated_at: new Date().toISOString() })
        .eq("id", p.productId)
        .eq("supplier_id", supplierId)
    );

    const results = await Promise.all(updates);
    const successful = results.filter((r) => !r.error).length;

    return c.json({
      success: true,
      totalRequested: body.products.length,
      successful,
      message: `${successful}/${body.products.length} prix mises à jour`,
    });
  } catch (error) {
    console.error("[Supplier API] apply-price-change error:", error);
    return c.json({ error: "Failed to apply price changes" }, 500);
  }
});

export default router;
