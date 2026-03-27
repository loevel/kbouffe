import { payoutsRoutes } from "./payouts";
import { teamRoutes } from "./team";

export { payoutsRoutes, teamRoutes };

export * from "./permissions";

export const hrApi = {
    payoutsRoutes,
    teamRoutes,
};
