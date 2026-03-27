"use client";

import { useMemo } from "react";
import { Package, CheckCircle, XCircle, Tag } from "lucide-react";
import { Card, formatCFA, useLocale } from "@kbouffe/module-core/ui";
import { useCategories } from "../hooks/use-catalog";
import type { Product, Category } from "../lib/types";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
    return (
        <Card className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
                {sub && <p className="text-xs text-surface-400">{sub}</p>}
            </div>
        </Card>
    );
}

interface MenuStatsProps {
    products: Product[];
}

export function MenuStats({ products, restaurantId, isAdmin = false }: MenuStatsProps & { restaurantId?: string; isAdmin?: boolean }) {
    const { t } = useLocale();
    const { categories } = useCategories(restaurantId, isAdmin);
    const stats = useMemo(() => {
        const total = products.length;
        const available = products.filter((p: Product) => p.is_available).length;
        const unavailable = total - available;
        const activeCategories = categories.filter((c: Category) => c.is_active).length;
        const avgPrice = total > 0
            ? Math.round(products.reduce((sum: number, p: Product) => sum + p.price, 0) / total)
            : 0;

        return { total, available, unavailable, categories: activeCategories, avgPrice };
    }, [products, categories]);



    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                icon={<Package size={20} className="text-brand-600" />}
                label={t.menu.totalProducts}
                value={stats.total}
                sub={`${stats.categories} ${t.menu.categoriesCount}`}
                color="bg-brand-50 dark:bg-brand-900/20"
            />
            <StatCard
                icon={<CheckCircle size={20} className="text-green-600" />}
                label={t.menu.availableProducts}
                value={stats.available}
                sub={`${Math.round((stats.available / Math.max(stats.total, 1)) * 100)}${t.menu.percentMenu}`}
                color="bg-green-50 dark:bg-green-900/20"
            />
            <StatCard
                icon={<XCircle size={20} className="text-red-500" />}
                label={t.menu.unavailableProducts}
                value={stats.unavailable}
                sub={stats.unavailable > 0 ? t.menu.toReactivate : t.menu.allOnline}
                color="bg-red-50 dark:bg-red-900/20"
            />
            <StatCard
                icon={<Tag size={20} className="text-amber-600" />}
                label={t.menu.avgPrice}
                value={formatCFA(stats.avgPrice)}
                color="bg-amber-50 dark:bg-amber-900/20"
            />
        </div>
    );
}
