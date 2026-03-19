export interface MarketplacePack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'visibility' | 'advertising' | 'boost_menu' | 'sms_blast' | 'premium_analytics' | 'priority_support' | 'featured_banner' | 'extra_storage';
  price: number;
  duration_days: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  features: Array<{ key: string; label: string; value: string | number | boolean }>;
  limits: Record<string, number | string>;
  badge_color: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantPackSubscription {
  id: string;
  restaurant_id: string;
  pack_id: string;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled' | 'refunded';
  price_paid: number;
  currency: string;
  starts_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  payment_transaction_id: string | null;
  activated_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceInitiatePurchaseRequest {
  pack_id: string;
  payer_msisdn: string;
}

export interface MarketplaceInitiatePurchaseResponse {
  subscription_id: string;
  transaction_id: string;
  reference_id: string;
  amount: number;
  currency: string;
}

export interface MarketplaceWebhookPayload {
  reference_id: string;
  external_id?: string;
  status: 'paid' | 'failed';
  timestamp: number;
}
