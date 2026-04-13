/**
 * Audit logging helper — logs admin actions to the audit_logs table
 * Used in all sensitive admin routes that modify data
 */
import { createAdminClient } from "@/lib/supabase/server";

interface AuditLogInput {
    action: string;
    targetType: string;
    targetId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an admin action to the audit trail.
 * Should be called AFTER a successful modification.
 * Silently fails — never throws, logs to console only.
 */
export async function logAuditAction(
    adminId: string,
    input: AuditLogInput
): Promise<void> {
    try {
        const supabase = await createAdminClient();

        await supabase.from("audit_logs").insert({
            admin_id: adminId,
            action: input.action,
            target_type: input.targetType,
            target_id: input.targetId,
            details: input.details ?? null,
            ip_address: input.ipAddress ?? null,
            user_agent: input.userAgent ?? null,
        });
    } catch (error) {
        // Silently fail — audit logging shouldn't break the main operation
        console.warn("[Audit Log Error]", error);
    }
}

/**
 * Extract client IP from Next.js request
 */
export function extractClientIp(
    xForwardedFor: string | null,
    remoteAddr: string | null
): string | null {
    if (xForwardedFor) {
        // x-forwarded-for can be comma-separated; take the first one
        return xForwardedFor.split(",")[0].trim();
    }
    return remoteAddr ?? null;
}

/**
 * Standard audit actions
 */
export const AUDIT_ACTIONS = {
    // User actions
    CREATE_USER: "create_user",
    UPDATE_USER: "update_user",
    DELETE_USER: "delete_user",
    BAN_USER: "ban_user",
    UNBAN_USER: "unban_user",
    IMPERSONATE_USER: "impersonate_user",
    RESET_PASSWORD: "reset_password_request",

    // Restaurant actions
    APPROVE_RESTAURANT: "approve_restaurant",
    BLOCK_RESTAURANT: "block_restaurant",
    UPDATE_RESTAURANT: "update_restaurant",
    DELETE_RESTAURANT: "delete_restaurant",

    // KYC actions
    KYC_APPROVE: "kyc_approve",
    KYC_REJECT: "kyc_reject",

    // Module actions
    ENABLE_MODULE: "enable_module",
    DISABLE_MODULE: "disable_module",

    // Member actions
    UPDATE_MEMBER: "update_member",
    REVOKE_MEMBER: "revoke_member",

    // Order/Payout actions
    REFUND_ORDER: "refund_order",
    UPDATE_ORDER_STATUS: "update_order_status",
    UPDATE_PAYOUT: "update_payout",
    MANUAL_PAYOUT: "manual_payout",

    // Content actions
    HIDE_REVIEW: "hide_review",
    SHOW_REVIEW: "show_review",
    UPDATE_SETTING: "update_setting",
    BULK_UPDATE_SETTINGS: "bulk_update_settings",

    // Support actions
    CREATE_SUPPORT_TICKET: "create_support_ticket",
    UPDATE_SUPPORT_TICKET: "update_support_ticket",
} as const;
