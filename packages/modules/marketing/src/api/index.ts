import { adsRoutes } from './ads';
import { couponValidateRoutes } from './coupon-validate';
import { couponsRoutes } from './coupons';
import { giftCardRoutes, giftCardPublicRoutes } from './gift-cards';
import { marketingRoutes } from './marketing';
import { smsRoutes } from './sms';

export { adsRoutes, couponValidateRoutes, couponsRoutes, giftCardRoutes, giftCardPublicRoutes, marketingRoutes, smsRoutes };

export const marketingApi = {
    marketingRoutes,
    adsRoutes,
    couponsRoutes,
    couponValidateRoutes,
    giftCardRoutes,
    giftCardPublicRoutes,
    smsRoutes,
};
