"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { type AdminRole, type AdminPermission, hasAdminPermission } from "@/lib/admin-permissions";
import { useUserSession } from "@/store/client-store";

interface AdminContextValue {
    adminRole: AdminRole | null;
    can: (permission: AdminPermission) => boolean;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const session = useUserSession(state => state.session);

    // Get the adminRole from the session. 
    // Defaults to "super_admin" if the user has the "admin" role but no specific adminRole is set.
    const adminRole = useMemo(() => {
        if (!session || session.role !== "admin") return null;
        return (session.adminRole || "super_admin") as AdminRole;
    }, [session]);

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
