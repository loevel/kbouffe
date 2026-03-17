"use client";

import { useMemo } from "react";
import { Users, UserCheck, Phone, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/locale-context";
import { useCustomers } from "./hooks";

export function CustomersStats() {
    const { t } = useLocale();
    const { customers, isLoading } = useCustomers();

    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const withPhone = customers.filter((c) => Boolean(c.phone?.trim())).length;
        const withEmail = customers.filter((c) => Boolean(c.email?.trim())).length;
        const recent = customers.filter((c) => {
            const value = c.createdAt ?? c.lastOrderAt;
            return value ? new Date(value) >= thirtyDaysAgo : false;
        }).length;

        return {
            total: customers.length,
            withPhone,
            withEmail,
            recent,
        };
    }, [customers]);

    if (isLoading && !customers.length) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-4 h-24 bg-surface-100 dark:bg-surface-800"><div /></Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.customers.statsTotal}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.total}</p>
                    </div>
                    <Users className="text-brand-500" size={20} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.customers.statsWithPhone}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.withPhone}</p>
                    </div>
                    <Phone className="text-emerald-500" size={20} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.customers.statsWithEmail}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.withEmail}</p>
                    </div>
                    <UserCheck className="text-blue-500" size={20} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.customers.statsRecent}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.recent}</p>
                    </div>
                    <CalendarDays className="text-amber-500" size={20} />
                </div>
            </Card>
        </div>
    );
}
