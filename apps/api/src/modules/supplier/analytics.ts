import { Hono } from "hono";
import { createAdminClient } from "@kbouffe/module-core/api";
import type { Context } from "hono";

/**
 * Supplier Analytics Routes
 *
 * Provides metrics for suppliers:
 * - GET /api/supplier/metrics — Overview KPIs (total sales, margin %, customers)
 * - GET /api/supplier/products — Product performance (revenue, margin, units, ROI)
 * - GET /api/supplier/buyers — Buyer segments (repeat rate, LTV, churn)
 * - GET /api/supplier/categories — Category breakdown (sales %, growth)
 * - GET /api/supplier/sales-velocity — Orders trend (by day/week/month)
 * - GET /api/supplier/stock — Inventory levels + low stock alerts
 */

const router = new Hono();

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

/**
 * GET /api/supplier/metrics
 * Overview KPIs for supplier dashboard
 */
router.get("/metrics", async (c: Context) => {
  try {
    const supplierId = c.req.query("supplierId");
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const db = createAdminClient();

    // Get total sales & orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders } = await db
      .from("orders")
      .select("id, total_amount, restaurant_id, status, created_at")
      .eq("restaurant_id", supplierId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    const totalSales = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get unique customers
    const { data: customers } = await db
      .from("orders")
      .select("user_id")
      .eq("restaurant_id", supplierId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const uniqueCustomers = new Set(customers?.map((c) => c.user_id) || []).size;

    // Calculate average margin (placeholder: 25% default for now)
    const avgMargin = 25;

    const metrics: SupplierMetrics = {
      totalSales,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue),
      avgMargin,
      totalCustomers: uniqueCustomers,
      periodLabel: "30 derniers jours",
    };

    return c.json(metrics);
  } catch (error) {
    console.error("[Supplier API] metrics error:", error);
    return c.json({ error: "Failed to fetch metrics" }, 500);
  }
});

/**
 * GET /api/supplier/products
 * Product performance metrics
 */
router.get("/products", async (c: Context) => {
  try {
    const supplierId = c.req.query("supplierId");
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const db = createAdminClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get products for this supplier with order stats
    const { data: products } = await db
      .from("products")
      .select(
        `
        id,
        name,
        category_id,
        categories(name)
      `
      )
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    // Fetch order items for these products
    const productIds = products.map((p) => p.id);
    const { data: orderItems } = await db
      .from("order_items")
      .select("product_id, quantity, subtotal, created_at")
      .in("product_id", productIds)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const productStats = new Map<
      string,
      { revenue: number; units: number; trend: number }
    >();

    orderItems?.forEach((item) => {
      if (!productStats.has(item.product_id)) {
        productStats.set(item.product_id, { revenue: 0, units: 0, trend: 0 });
      }
      const stat = productStats.get(item.product_id)!;
      stat.revenue += item.subtotal || 0;
      stat.units += item.quantity || 0;
    });

    const result: ProductPerformance[] = products.map((p) => {
      const stat = productStats.get(p.id) || { revenue: 0, units: 0, trend: 0 };
      return {
        id: p.id,
        name: p.name,
        revenue: stat.revenue,
        unitsSold: stat.units,
        avgMargin: 25, // Placeholder
        roi: stat.units > 0 ? (stat.revenue / (stat.units * 100)) * 100 : 0, // Simple ROI calc
        trend: stat.trend > 0 ? "up" : stat.trend < 0 ? "down" : "flat",
        category: p.categories?.name || "Général",
      };
    });

    return c.json(result.sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    console.error("[Supplier API] products error:", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

/**
 * GET /api/supplier/buyers
 * Buyer segments with repeat rate, LTV, churn risk
 */
router.get("/buyers", async (c: Context) => {
  try {
    const supplierId = c.req.query("supplierId");
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const db = createAdminClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all orders from this supplier
    const { data: orders } = await db
      .from("orders")
      .select("user_id, total_amount, created_at")
      .eq("restaurant_id", supplierId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    const buyerMap = new Map<
      string,
      { orders: number; total: number; lastOrder: string; dates: string[] }
    >();

    orders?.forEach((order) => {
      if (!buyerMap.has(order.user_id)) {
        buyerMap.set(order.user_id, {
          orders: 0,
          total: 0,
          lastOrder: order.created_at,
          dates: [],
        });
      }
      const buyer = buyerMap.get(order.user_id)!;
      buyer.orders += 1;
      buyer.total += order.total_amount || 0;
      buyer.dates.push(order.created_at);
      buyer.lastOrder = order.created_at;
    });

    // Get user names
    const userIds = Array.from(buyerMap.keys());
    const { data: users } = await db
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    const userMap = new Map(users?.map((u) => [u.id, u.full_name]) || []);

    const result: BuyerSegment[] = Array.from(buyerMap.entries()).map(
      ([userId, data]) => {
        // Calculate repeat rate (how many times in 30 days)
        const repeatRate = Math.min(Math.round((data.orders / 10) * 100), 100); // Normalize to 0-100
        const ltv = data.total;

        // Churn risk based on days since last order
        const daysSinceLastOrder = Math.floor(
          (Date.now() - new Date(data.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
        );
        const churnRisk =
          daysSinceLastOrder > 20 ? "high" : daysSinceLastOrder > 10 ? "medium" : "low";

        return {
          id: userId,
          name: userMap.get(userId) || "Client " + userId.slice(0, 8),
          totalOrders: data.orders,
          repeatRate,
          ltv,
          churnRisk,
          lastOrderDate: data.lastOrder,
        };
      }
    );

    return c.json(result.sort((a, b) => b.ltv - a.ltv).slice(0, 20)); // Top 20 buyers
  } catch (error) {
    console.error("[Supplier API] buyers error:", error);
    return c.json({ error: "Failed to fetch buyers" }, 500);
  }
});

/**
 * GET /api/supplier/categories
 * Category performance breakdown
 */
router.get("/categories", async (c: Context) => {
  try {
    const supplierId = c.req.query("supplierId");
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const db = createAdminClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all products with categories
    const { data: products } = await db
      .from("products")
      .select("id, category_id, categories(name)")
      .eq("restaurant_id", supplierId);

    if (!products || products.length === 0) {
      return c.json([]);
    }

    const productIds = products.map((p) => p.id);

    // Get sales by product
    const { data: orderItems } = await db
      .from("order_items")
      .select("product_id, subtotal")
      .in("product_id", productIds)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const categoryMap = new Map<string, { sales: number; products: Set<string> }>();

    products.forEach((p) => {
      const catName = p.categories?.name || "Général";
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { sales: 0, products: new Set() });
      }
      categoryMap.get(catName)!.products.add(p.id);
    });

    orderItems?.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        const catName = product.categories?.name || "Général";
        const cat = categoryMap.get(catName);
        if (cat) {
          cat.sales += item.subtotal || 0;
        }
      }
    });

    const totalSales = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.sales,
      0
    );

    const result: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        salesPercent: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0,
        avgMargin: 25, // Placeholder
        growth: 5, // Placeholder: assume 5% growth
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
 * GET /api/supplier/sales-velocity
 * Orders trend over time (daily/weekly/monthly)
 */
router.get("/sales-velocity", async (c: Context) => {
  try {
    const supplierId = c.req.query("supplierId");
    const period = c.req.query("period") || "daily"; // daily, weekly, monthly

    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const db = createAdminClient();
    const daysBack = period === "monthly" ? 90 : period === "weekly" ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: orders } = await db
      .from("orders")
      .select("id, total_amount, created_at")
      .eq("restaurant_id", supplierId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    const velocityMap = new Map<string, { orders: number; revenue: number }>();

    orders?.forEach((order) => {
      let dateKey: string;

      if (period === "monthly") {
        dateKey = new Date(order.created_at).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "short",
        });
      } else if (period === "weekly") {
        const date = new Date(order.created_at);
        const weekNum = Math.floor(
          (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        dateKey = `Sem ${weekNum + 1}`;
      } else {
        dateKey = new Date(order.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        });
      }

      if (!velocityMap.has(dateKey)) {
        velocityMap.set(dateKey, { orders: 0, revenue: 0 });
      }
      const vel = velocityMap.get(dateKey)!;
      vel.orders += 1;
      vel.revenue += order.total_amount || 0;
    });

    const result: SalesVelocity[] = Array.from(velocityMap.entries())
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue,
        avgOrder: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
      }))
      .slice(-14); // Last 14 periods

    return c.json(result);
  } catch (error) {
    console.error("[Supplier API] sales-velocity error:", error);
    return c.json({ error: "Failed to fetch sales velocity" }, 500);
  }
});

/**
 * GET /api/supplier/stock
 * Inventory levels + low stock alerts
 */
router.get("/stock", async (c: Context) => {
  try {
    const supplierId = c.req.query("supplierId");
    if (!supplierId) {
      return c.json({ error: "supplierId required" }, 400);
    }

    const db = createAdminClient();

    // Get all products (NOTE: schema doesn't have stock levels yet)
    // This is a placeholder for future inventory feature
    const { data: products } = await db
      .from("products")
      .select("id, name, available_quantity")
      .eq("restaurant_id", supplierId)
      .lt("available_quantity", 50); // Low stock threshold

    return c.json({
      lowStockProducts: products || [],
      totalProducts: (await db.from("products").select("id").eq("restaurant_id", supplierId))
        .data?.length || 0,
    });
  } catch (error) {
    console.error("[Supplier API] stock error:", error);
    return c.json({ error: "Failed to fetch stock" }, 500);
  }
});

export default router;
