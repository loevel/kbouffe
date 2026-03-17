export type TeamRole = "owner" | "manager" | "cashier" | "cook" | "viewer" | "driver";

export type Permission =
    | "dashboard:read"
    | "orders:read"
    | "orders:manage"
    | "orders:mark_ready"
    | "menu:read"
    | "menu:write"
    | "customers:read"
    | "finances:read"
    | "store:manage"
    | "settings:manage"
    | "tables:manage"
    | "reservations:read"
    | "reservations:manage"
    | "marketing:read"
    | "marketing:manage"
    | "team:read"
    | "team:invite"
    | "team:manage_roles"
    | "restaurant:delete";

export type MemberStatus = "pending" | "active" | "revoked";

const ROLE_PERMISSIONS: Record<TeamRole, readonly Permission[]> = {
    owner: [
        "dashboard:read",
        "orders:read", "orders:manage", "orders:mark_ready",
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
        "orders:read", "orders:manage", "orders:mark_ready",
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
        "reservations:read",
    ],
    cook: [
        "orders:read", "orders:mark_ready",
        "menu:read",
    ],
    viewer: [
        "dashboard:read",
        "orders:read",
        "menu:read",
        "customers:read",
        "finances:read",
        "reservations:read",
    ],
    driver: [
        // Le livreur n'a généralement pas accès au Dashboard Web complet, 
        // ou a des droits limités. Ses permissions backend spécifiques (App Livreur) 
        // interagiront différemment pour lire ses propres commandes.
        "orders:read",
    ],
};

const ROLE_HIERARCHY: Record<TeamRole, number> = {
    owner: 100,
    manager: 80,
    cashier: 30,
    cook: 20,
    viewer: 10,
    driver: 5, // Hiérarchie distincte
};

export function hasPermission(role: TeamRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export const TEAM_ROLES: TeamRole[] = ["owner", "manager", "cashier", "cook", "viewer", "driver"];
export const ASSIGNABLE_ROLES: TeamRole[] = ["manager", "cashier", "cook", "viewer", "driver"];
