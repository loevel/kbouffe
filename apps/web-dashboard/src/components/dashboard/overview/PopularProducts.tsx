"use client";

import { Card, CardHeader, CardTitle } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useProducts, useCategories } from "@/hooks/use-data";

const gradients = [
    "from-orange-400 to-red-500",
    "from-green-400 to-emerald-500",
    "from-blue-400 to-indigo-500",
    "from-amber-400 to-orange-500",
    "from-violet-400 to-purple-500",
];

export function PopularProducts() {
    const { t } = useLocale();
    const { products, isLoading: productsLoading } = useProducts();
    const { categories, isLoading: categoriesLoading } = useCategories();
    const isLoading = productsLoading || categoriesLoading;

    // Show top 5 available products by price (as proxy for popularity until order analytics are added)
    const popularProducts = products
        .filter((p: any) => p.is_available)
        .slice(0, 5);

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>{t.dashboard.popularProducts}</CardTitle></CardHeader>
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-3 animate-pulse">
                            <div className="w-10 h-10 rounded-lg bg-surface-200 dark:bg-surface-700" />
                            <div className="flex-1">
                                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24 mb-1" />
                                <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.dashboard.popularProducts}</CardTitle>
            </CardHeader>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {popularProducts.map((product: any, i: number) => {
                    const category = categories.find((c: any) => c.id === product.category_id);
                    return (
                        <div key={product.id} className="flex items-center gap-4 px-6 py-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradients[i]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                {product.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                    {product.name}
                                </p>
                                <p className="text-xs text-surface-500 dark:text-surface-400">
                                    {category?.name}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-semibold text-surface-900 dark:text-white">
                                    {formatCFA(product.price)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
