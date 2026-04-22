import { Hono } from "hono";
import type { Env, Variables } from "../../types";

import { adminUsersRoutes } from "./users";
import { restaurantsCrudRoutes } from "./restaurants-crud";
import { restaurantsKycRoutes } from "./restaurants-kyc";
import { restaurantsModerationRoutes } from "./restaurants-moderation";
import { adminSupportRoutes } from "./support";
import { adminBillingRoutes } from "./billing";
import { adminModerationRoutes } from "./moderation";
import { adminMarketingRoutes } from "./marketing";
import { adminSystemRoutes } from "./system";
import { adminOrdersRoutes } from "./orders";
import { adminCatalogRoutes } from "./catalog";
import { adminMarketplaceRoutes } from "./marketplace";
import { adminBackupRoutes } from "./backup";
import { adminAiUsageRoutes } from "./ai-usage";
import { adminSubscriptionsRoutes } from "./subscriptions";
import { adminOnboardingRoutes } from "./onboarding";
import { adminSocialMonitorRoutes } from "./social-monitor";
import { adminCopilotRoutes } from "./copilot";
import { adminStatsRoutes } from "./stats";

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminRoutes.get("/profile", async (c) => {
    return c.json({
        userId: c.get("userId"),
        adminRole: c.get("adminRole"),
    });
});

// Mount sub-routes
adminRoutes.route("/stats", adminStatsRoutes);
adminRoutes.route("/users", adminUsersRoutes);
adminRoutes.route("/restaurants", restaurantsCrudRoutes);
adminRoutes.route("/restaurants", restaurantsKycRoutes);
adminRoutes.route("/restaurants", restaurantsModerationRoutes);
// adminRoutes.route("/drivers", adminDriversRoutes); // Decommissioned legacy global drivers
adminRoutes.route("/support", adminSupportRoutes);
adminRoutes.route("/billing", adminBillingRoutes);
adminRoutes.route("/moderation", adminModerationRoutes);
adminRoutes.route("/marketing", adminMarketingRoutes);
adminRoutes.route("/system", adminSystemRoutes);
adminRoutes.route("/backup", adminBackupRoutes);
adminRoutes.route("/orders", adminOrdersRoutes);
adminRoutes.route("/catalog", adminCatalogRoutes);
adminRoutes.route("/marketplace", adminMarketplaceRoutes);
adminRoutes.route("/ai-usage", adminAiUsageRoutes);
adminRoutes.route("/subscriptions", adminSubscriptionsRoutes);
adminRoutes.route("/onboarding", adminOnboardingRoutes);
adminRoutes.route("/social-monitor", adminSocialMonitorRoutes);
adminRoutes.route("/copilot", adminCopilotRoutes);
// For backward compatibility on /admin/audit
adminRoutes.route("/audit", adminSystemRoutes);
