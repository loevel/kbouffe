/**
 * RBAC Permission system for restaurant teams.
 *
 * Roles: owner > manager > cashier | cook | driver | viewer
 * Each role grants a fixed set of permissions.
 */

// ── Types ──────────────────────────────────────────────────────────────
export type TeamRole = "owner" | "manager" | "cashier" | "cook" | "driver" | "viewer";

export type Permission =
    // Dashboard
    | "dashboard:read"
    // Orders
    | "orders:read"
    | "orders:manage"      // accept, reject, cancel
    | "orders:mark_ready"
    | "orders:kitchen"     // specific KDS access
    | "orders:delivery"    // specific delivery access
    // Menu
    | "menu:read"
    | "menu:write"
    // Customers
    | "customers:read"
    // Finances
    | "finances:read"
    // Store
    | "store:manage"
    // Settings
    | "settings:manage"
    // Tables & floor plan
    | "tables:manage"
    // Reservations
    | "reservations:read"
    | "reservations:manage"
    // Marketing
    | "marketing:read"
    | "marketing:manage"
    // Team
    | "team:read"
    | "team:invite"
    | "team:manage_roles"
    // Restaurant deletion
    | "restaurant:delete";

export type MemberStatus = "pending" | "active" | "revoked";

// ── Role → Permissions mapping ─────────────────────────────────────────
const ROLE_PERMISSIONS: Record<TeamRole, readonly Permission[]> = {
    owner: [
        "dashboard:read",
        "orders:read", "orders:manage", "orders:mark_ready", "orders:kitchen", "orders:delivery",
        "menu:read", "menu:write",
        "customers:read",
        "finances:read",
        "store:manage",
        "settings:manage",
        "tables:manage",
        "reservations:read", "reservations:manage",
        "marketing:read", "marketing:manage",
        "team:read", "team:invite", "team:manage_roles",
        "restaurant:delete",
    ],
    manager: [
        "dashboard:read",
        "orders:read", "orders:manage", "orders:mark_ready", "orders:kitchen", "orders:delivery",
        "menu:read", "menu:write",
        "customers:read",
        "finances:read",
        "store:manage",
        "settings:manage",
        "tables:manage",
        "reservations:read", "reservations:manage",
        "marketing:read", "marketing:manage",
        "team:read", "team:invite",
    ],
    cashier: [
        "orders:read", "orders:manage", "orders:mark_ready",
        "tables:manage",
        "reservations:read", "reservations:manage",
    ],
    cook: [
        "orders:kitchen", "orders:mark_ready",
    ],
    driver: [
        "orders:delivery",
    ],
    viewer: [
        "dashboard:read",
        "orders:read",
        "menu:read",
        "customers:read",
        "finances:read",
        "reservations:read",
    ],
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Check if a role has a specific permission */
export function hasPermission(role: TeamRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Get all permissions for a role */
export function getPermissions(role: TeamRole): readonly Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}

/** Check if roleA can manage roleB (hierarchy) */
const ROLE_HIERARCHY: Record<TeamRole, number> = {
    owner: 100,
    manager: 80,
    cashier: 30,
    cook: 20,
    driver: 20,
    viewer: 10,
};

export function canManageRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

/** All available roles (for dropdowns) */
export const TEAM_ROLES: TeamRole[] = ["owner", "manager", "cashier", "cook", "driver", "viewer"];

/** Assignable roles (owner cannot be assigned, it's automatic) */
export const ASSIGNABLE_ROLES: TeamRole[] = ["manager", "cashier", "cook", "driver", "viewer"];

/** Human-readable role labels (used in UI) */
export const ROLE_LABELS: Record<TeamRole, { fr: string; en: string }> = {
    owner:   { fr: "Propriétaire", en: "Owner" },
    manager: { fr: "Gérant",      en: "Manager" },
    cashier: { fr: "Caissier",    en: "Cashier" },
    cook:    { fr: "Cuisinier",   en: "Cook" },
    driver:  { fr: "Livreur",     en: "Driver" },
    viewer:  { fr: "Observateur", en: "Viewer" },
};

/** Role badge colour variants (for the UI Badge component) */
export const ROLE_BADGE_VARIANT: Record<TeamRole, "brand" | "info" | "success" | "warning" | "default"> = {
    owner:   "brand",
    manager: "info",
    cashier: "success",
    cook:    "warning",
    driver:  "warning",
    viewer:  "default",
};

// ── Sidebar nav → permission mapping ────────────────────────────────────
export const NAV_PERMISSIONS: Record<string, Permission> = {
    "/dashboard":                   "dashboard:read",
    "/dashboard/orders":            "orders:read",
    "/dashboard/orders/kitchen":    "orders:kitchen",
    "/dashboard/menu":              "menu:read",
    "/dashboard/customers":         "customers:read",
    "/dashboard/finances":          "finances:read",
    "/dashboard/caisse":            "finances:read",
    "/dashboard/store":             "store:manage",
    "/dashboard/settings":          "settings:manage",
    "/dashboard/tables":            "tables:manage",
    "/dashboard/reservations":      "reservations:read",
    "/dashboard/team":              "team:read",
    "/dashboard/marketing":         "marketing:read",
    "/dashboard/marketing/coupons": "marketing:read",
    "/dashboard/marketing/ads":     "marketing:read",
    "/dashboard/showcase":           "store:manage",
};