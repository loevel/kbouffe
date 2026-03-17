"use client";

import { CalendarDays, Clock, CheckCircle2, Users } from "lucide-react";
import { Card, useLocale } from "@kbouffe/module-core/ui";
import { Reservation } from "../../lib/types";

interface ReservationsStatsProps {
    allReservations: Reservation[];
}

export function ReservationsStats({ allReservations }: ReservationsStatsProps) {
    const { t } = useLocale();

    const pendingCount = allReservations.filter((r) => r.status === "pending").length;
    const confirmedCount = allReservations.filter((r) => r.status === "confirmed").length;
    const seatedCount = allReservations.filter((r) => r.status === "seated").length;
    const completedCount = allReservations.filter((r) => r.status === "completed").length;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="p-4 text-center border-none shadow-sm hover:shadow-md transition-shadow">
                <CalendarDays className="mx-auto text-brand-500 mb-1" size={20} />
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{allReservations.length}</p>
                <p className="text-sm text-surface-500">{t.reservations.statsTotal}</p>
            </Card>
            <Card className="p-4 text-center border-none shadow-sm hover:shadow-md transition-shadow">
                <Clock className="mx-auto text-yellow-500 mb-1" size={20} />
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{pendingCount}</p>
                <p className="text-sm text-surface-500">{t.reservations.statsPending}</p>
            </Card>
            <Card className="p-4 text-center border-none shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle2 className="mx-auto text-blue-500 mb-1" size={20} />
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{confirmedCount}</p>
                <p className="text-sm text-surface-500">{t.reservations.confirmed}</p>
            </Card>
            <Card className="p-4 text-center border-none shadow-sm hover:shadow-md transition-shadow">
                <Users className="mx-auto text-green-500 mb-1" size={20} />
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{seatedCount}</p>
                <p className="text-sm text-surface-500">{t.reservations.statsSeated}</p>
            </Card>
            <Card className="p-4 text-center lg:col-span-1 col-span-2 border-none shadow-sm hover:shadow-md transition-shadow">
                <div className="text-surface-400 mb-1 flex justify-center">
                    <CheckCircle2 size={20} />
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{completedCount}</p>
                <p className="text-sm text-surface-500">{t.reservations.statsCompleted}</p>
            </Card>
        </div>
    );
}
