"use client";

import { reservationsUi } from "@kbouffe/module-reservations";
import { useLocale } from "@/contexts/locale-context";

export default function ReservationsPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.reservations.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.reservations.subtitle}</p>
            </div>
            <reservationsUi.ReservationsList />
        </>
    );
}
