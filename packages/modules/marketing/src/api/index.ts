import { adsRoutes } from './ads';
import { couponValidateRoutes } from './coupon-validate';
import { couponsRoutes } from './coupons';
import { marketingRoutes } from './marketing';
import { smsRoutes } from './sms';

export { adsRoutes, couponValidateRoutes, couponsRoutes, marketingRoutes, smsRoutes };

export const marketingApi = {
    marketingRoutes,
    adsRoutes,
    couponsRoutes,
    couponValidateRoutes,
    smsRoutes,
};
