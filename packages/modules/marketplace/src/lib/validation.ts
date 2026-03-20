import type {
  MarketplacePack,
  RestaurantPackSubscription,
  MarketplaceInitiatePurchaseRequest,
  MarketplaceWebhookPayload,
} from './types.js';

export function validateMarketplacePack(
  data: unknown
): data is Partial<MarketplacePack> {
  const pack = data as Record<string, unknown>;
  return (
    typeof pack === 'object' &&
    pack !== null &&
    typeof pack.name === 'string' &&
    typeof pack.slug === 'string' &&
    typeof pack.type === 'string'
  );
}

export function validateInitiatePurchase(
  data: unknown
): data is MarketplaceInitiatePurchaseRequest {
  const req = data as Record<string, unknown>;
  return (
    typeof req === 'object' &&
    req !== null &&
    typeof req.pack_id === 'string' &&
    typeof req.payer_msisdn === 'string'
  );
}

export function validateWebhookPayload(
  data: unknown
): data is MarketplaceWebhookPayload {
  const payload = data as Record<string, unknown>;
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.reference_id === 'string' &&
    (payload.status === 'paid' || payload.status === 'failed')
  );
}

export const packTypes = [
  'visibility',
  'advertising',
  'boost_menu',
  'sms_blast',
  'premium_analytics',
  'priority_support',
  'featured_banner',
  'extra_storage',
] as const;

export const subscriptionStatuses = [
  'pending_payment',
  'active',
  'expired',
  'cancelled',
  'refunded',
] as const;
