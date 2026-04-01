import { ordersRoutes } from './orders';
import { paymentRoutes, paymentWebhookRoutes } from './payments';
import { zonesRoutes } from './zones';
import { caisseRoutes } from './caisse';

export { ordersRoutes, paymentRoutes, paymentWebhookRoutes, zonesRoutes, caisseRoutes };

export const ordersApi = {
    ordersRoutes,
    paymentRoutes,
    paymentWebhookRoutes,
    zonesRoutes,
    caisseRoutes,
};
