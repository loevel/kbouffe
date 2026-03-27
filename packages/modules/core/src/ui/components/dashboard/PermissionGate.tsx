"use client";

import type { ReactNode } from "react";
import { useDashboard } from "../../contexts/DashboardContext";
import type { Permission } from "../../lib/permissions";

interface PermissionGateProps {
    /** The permission required to render children */
    requires: Permission;
    /** Rendered instead when the user lacks the permission */
    fallback?: ReactNode;
    children: ReactNode;
}

/**
 * Conditionally renders children based on the current user's team permissions.
 */
export function PermissionGate({ requires, fallback = null, children }: PermissionGateProps) {
    const { can } = useDashboard();

    if (!can(requires)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
