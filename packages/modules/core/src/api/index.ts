export * from "./types";
// export * from "./lib/db";
export * from "./lib/sms-queue";

import { authRoutes } from "./auth";
import { uploadRoutes } from "./upload";
import { usersRoutes, securityRoutes } from "./users";
import { storesRoutes } from "./stores";
import { brandsRoutes, restaurantKycRoutes, brandsAdminRoutes } from "./brands";

export { brandsRoutes, restaurantKycRoutes, brandsAdminRoutes };

export const coreApi = {
    authRoutes,
    uploadRoutes,
    usersRoutes,
    securityRoutes,
    storesRoutes,
    brandsRoutes,
    restaurantKycRoutes,
    brandsAdminRoutes,
};
