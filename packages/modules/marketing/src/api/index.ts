import { adsRoutes } from './ads';
import { couponValidateRoutes } from './coupon-validate';
import { couponsRoutes } from './coupons';
import { emailTemplatesRoutes } from './email-templates';
import { giftCardRoutes, giftCardPublicRoutes } from './gift-cards';
import { marketingRoutes } from './marketing';
import { smsRoutes } from './sms';

export { adsRoutes, couponValidateRoutes, couponsRoutes, emailTemplatesRoutes, giftCardRoutes, giftCardPublicRoutes, marketingRoutes, smsRoutes };

export const marketingApi = {
    marketingRoutes,
    adsRoutes,
    couponsRoutes,
    couponValidateRoutes,
    emailTemplatesRoutes,
    giftCardRoutes,
    giftCardPublicRoutes,
    smsRoutes,
};
