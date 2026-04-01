"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@kbouffe/module-core/ui";
import { usePendingOrderCount } from "@/hooks/use-data";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { PosOperatorProvider } from "@/contexts/PosOperatorContext";

/**
 * DashboardShellWrapper
 *
 * Applique le DashboardShell (shell restaurant) uniquement aux routes qui en ont besoin.
 *
 * Routes exclues du shell restaurant (elles ont leur propre layout) :
 *   /dashboard/fournisseur/*  → FournisseurLayout (shell agriculteur indépendant)
 */
const SHELL_EXCLUDED_PREFIXES = [
    "/dashboard/fournisseur",
];

export function DashboardShellWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const pendingCount = usePendingOrderCount();
    useDashboardNotifications();

    // Pages avec leur propre shell → rendre les enfants directement
    const isExcluded = SHELL_EXCLUDED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
    );

    if (isExcluded) {
        return <PosOperatorProvider>{children}</PosOperatorProvider>;
    }

    return (
        <PosOperatorProvider>
            <DashboardShell pendingOrderCount={pendingCount}>{children}</DashboardShell>
        </PosOperatorProvider>
    );
}
