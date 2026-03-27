/**
 * RBAC Permission system for Platform Administrators.
 *
 * Roles: super_admin > support > sales > moderator
 * Each role grants a fixed set of permissions across all restaurants.
 */

// ── Types ──────────────────────────────────────────────────────────────
export type AdminRole = "super_admin" | "support" | "sales" | "moderator";

export type AdminPermission =
    // Dashboard & Analytics
    | "admin:dashboard:read"
    // Restaurants
    | "admin:restaurants:read"
    | "admin:restaurants:write"   // Approve, block, edit details
    | "admin:restaurants:delete"
    // Users
    | "admin:users:read"
    | "admin:users:write"         // Ban, unban, reset password
    // Orders
    | "admin:orders:read"
    | "admin:orders:refund"       // Force refund
    // Drivers
    | "admin:drivers:read"
    | "admin:drivers:write"       // Approve, block, manage documents
    // Reviews & Moderation
    | "admin:reviews:manage"      // Delete, hide abusive reviews
    // Marketing
    | "admin:marketing:read"
    | "admin:marketing:write"     // Approve platform-wide campaigns
    // Billing
    | "admin:billing:read"
    | "admin:billing:payouts"     // Trigger payouts, adjust commissions
    // Support
    | "admin:support:manage"      // Read, reply, close tickets
    // Marketplace
    | "admin:marketplace:manage"  // Manage services and packs
    // Platform Settings
    | "admin:settings:manage"     // Edit global variables, fee structures
    ;

// ── Role → Permissions mapping ─────────────────────────────────────────
const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
    super_admin: [
        "admin:dashboard:read",
        "admin:restaurants:read", "admin:restaurants:write", "admin:restaurants:delete",
        "admin:users:read", "admin:users:write",
        "admin:orders:read", "admin:orders:refund",
        "admin:drivers:read", "admin:drivers:write",
        "admin:reviews:manage",
        "admin:marketing:read", "admin:marketing:write",
        "admin:billing:read", "admin:billing:payouts",
        "admin:support:manage",
        "admin:marketplace:manage",
        "admin:settings:manage"
    ],
    support: [
        "admin:dashboard:read",
        "admin:restaurants:read",
        "admin:users:read",
        "admin:orders:read", "admin:orders:refund",
        "admin:drivers:read",
        "admin:support:manage"
    ],
    sales: [
        "admin:dashboard:read",
        "admin:restaurants:read", "admin:restaurants:write",
        "admin:marketing:read",
        "admin:marketplace:manage",
    ],
    moderator: [
        "admin:dashboard:read",
        "admin:users:read", "admin:users:write",
        "admin:restaurants:read",
        "admin:reviews:manage",
    ]
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Check if an admin role has a specific permission */
export function hasAdminPermission(role: AdminRole, permission: AdminPermission): boolean {
    return ADMIN_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Get all permissions for an admin role */
export function getAdminPermissions(role: AdminRole): readonly AdminPermission[] {
    return ADMIN_ROLE_PERMISSIONS[role] ?? [];
}

/** All available admin roles */
export const ADMIN_ROLES: AdminRole[] = ["super_admin", "support", "sales", "moderator"];

/** Human-readable admin role labels (used in UI) */
export const ADMIN_ROLE_LABELS: Record<AdminRole, { fr: string; en: string }> = {
    super_admin: { fr: "Super Admin", en: "Super Admin" },
    support: { fr: "Support", en: "Support Agent" },
    sales: { fr: "Commercial", en: "Sales Agent" },
    moderator: { fr: "Modérateur", en: "Moderator" },
};

/** Admin Role badge colour variants */
export const ADMIN_ROLE_BADGE_VARIANT: Record<AdminRole, "brand" | "info" | "success" | "warning" | "default"> = {
    super_admin: "brand",
    support: "info",
    sales: "success",
    moderator: "warning",
};

// ── Sidebar nav → permission mapping ────────────────────────────────────
export const ADMIN_NAV_PERMISSIONS: Record<string, AdminPermission> = {
    "/admin": "admin:dashboard:read",
    "/admin/restaurants": "admin:restaurants:read",
    "/admin/users": "admin:users:read",
    "/admin/orders": "admin:orders:read",
    "/admin/drivers": "admin:drivers:read",
    "/admin/billing": "admin:billing:read",
    "/admin/audits": "admin:settings:manage", // Let's restrict audits to super admin via settings:manage
    "/admin/marketing": "admin:marketing:read",
    "/admin/marketplace": "admin:marketplace:manage",
    "/admin/cuisine-categories": "admin:settings:manage",
    "/admin/reviews": "admin:reviews:manage",
    "/admin/support": "admin:support:manage",
    "/admin/settings": "admin:settings:manage",
    "/admin/logs": "admin:settings:manage", // Let's restrict logs to super admin via settings:manage
};
