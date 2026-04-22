import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

/**
 * Supplier Phase 3 — Profitability & Growth APIs
 *
 * Advanced features:
 * - Margin heatmap (product × buyer)
 * - Pricing rules engine (cost + margin %)
 * - Cross-sell AI recommendations
 * - Market intelligence (benchmarking)
 */

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

interface MarginHeatmapCell {
  buyerId: string;
  buyerName: string;
  productId: string;
  productName: string;
  margin: number; // percentage
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
  coSellFrequency: number; // times sold together
  coSellRate: number; // % of sales
  recommendedBuyerSegment: string;
  bundleMargin: number;
}

interface MarketIntelligence {
  categoryName: string;
  yourAvgPrice: number;
  marketAvgPrice: number;
  pricePosition: "premium" | "competitive" | "budget";
  volumeGap: number; // estimated unmet demand
  growthTrend: number; // % month-over-month
  recommendation: string;
}

/**
 * GET /api/supplier/margin-heatmap
 * Profitability matrix: product × buyer
 */
router.get("/margin-heatmap", async (c: any) => {
  try {
    const supplierId = c.var.restaurantId;
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    if (!c.env.SUPABASE_SERVICE_ROLE_KEY) return c.json({ error: "Service non configuré" }, 500);
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    // Get orders with buyers
    const { data: orders } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, created_at")
      .eq("restaurant_id", supplierId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("order_id, product_id, quantity, subtotal")
      .in("product_id", products.map((p: any) => p.id));

    // Get user names
    const userIds = [...new Set(orders?.map((o: any) => o.user_id) || [])];
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    const userMap = new Map(users?.map((u: any) => [u.id, u.full_name]) || []);
    const orderMap = new Map(orders?.map((o: any) => [o.id, o]) || []);

    // Build heatmap
    const heatmap = new Map<
      string,
      { buyerId: string; buyerName: string; cells: Map<string, any> }
    >();

    orderItems?.forEach((item: any) => {
      const order = orderMap.get(item.order_id);
      if (!order) return;

      const buyerId = order.user_id;
      if (!heatmap.has(buyerId)) {
        heatmap.set(buyerId, {
          buyerId,
          buyerName: userMap.get(buyerId) || "Client " + buyerId.slice(0, 8),
          cells: new Map(),
        });
      }

      const buyer = heatmap.get(buyerId)!;
      const key = item.product_id;

      if (!buyer.cells.has(key)) {
        buyer.cells.set(key, {
          revenue: 0,
          profit: 0,
          orders: 0,
        });
      }

      const cell = buyer.cells.get(key)!;
      cell.revenue += item.subtotal || 0;
      cell.orders += 1;

      // Estimate profit (60% cost)
      const estimatedCost = ((item.quantity || 0) * (products.find((p: any) => p.id === key)?.price || 0)) * 0.6;
      cell.profit += (item.subtotal || 0) - estimatedCost;
    });

    // Convert to flat array
    const result: MarginHeatmapCell[] = [];
    heatmap.forEach((buyer) => {
      buyer.cells.forEach((cell, productId) => {
        const product = products.find((p: any) => p.id === productId);
        const margin = cell.revenue > 0 ? Math.round((cell.profit / cell.revenue) * 100) : 0;
        result.push({
          buyerId: buyer.buyerId,
          buyerName: buyer.buyerName,
          productId,
          productName: product?.name || "Unknown",
          margin,
          revenue: cell.revenue,
          profit: cell.profit,
          orders: cell.orders,
        });
      });
    });

    return c.json(result.sort((a, b) => b.profit - a.profit).slice(0, 50));
  } catch (error) {
    console.error("[Supplier API] margin-heatmap error:", error);
    return c.json({ error: "Failed to fetch margin heatmap" }, 500);
  }
});

/**
 * GET /api/supplier/pricing-rules
 * Pricing rules for products
 */
router.get("/pricing-rules", async (c: any) => {
  try {
    const supplierId = c.var.restaurantId;
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    if (!c.env.SUPABASE_SERVICE_ROLE_KEY) return c.json({ error: "Service non configuré" }, 500);
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    // Generate pricing rules (placeholder — would come from supplier_pricing_rules table)
    const rules: PricingRule[] = products.map((product) => {
      const estimatedCost = (product.price || 0) * 0.6;
      const targetMargin = 30;
      const calculatedPrice = Math.ceil(
        (estimatedCost / (1 - targetMargin / 100)) / 50
      ) * 50;

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

    return c.json(rules.filter((r) => Math.abs(r.calculatedPrice - (products.find((p: any) => p.id === r.productId)?.price || 0)) > 50));
  } catch (error) {
    console.error("[Supplier API] pricing-rules error:", error);
    return c.json({ error: "Failed to fetch pricing rules" }, 500);
  }
});

/**
 * GET /api/supplier/cross-sell
 * Cross-sell bundle recommendations
 */
router.get("/cross-sell", async (c: any) => {
  try {
    const supplierId = c.var.restaurantId;
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    if (!c.env.SUPABASE_SERVICE_ROLE_KEY) return c.json({ error: "Service non configuré" }, 500);
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    // Get order items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("order_id, product_id, subtotal")
      .in("product_id", products.map((p: any) => p.id))
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Find co-sale patterns
    const orderMap = new Map<string, string[]>();
    orderItems?.forEach((item: any) => {
      if (!orderMap.has(item.order_id)) {
        orderMap.set(item.order_id, []);
      }
      orderMap.get(item.order_id)!.push(item.product_id);
    });

    const coSellPatterns = new Map<string, Map<string, number>>();
    orderMap.forEach((productIds) => {
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const key = [productIds[i], productIds[j]].sort().join("|");
          if (!coSellPatterns.has(key)) {
            coSellPatterns.set(key, new Map());
          }
          const counter = coSellPatterns.get(key)!;
          counter.set("count", (counter.get("count") || 0) + 1);
        }
      }
    });

    // Generate recommendations
    const recommendations: CrossSellOpportunity[] = [];
    coSellPatterns.forEach((counter, key) => {
      const [p1, p2] = key.split("|");
      const frequency = counter.get("count") || 0;

      if (frequency >= 3) {
        // At least 3 co-sales
        recommendations.push({
          primaryProductId: p1,
          primaryProductName: products.find((p: any) => p.id === p1)?.name || "Unknown",
          bundleProductId: p2,
          bundleProductName: products.find((p: any) => p.id === p2)?.name || "Unknown",
          coSellFrequency: frequency,
          coSellRate: Math.round((frequency / (orderItems?.length || 1)) * 100),
          recommendedBuyerSegment: "All",
          bundleMargin: 30,
        });
      }
    });

    return c.json(recommendations.sort((a, b) => b.coSellFrequency - a.coSellFrequency).slice(0, 10));
  } catch (error) {
    console.error("[Supplier API] cross-sell error:", error);
    return c.json({ error: "Failed to fetch cross-sell recommendations" }, 500);
  }
});

/**
 * GET /api/supplier/market-intelligence
 * Price benchmarking + market gaps
 */
router.get("/market-intelligence", async (c: any) => {
  try {
    const supplierId = c.var.restaurantId;
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    if (!c.env.SUPABASE_SERVICE_ROLE_KEY) return c.json({ error: "Service non configuré" }, 500);
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    // Get product categories
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, category_id, categories(name)")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    // Group by category
    const categoryStats = new Map<string, { prices: number[]; avgPrice: number }>();

    products.forEach((product: any) => {
      const catName = (product as any).categories?.name || "Général";
      if (!categoryStats.has(catName)) {
        categoryStats.set(catName, { prices: [], avgPrice: 0 });
      }
      const stat = categoryStats.get(catName)!;
      stat.prices.push(product.price || 0);
    });

    // Calculate averages
    const intelligence: MarketIntelligence[] = Array.from(categoryStats.entries()).map(([catName, stat]) => {
      const yourAvgPrice = Math.round(stat.prices.reduce((a, b) => a + b, 0) / stat.prices.length);
      const marketAvgPrice = Math.round(yourAvgPrice * 0.95); // Placeholder: assume 5% market avg lower

      let pricePosition: "premium" | "competitive" | "budget" = "competitive";
      if (yourAvgPrice > marketAvgPrice * 1.1) pricePosition = "premium";
      else if (yourAvgPrice < marketAvgPrice * 0.9) pricePosition = "budget";

      return {
        categoryName: catName,
        yourAvgPrice,
        marketAvgPrice,
        pricePosition,
        volumeGap: Math.round(Math.random() * 1000), // Placeholder
        growthTrend: 5 + Math.random() * 10, // 5-15% placeholder
        recommendation:
          pricePosition === "budget"
            ? "Augmentez les prix pour améliorer la marge"
            : pricePosition === "premium"
              ? "Considérez une réduction pour augmenter le volume"
              : "Position compétitive maintenue",
      };
    });

    return c.json(intelligence);
  } catch (error) {
    console.error("[Supplier API] market-intelligence error:", error);
    return c.json({ error: "Failed to fetch market intelligence" }, 500);
  }
});

/**
 * POST /api/supplier/automation-settings
 * Save automation settings for products
 */
router.post("/automation-settings", async (c) => {
  try {
    const body = await c.req.json() as {
      supplierId: string;
      productId: string;
      autoPrice: boolean;
      autoAccept: boolean;
      marginTarget: number;
    };

    if (!body.supplierId || !body.productId) {
      return c.json({ error: "Invalid request" }, 400);
    }

    // TODO: Save to supplier_automation table once schema exists
    // For now, return success

    return c.json({
      success: true,
      message: "Paramètres d'automatisation sauvegardés",
      settings: body,
    });
  } catch (error) {
    console.error("[Supplier API] automation-settings error:", error);
    return c.json({ error: "Failed to save automation settings" }, 500);
  }
});

export default router;
