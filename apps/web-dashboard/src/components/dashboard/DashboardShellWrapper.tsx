"use client";

import { DashboardShell } from "@kbouffe/module-core/ui";
import { usePendingOrderCount } from "@/hooks/use-data";

export function DashboardShellWrapper({ children }: { children: React.ReactNode }) {
    const pendingCount = usePendingOrderCount();
    return <DashboardShell pendingOrderCount={pendingCount}>{children}</DashboardShell>;
}
