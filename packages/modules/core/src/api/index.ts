export * from "./types";
// export * from "./lib/db";
export * from "./lib/sms-queue";
export * from "./lib/tva";

import { authRoutes } from "./auth";
import { uploadRoutes } from "./upload";
import { usersRoutes, securityRoutes } from "./users";
import { storesRoutes } from "./stores";
import { brandsRoutes, restaurantKycRoutes, brandsAdminRoutes } from "./brands";
import { billingRoutes, adminBillingRoutes } from "./billing";

export { brandsRoutes, restaurantKycRoutes, brandsAdminRoutes };
export { billingRoutes, adminBillingRoutes };

export const coreApi = {
    authRoutes,
    uploadRoutes,
    usersRoutes,
    securityRoutes,
    storesRoutes,
    brandsRoutes,
    restaurantKycRoutes,
    brandsAdminRoutes,
    billingRoutes,
    adminBillingRoutes,
};
