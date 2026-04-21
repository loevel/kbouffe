import { z } from 'zod';
import type {
  MarketplacePack,
  RestaurantPackSubscription,
  MarketplaceInitiatePurchaseRequest,
  MarketplaceWebhookPayload,
} from './types.js';

// ── Zod schemas ────────────────────────────────────────────────────

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

export const marketplacePackSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.enum(packTypes),
  price: z.number().int().nonnegative(),
  duration_days: z.number().int().positive(),
  description: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
  limits: z.record(z.string(), z.unknown()).optional(),
  badge_color: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const initiatePurchaseSchema = z.object({
  pack_id: z.string().uuid(),
  payer_msisdn: z.string().min(8).max(15),
});

export const webhookPayloadSchema = z.object({
  reference_id: z.string().min(1),
  external_id: z.string().optional(),
  status: z.enum(['paid', 'failed']),
});

// ── Validators (type-guard wrappers for backward compat) ───────────

export function validateMarketplacePack(
  data: unknown
): data is Partial<MarketplacePack> {
  return marketplacePackSchema.partial().safeParse(data).success &&
    typeof (data as any)?.name === 'string' &&
    typeof (data as any)?.slug === 'string' &&
    typeof (data as any)?.type === 'string';
}

export function validateInitiatePurchase(
  data: unknown
): data is MarketplaceInitiatePurchaseRequest {
  return initiatePurchaseSchema.safeParse(data).success;
}

export function validateWebhookPayload(
  data: unknown
): data is MarketplaceWebhookPayload {
  return webhookPayloadSchema.safeParse(data).success;
}
