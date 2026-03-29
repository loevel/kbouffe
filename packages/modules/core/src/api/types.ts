import type { SupabaseClient } from "@supabase/supabase-js";

export interface CoreEnv {
    DB?: any; // D1Database - optional because D1 may be removed
    IMAGES_BUCKET: any; // R2Bucket
    SMS_QUEUE?: any; // Cloudflare Queue
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    KYC_BASE_URL?: string;
    KYC_SUBSCRIPTION_KEY?: string;
    MTN_BASE_URL?: string;
    MTN_ADS_BASE_URL?: string;
    MTN_ADS_SUBSCRIPTION_KEY?: string;
    MTN_COLLECTION_API_USER?: string;
    MTN_COLLECTION_API_KEY?: string;
    MTN_COLLECTION_SUBSCRIPTION_KEY?: string;
    MTN_COLLECTION_CALLBACK_URL?: string;
    MTN_DISBURSEMENT_API_USER?: string;
    MTN_DISBURSEMENT_API_KEY?: string;
    MTN_DISBURSEMENT_SUBSCRIPTION_KEY?: string;
    MTN_TARGET_ENVIRONMENT?: string;
    MTN_WEBHOOK_SECRET?: string;
    ORANGE_BASE_URL?: string;
    ORANGE_TARGET_ENVIRONMENT?: string;
    ORANGE_COLLECTION_API_USER?: string;
    ORANGE_COLLECTION_API_KEY?: string;
    ORANGE_COLLECTION_SUBSCRIPTION_KEY?: string;
    ORANGE_COLLECTION_CALLBACK_URL?: string;
    ORANGE_DISBURSEMENT_API_USER?: string;
    ORANGE_DISBURSEMENT_API_KEY?: string;
    ORANGE_DISBURSEMENT_SUBSCRIPTION_KEY?: string;
    ORANGE_WEBHOOK_SECRET?: string;
    /** NIU (Numéro d'Identifiant Unique) de KBouffe — imprimé sur les factures. */
    KBOUFFE_NIU?: string;
    /** RCCM de KBouffe — imprimé sur les factures. */
    KBOUFFE_RCCM?: string;
}

export type AdminRole = "super_admin" | "support" | "sales" | "moderator";

export interface CoreVariables {
    userId: string;
    restaurantId: string;
    supabase: SupabaseClient;
    adminRole: AdminRole | null;
}
