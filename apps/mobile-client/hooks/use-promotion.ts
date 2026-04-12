/**
 * Promotion hook — extracted from loyalty-context.
 * Handles coupon/promo code validation.
 */
import { useLoyalty } from '@/contexts/loyalty-context';

export function usePromotion() {
    const { validatePromotion } = useLoyalty();
    return { validatePromotion };
}
