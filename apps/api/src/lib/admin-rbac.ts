import type { Context } from "hono";
import type { AdminRole, Env, Variables } from "../types";

// ── Admin domains ──────────────────────────────────────────────────
export type AdminDomain =
    | "stats"
    | "users:read"
    | "users:write"
    | "restaurants:read"
    | "restaurants:write"
    | "drivers"
    | "support"
    | "billing:read"
    | "billing:write"
    | "moderation"
    | "marketing"
    | "orders:read"
    | "orders:write"
    | "catalog:read"
    | "catalog:write"
    | "marketplace:read"
    | "marketplace:write"
    | "system";

// ── Domain → allowed roles ─────────────────────────────────────────
const DOMAIN_ACCESS: Record<AdminDomain, readonly AdminRole[]> = {
    "stats":              ["super_admin", "support", "sales", "moderator"],
    "users:read":         ["super_admin", "support", "sales", "moderator"],
    "users:write":        ["super_admin"],
    "restaurants:read":   ["super_admin", "support", "sales", "moderator"],
    "restaurants:write":  ["super_admin", "sales"],
    "drivers":            ["super_admin", "support"],
    "support":            ["super_admin", "support"],
    "billing:read":       ["super_admin", "sales"],
    "billing:write":      ["super_admin"],
    "moderation":         ["super_admin", "moderator"],
    "marketing":          ["super_admin", "sales"],
    "orders:read":        ["super_admin", "support", "sales", "moderator"],
    "orders:write":       ["super_admin", "support"],
    "catalog:read":       ["super_admin", "support", "sales", "moderator"],
    "catalog:write":      ["super_admin", "sales"],
    "marketplace:read":   ["super_admin", "sales"],
    "marketplace:write":  ["super_admin"],
    "system":             ["super_admin"],
};

/**
 * Check if the current admin has access to a domain.
 * Returns a 403 Response if denied, or null if allowed.
 */
export function requireDomain(
    c: Context<{ Bindings: Env; Variables: Variables }>,
    domain: AdminDomain,
): Response | null {
    const adminRole = c.get("adminRole");
    if (!adminRole || !DOMAIN_ACCESS[domain].includes(adminRole)) {
        return c.json(
            { error: `Accès refusé : le rôle "${adminRole ?? "inconnu"}" n'a pas accès à "${domain}"` },
            403,
        ) as unknown as Response;
    }
    return null;
}

// ── Audit logging ──────────────────────────────────────────────────

interface AuditParams {
    action: string;
    targetType: string;
    targetId: string;
    details?: Record<string, unknown>;
}

/**
 * Log an admin action to the audit trail.
 */
export async function logAdminAction(
    c: Context<{ Bindings: Env; Variables: Variables }>,
    params: AuditParams,
): Promise<void> {
    try {
        const ip =
            c.req.header("cf-connecting-ip") ??
            c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
            null;

        await c.var.supabase.from("admin_audit_log").insert({
            admin_id: c.get("userId"),
            action: params.action,
            target_type: params.targetType,
            target_id: params.targetId,
            details: params.details || null,
            ip_address: ip,
        });
    } catch (err) {
        console.error("[AuditLog] Failed to log admin action:", err);
    }
}
