"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { catalogUi } from "@kbouffe/module-catalog";
const { ProductForm } = catalogUi;
import { useLocale } from "@kbouffe/module-core/ui";

export default function NewItemContent() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <Link href="/dashboard/menu" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4">
                    <ArrowLeft size={16} />
                    {t.menu.backToMenu}
                </Link>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.menu.newProduct}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.menu.newProductSubtitle}</p>
            </div>
            <ProductForm />
        </>
    );
}
