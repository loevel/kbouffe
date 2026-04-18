import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamRole } from "./lib/permissions";

/**
 * Cloudflare Worker environment bindings.
 */
export interface Env {
    /** R2 — Image storage bucket */
    IMAGES_BUCKET: R2Bucket;
    /** Supabase project URL */
    SUPABASE_URL: string;
    /** Supabase anon key (for server-side client) */
    SUPABASE_ANON_KEY: string;
    /** Supabase service role key (for admin ops — webhooks etc.) */
    SUPABASE_SERVICE_ROLE_KEY?: string;

    // ── MTN MoMo Collection ──────────────────────────────────
    MTN_COLLECTION_API_USER?: string;
    MTN_COLLECTION_API_KEY?: string;
    MTN_COLLECTION_SUBSCRIPTION_KEY?: string;
    MTN_COLLECTION_CALLBACK_URL?: string;
    MTN_TARGET_ENVIRONMENT?: string; // "sandbox" | "production"
    MTN_BASE_URL?: string;
    MTN_WEBHOOK_SECRET?: string;

    // ── Turnstile ────────────────────────────────────────────
    TURNSTILE_SECRET_KEY?: string;

    // ── MTN MoMo Disbursement ────────────────────────────────
    MTN_DISBURSEMENT_API_USER?: string;
    MTN_DISBURSEMENT_API_KEY?: string;
    MTN_DISBURSEMENT_SUBSCRIPTION_KEY?: string;

    // ── MTN Ads / KYC ───────────────────────────────────────
    MTN_ADS_SUBSCRIPTION_KEY?: string;
    MTN_ADS_BASE_URL?: string;
    MTN_KYC_SUBSCRIPTION_KEY?: string;
    MTN_KYC_BASE_URL?: string;

    // ── Queues ─────────────────────────────────────────────
    SMS_QUEUE: Queue;

    /** Deployment environment — set to "production" in prod wrangler vars */
    ENVIRONMENT?: string;

    /** Cloudflare Workers AI binding */
    AI?: Ai;
    /** Resend API key for transactional emails */
    RESEND_API_KEY?: string;
    /** Public dashboard URL used in admin-generated links */
    DASHBOARD_URL?: string;
}

/**
 * Admin sub-roles.
 */
export type AdminRole = "super_admin" | "support" | "sales" | "moderator";

/**
 * Hono context variables set by auth middleware.
 */
export interface Variables {
    /** Authenticated Supabase user ID */
    userId: string;
    /** The merchant's restaurant ID */
    restaurantId: string;
    /** Supabase client authenticated with the user's token */
    supabase: SupabaseClient;
    /** Admin sub-role (only set for admin users) */
    adminRole: AdminRole | null;
    /** Restaurant member role (set by authMiddleware — null for non-member routes) */
    memberRole: TeamRole | null;
}
