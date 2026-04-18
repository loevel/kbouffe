export type TeamRole = 'owner' | 'manager' | 'cashier' | 'cook' | 'viewer' | 'driver';

export type Permission =
    | 'dashboard:read'
    | 'orders:read'
    | 'orders:manage'
    | 'orders:mark_ready'
    | 'menu:read'
    | 'menu:write'
    | 'customers:read'
    | 'finances:read'
    | 'store:manage'
    | 'settings:manage'
    | 'tables:manage'
    | 'reservations:read'
    | 'reservations:manage'
    | 'marketing:read'
    | 'marketing:manage'
    | 'team:read'
    | 'team:invite'
    | 'team:manage_roles'
    | 'restaurant:delete';

const ROLE_PERMISSIONS: Record<TeamRole, readonly Permission[]> = {
    owner: [
        'dashboard:read',
        'orders:read', 'orders:manage', 'orders:mark_ready',
        'menu:read', 'menu:write',
        'customers:read',
        'finances:read',
        'store:manage',
        'settings:manage',
        'tables:manage',
        'reservations:read', 'reservations:manage',
        'marketing:read', 'marketing:manage',
        'team:read', 'team:invite', 'team:manage_roles',
        'restaurant:delete',
    ],
    manager: [
        'dashboard:read',
        'orders:read', 'orders:manage', 'orders:mark_ready',
        'menu:read', 'menu:write',
        'customers:read',
        'finances:read',
        'store:manage',
        'settings:manage',
        'tables:manage',
        'reservations:read', 'reservations:manage',
        'marketing:read', 'marketing:manage',
        'team:read', 'team:invite',
    ],
    cashier: [
        'orders:read', 'orders:manage', 'orders:mark_ready',
        'reservations:read',
    ],
    cook: [
        'orders:read', 'orders:mark_ready',
        'menu:read',
    ],
    viewer: [
        'dashboard:read',
        'orders:read',
        'menu:read',
        'customers:read',
        'finances:read',
        'reservations:read',
    ],
    driver: [
        'orders:read',
    ],
};

export function hasPermission(role: TeamRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
