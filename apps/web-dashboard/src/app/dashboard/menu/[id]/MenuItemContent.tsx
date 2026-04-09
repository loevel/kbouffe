"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { catalogUi } from "@kbouffe/module-catalog";
const { ProductForm } = catalogUi;
import { useProducts } from "@/hooks/use-data";
import { useLocale } from "@kbouffe/module-core/ui";

export default function MenuItemContent() {
    const params = useParams();
    const { t } = useLocale();
    const { products, isLoading } = useProducts();
    const productId = Array.isArray(params.id) ? params.id[0] : params.id;
    const product = products.find((p: any) => p.id === productId);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-48 rounded bg-surface-200 dark:bg-surface-700 animate-pulse" />
                <div className="h-10 rounded bg-surface-200 dark:bg-surface-700 animate-pulse" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">{t.menu.productNotFound}</h2>
                <Link href="/dashboard/menu" className="text-brand-500 hover:underline mt-2 inline-block">{t.menu.backToMenu}</Link>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <Link href="/dashboard/menu" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4">
                    <ArrowLeft size={16} />
                    {t.menu.backToMenu}
                </Link>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.menu.editProduct} {product.name}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.menu.editSubtitle}</p>
            </div>
            <ProductForm product={product} />
        </>
    );
}
