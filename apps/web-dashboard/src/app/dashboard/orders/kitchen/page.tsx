"use client";

import { ordersUi } from "@kbouffe/module-orders";
const { KitchenBoard } = ordersUi;
import { useLocale } from "@/contexts/locale-context";
import { Flame } from "lucide-react";

export default function KitchenPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500/10 p-2.5 rounded-xl">
                        <Flame size={22} className="text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.kds.title}</h1>
                        <p className="text-surface-500 dark:text-surface-400 mt-0.5">{t.kds.subtitle}</p>
                    </div>
                </div>
            </div>
            <KitchenBoard />
        </>
    );
}
