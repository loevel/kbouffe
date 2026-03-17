export type AdCampaignStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type AdCampaignPackage = 'basic' | 'premium' | 'elite';

export interface AdCampaign {
    id: string;
    restaurant_id: string;
    package: AdCampaignPackage;
    status: AdCampaignStatus;
    include_push: boolean;
    push_message?: string;
    impressions: number;
    clicks: number;
    budget: number;
    starts_at: string;
    ends_at: string;
    created_at: string;
}

export type CouponType = 'percent' | 'fixed';
export type CouponAppliesTo = 'all' | 'delivery' | 'pickup' | 'dine_in';

export interface Coupon {
    id: string;
    restaurant_id: string;
    code: string;
    name: string;
    description: string | null;
    type: CouponType;
    value: number;
    min_order: number;
    max_discount: number | null;
    max_uses: number | null;
    max_uses_per_customer: number;
    current_uses: number;
    is_active: boolean;
    applies_to: CouponAppliesTo;
    starts_at: string | null;
    expires_at: string | null;
    created_at: string;
}
