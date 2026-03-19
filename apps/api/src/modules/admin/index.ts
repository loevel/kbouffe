import { Hono } from "hono";
import type { Env, Variables } from "../../types";
import { requireDomain } from "../../lib/admin-rbac";

import { adminUsersRoutes } from "./users";
import { adminRestaurantsRoutes } from "./restaurants";
import { adminSupportRoutes } from "./support";
import { adminBillingRoutes } from "./billing";
import { adminModerationRoutes } from "./moderation";
import { adminMarketingRoutes } from "./marketing";
import { adminSystemRoutes } from "./system";
import { adminOrdersRoutes } from "./orders";
import { adminCatalogRoutes } from "./catalog";
import { adminMarketplaceRoutes } from "./marketplace";
import { createClient } from "@supabase/supabase-js";

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminRoutes.get("/profile", async (c) => {
    return c.json({
        userId: c.get("userId"),
        adminRole: c.get("adminRole"),
    });
});

// Provide the general /admin/stats overview that was at the top-level of original admin.ts
adminRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const [
        { data: globalMetrics },
        { count: totalUsers },
        { count: countClients },
        { count: countMerchants },
        { count: countLivreurs },
        { data: newSupabaseRestaurants }
    ] = await Promise.all([
        supabase.from("platform_global_metrics").select("*").single(),

        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "merchant"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "driver"),

        supabase.from("restaurants")
            .select("id, name, is_published, created_at")
            .order("created_at", { ascending: false })
            .limit(5)
    ]);

    const newRestaurants = (newSupabaseRestaurants || []).map(r => ({
        id: r.id,
        name: r.name,
        isActive: r.is_published,
        createdAt: r.created_at
    }));

    const metrics = globalMetrics || { 
        total_restaurants: 0, 
        active_restaurants: 0, 
        total_gmv: 0, 
        total_orders: 0, 
        total_unique_customers: 0 
    };

    return c.json({
        restaurants: { 
            total: metrics.total_restaurants, 
            active: metrics.active_restaurants, 
            pending: metrics.total_restaurants - metrics.active_restaurants
        },
        users: { 
            total: totalUsers || 0, 
            customers: countClients || 0,
            merchants: countMerchants || 0,
            drivers: countLivreurs || 0
        },
        metrics: {
            gmv: metrics.total_gmv,
            totalOrders: metrics.total_orders,
            totalCustomers: metrics.total_unique_customers,
            avgOrderValue: metrics.total_orders > 0 ? Math.round(metrics.total_gmv / metrics.total_orders) : 0
        },
        recentActivity: { newRestaurants }
    });
});

// Mount the sub-routes
adminRoutes.route("/users", adminUsersRoutes);
adminRoutes.route("/restaurants", adminRestaurantsRoutes);
// adminRoutes.route("/drivers", adminDriversRoutes); // Decommissioned legacy global drivers
adminRoutes.route("/support", adminSupportRoutes);
adminRoutes.route("/billing", adminBillingRoutes);
adminRoutes.route("/moderation", adminModerationRoutes);
adminRoutes.route("/marketing", adminMarketingRoutes);
adminRoutes.route("/system", adminSystemRoutes);
adminRoutes.route("/orders", adminOrdersRoutes);
adminRoutes.route("/catalog", adminCatalogRoutes);
adminRoutes.route("/marketplace", adminMarketplaceRoutes);
// For backward compatibility on /admin/audit
adminRoutes.route("/audit", adminSystemRoutes);
