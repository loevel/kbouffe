"use client";

import { useLocale } from "@kbouffe/module-core/ui";
import { TeamList } from "@kbouffe/module-hr/ui";

export default function TeamPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.team.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.team.subtitle}</p>
            </div>
            <TeamList />
        </>
    );
}
