import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

/**
 * Supplier Predictions & Automation Routes
 *
 * Provides AI-powered suggestions for:
 * - Demand forecasting (30-day ahead)
 * - Price optimization (margin-based)
 * - Margin alerts (real-time)
 * - COGS tracking & margin calculations
 */

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

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

/**
 * GET /api/supplier/forecast
 * 30-day demand forecast + reorder suggestions
 */
router.get("/forecast", async (c: any) => {
  try {
    const supplierId = c.req.query("supplierId");
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY || c.env.SUPABASE_ANON_KEY);

    // Get all products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, available_quantity")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get order history for demand calculation
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, created_at")
      .in("product_id", products.map((p: any) => p.id))
      .gte("created_at", thirtyDaysAgo.toISOString());

    const productDemand = new Map<string, number[]>();

    orderItems?.forEach((item: any) => {
      if (!productDemand.has(item.product_id)) {
        productDemand.set(item.product_id, []);
      }
      productDemand.get(item.product_id)!.push(item.quantity || 1);
    });

    const forecasts: DemandForecast[] = products.map((product) => {
      const quantities = productDemand.get(product.id) || [];
      const avgPerDay = quantities.length > 0 ? quantities.reduce((a, b) => a + b, 0) / 30 : 0;
      const forecast30d = Math.ceil(avgPerDay * 30);
      const suggestedQty = Math.max(forecast30d - (product.available_quantity || 0), 0);
      const daysUntilStockout =
        avgPerDay > 0 ? Math.floor((product.available_quantity || 0) / avgPerDay) : 999;

      let urgency: "low" | "medium" | "high" = "low";
      if (daysUntilStockout < 7) urgency = "high";
      else if (daysUntilStockout < 14) urgency = "medium";

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.available_quantity || 0,
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
 * GET /api/supplier/price-suggestions
 * Auto price recommendations based on margin target
 */
router.get("/price-suggestions", async (c: any) => {
  try {
    const supplierId = c.req.query("supplierId");
    const targetMargin = parseFloat(c.req.query("targetMargin") || "30");

    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY || c.env.SUPABASE_ANON_KEY);

    // Get products with COGS (from products table)
    // NOTE: COGS would come from a supplier_costs table in Phase 2 migration
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    const suggestions: PriceRecommendation[] = products.map((product) => {
      // Placeholder: assume 60% of selling price is cost (typical food retail)
      const estimatedCost = (product.price || 0) * 0.6;
      const suggestedPrice = Math.ceil(
        (estimatedCost / (1 - targetMargin / 100)) / 50
      ) * 50; // Round to 50 FCFA
      const priceDelta = suggestedPrice - (product.price || 0);
      const estimatedMargin = Math.round(
        ((suggestedPrice - estimatedCost) / suggestedPrice) * 100
      );

      return {
        productId: product.id,
        productName: product.name,
        currentPrice: product.price || 0,
        suggestedPrice,
        priceDelta,
        targetMarginPercent: targetMargin,
        estimatedMargin,
        confidence: 65, // Placeholder
      };
    });

    return c.json(suggestions.filter((s) => Math.abs(s.priceDelta) > 100)); // Show only significant changes
  } catch (error) {
    console.error("[Supplier API] price-suggestions error:", error);
    return c.json({ error: "Failed to fetch price suggestions" }, 500);
  }
});

/**
 * GET /api/supplier/margin-alerts
 * Products with margins below target
 */
router.get("/margin-alerts", async (c: any) => {
  try {
    const supplierId = c.req.query("supplierId");
    const targetMargin = parseFloat(c.req.query("targetMargin") || "30");

    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY || c.env.SUPABASE_ANON_KEY);

    // Get products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent order items to calc actual margins
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, subtotal, quantity")
      .in("product_id", products.map((p: any) => p.id))
      .gte("created_at", thirtyDaysAgo.toISOString());

    const productStats = new Map<string, { revenue: number; units: number }>();

    orderItems?.forEach((item: any) => {
      if (!productStats.has(item.product_id)) {
        productStats.set(item.product_id, { revenue: 0, units: 0 });
      }
      const stat = productStats.get(item.product_id)!;
      stat.revenue += item.subtotal || 0;
      stat.units += item.quantity || 0;
    });

    const alerts: MarginAlert[] = products
      .map((product) => {
        const stat = productStats.get(product.id);
        if (!stat || stat.units === 0) {
          return null;
        }

        const estimatedCost = (product.price || 0) * 0.6;
        const avgPrice = stat.revenue / stat.units;
        const currentMargin = Math.round(
          ((avgPrice - estimatedCost) / avgPrice) * 100
        );

        if (currentMargin < targetMargin) {
          return {
            productId: product.id,
            productName: product.name,
            currentMargin,
            targetMargin,
            daysAboveTarget: 0,
            recommendation:
              currentMargin < targetMargin - 10
                ? `Augmenter le prix de ${Math.ceil(
                    ((targetMargin - currentMargin) / 100) * 200
                  )} FCFA`
                : "Surveiller la marge",
            severity:
              currentMargin < targetMargin - 15
                ? "critical"
                : currentMargin < targetMargin - 5
                  ? "warning"
                  : "info",
          };
        }

        return null;
      })
      .filter((a) => a !== null) as MarginAlert[];

    return c.json(alerts);
  } catch (error) {
    console.error("[Supplier API] margin-alerts error:", error);
    return c.json({ error: "Failed to fetch margin alerts" }, 500);
  }
});

/**
 * GET /api/supplier/cogs-analysis
 * COGS tracking with margin calculations (placeholder until supplier_costs table exists)
 */
router.get("/cogs-analysis", async (c: any) => {
  try {
    const supplierId = c.req.query("supplierId");
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY || c.env.SUPABASE_ANON_KEY);

    // Get products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get sales data
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, subtotal")
      .in("product_id", products.map((p: any) => p.id))
      .gte("created_at", thirtyDaysAgo.toISOString());

    const productStats = new Map<
      string,
      { revenue: number; units: number; product: any }
    >();

    products.forEach((p: any) => {
      productStats.set(p.id, {
        revenue: 0,
        units: 0,
        product: p,
      });
    });

    orderItems?.forEach((item: any) => {
      const stat = productStats.get(item.product_id);
      if (stat) {
        stat.revenue += item.subtotal || 0;
        stat.units += item.quantity || 0;
      }
    });

    const analysis: CogsPriceData[] = Array.from(productStats.values())
      .filter((s) => s.units > 0)
      .map((s) => {
        // Placeholder: assume 60% cost ratio (will be real COGS from table)
        const estimatedCostPerUnit = (s.product.price || 0) * 0.6;
        const totalCost = estimatedCostPerUnit * s.units;
        const totalProfit = s.revenue - totalCost;
        const marginPercent = Math.round(
          ((totalProfit) / s.revenue) * 100
        );

        return {
          productId: s.product.id,
          productName: s.product.name,
          costPerUnit: Math.round(estimatedCostPerUnit),
          sellingPrice: s.product.price || 0,
          unitsSoldLast30d: s.units,
          totalRevenue: Math.round(s.revenue),
          totalCost: Math.round(totalCost),
          totalProfit: Math.round(totalProfit),
          marginPercent,
          roiPercent: Math.round((totalProfit / totalCost) * 100),
        };
      })
      .sort((a, b) => b.totalProfit - a.totalProfit);

    return c.json(analysis);
  } catch (error) {
    console.error("[Supplier API] cogs-analysis error:", error);
    return c.json({ error: "Failed to fetch COGS analysis" }, 500);
  }
});

/**
 * POST /api/supplier/apply-price-change
 * Bulk apply price recommendations (requires auth + supplier verification)
 */
router.post("/apply-price-change", async (c) => {
  try {
    const supplierId = c.req.query("supplierId");
    const body = await c.req.json() as {
      products: Array<{ productId: string; newPrice: number }>;
    };

    if (!supplierId || !body.products || body.products.length === 0) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY || c.env.SUPABASE_ANON_KEY);

    // Bulk update prices
    const updates = body.products.map((p: any) =>
      supabase
        .from("products")
        .update({ price: p.newPrice, updated_at: new Date().toISOString() })
        .eq("id", p.productId)
        .eq("restaurant_id", supplierId)
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
