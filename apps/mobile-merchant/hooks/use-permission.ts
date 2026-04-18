import { useAuth } from '@/contexts/auth-context';
import { hasPermission, type Permission, type TeamRole } from '@/lib/permissions';

/**
 * Returns whether the current user has the given permission.
 * Owners always have all permissions.
 * Returns false if the profile is not loaded yet.
 */
export function usePermission(permission: Permission): boolean {
    const { profile } = useAuth();
    const role = profile?.memberRole as TeamRole | null;
    if (!role) return false;
    return hasPermission(role, permission);
}

/**
 * Returns a function to check multiple permissions at once.
 * Useful when conditionally rendering several items.
 */
export function usePermissions() {
    const { profile } = useAuth();
    const role = profile?.memberRole as TeamRole | null;

    return (permission: Permission): boolean => {
        if (!role) return false;
        return hasPermission(role, permission);
    };
}
