import { ordersRoutes } from './orders';
import { paymentRoutes, paymentWebhookRoutes } from './payments';
import { zonesRoutes } from './zones';

export { ordersRoutes, paymentRoutes, paymentWebhookRoutes, zonesRoutes };

export const ordersApi = {
    ordersRoutes,
    paymentRoutes,
    paymentWebhookRoutes,
    zonesRoutes,
};
