"use client";

import { DashboardShell } from "@kbouffe/module-core/ui";
import { usePendingOrderCount } from "@/hooks/use-data";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";

export function DashboardShellWrapper({ children }: { children: React.ReactNode }) {
    const pendingCount = usePendingOrderCount();
    useDashboardNotifications();
    return <DashboardShell pendingOrderCount={pendingCount}>{children}</DashboardShell>;
}
