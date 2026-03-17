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
import { createClient } from "@supabase/supabase-js";

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Provide the general /admin/stats overview that was at the top-level of original admin.ts
adminRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const [
        { count: totalRestaurants },
        { count: activeRestaurants },
        { count: pendingRestaurants },
        { count: totalUsers },
        { count: countClients },
        { count: countMerchants },
        { count: countLivreurs },
        { data: newSupabaseRestaurants }
    ] = await Promise.all([
        supabase.from("restaurants").select("*", { count: "exact", head: true }),
        supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("is_published", false).eq("is_verified", false),

        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "merchant"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "livreur"),

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

    return c.json({
        restaurants: { 
            total: totalRestaurants || 0, 
            active: activeRestaurants || 0, 
            pending: pendingRestaurants || 0 
        },
        users: { 
            total: totalUsers || 0, 
            clients: countClients || 0,
            merchants: countMerchants || 0,
            livreurs: countLivreurs || 0
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
// For backward compatibility on /admin/audit
adminRoutes.route("/audit", adminSystemRoutes);
