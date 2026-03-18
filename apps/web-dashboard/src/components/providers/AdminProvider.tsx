"use client";

import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@kbouffe/module-core/ui";
import { type AdminRole, type AdminPermission, ADMIN_ROLES, hasAdminPermission } from "@/lib/admin-permissions";
import { useUserSession } from "@/store/client-store";

interface AdminContextValue {
    adminRole: AdminRole | null;
    can: (permission: AdminPermission) => boolean;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

function toAdminRole(value: unknown): AdminRole | null {
    if (typeof value !== "string") return null;
    const s = value.trim().toLowerCase();
    // Normalize common variants: super-admin, super admin, super_admin, admin -> super_admin
    const normalized = s.replace(/[-\s]+/g, "_");
    if (normalized === "admin") return "super_admin";
    return ADMIN_ROLES.includes(normalized as AdminRole) ? (normalized as AdminRole) : null;
}

export function AdminProvider({ children }: { children: ReactNode }) {
    const session = useUserSession(state => state.session);
    const updateProfile = useUserSession(state => state.updateProfile);
    const [hydratedAdminRole, setHydratedAdminRole] = useState<{ userId: string; role: AdminRole | null } | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!session || session.role !== "admin") return;

        const sessionAdminRole = toAdminRole(session.adminRole);
        if (sessionAdminRole) return;
        if (hydratedAdminRole?.userId === session.id) return;

        (async () => {
            try {
                const response = await adminFetch("/api/admin/profile");
                if (!response.ok) return;

                const payload = await response.json();
                const dbAdminRole = toAdminRole(payload?.adminRole);

                if (!cancelled) {
                    setHydratedAdminRole({ userId: session.id, role: dbAdminRole });
                }

                if (!cancelled && dbAdminRole) {
                    updateProfile({ adminRole: dbAdminRole });
                }
            } catch (error) {
                console.error("Failed to hydrate admin role:", error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [hydratedAdminRole?.userId, session, updateProfile]);

    const adminRole = useMemo(() => {
        if (!session || session.role !== "admin") return null;
        const sessionAdminRole = toAdminRole(session.adminRole);
        if (sessionAdminRole) return sessionAdminRole;
        if (hydratedAdminRole?.userId === session.id) return hydratedAdminRole.role;
        return null;
    }, [hydratedAdminRole, session]);

    const can = useMemo(() => {
        return (permission: AdminPermission) => {
            if (!adminRole) return false;
            return hasAdminPermission(adminRole, permission);
        };
    }, [adminRole]);

    const value = useMemo(() => ({ adminRole, can }), [adminRole, can]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
}
