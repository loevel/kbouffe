"use client";

import Link from "next/link";
import { Plus, FolderOpen, Camera, Sparkles } from "lucide-react";
import { Button } from "@kbouffe/module-core/ui";
import { catalogUi } from "@kbouffe/module-catalog";
const { ProductsTable, MenuStats } = catalogUi;
import { useLocale } from "@kbouffe/module-core/ui";
import { useProducts } from "@/hooks/use-data";

export default function MenuPage() {
    const { t } = useLocale();
    const { products } = useProducts();

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.menu.title}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">{t.menu.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/menu/photo-studio">
                        <Button variant="outline" leftIcon={<Sparkles size={18} />}>Studio Photo IA</Button>
                    </Link>
                    <Link href="/dashboard/menu/import">
                        <Button variant="outline" leftIcon={<Camera size={18} />}>Scanner un menu</Button>
                    </Link>
                    <Link href="/dashboard/menu/categories">
                        <Button variant="outline" leftIcon={<FolderOpen size={18} />}>{t.menu.categories}</Button>
                    </Link>
                    <Link href="/dashboard/menu/new">
                        <Button leftIcon={<Plus size={18} />}>{t.menu.addProduct}</Button>
                    </Link>
                </div>
            </div>
            <MenuStats products={products} />
            <ProductsTable />
        </>
    );
}
