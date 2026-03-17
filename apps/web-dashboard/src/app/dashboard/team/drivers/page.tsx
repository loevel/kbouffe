"use client";

import { useLocale } from "@/contexts/locale-context";
import { TeamList } from "@kbouffe/module-hr/ui";

export default function DriversPage() {
    const { t } = useLocale();

    // On suppose que t.team a des clés pour les livreurs, 
    // ou on recycle les clés existantes avec un titre spécifique.
    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.team.driversTitle}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.team.driversSubtitle}</p>
            </div>
            {/* On réutilise TeamList en filtrant uniquement sur rôle "driver" */}
            <TeamList filterRole="driver" />
        </>
    );
}
