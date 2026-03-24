import type { Metadata } from "next";
import { DriverHistory } from "@/components/driver/DriverHistory";

export const metadata: Metadata = {
    title: "Historique — Livreur Kbouffe",
};

export default function DriverHistoryPage() {
    return (
        <div className="max-w-lg mx-auto px-4">
            <div className="pt-8 pb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Historique</h1>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Vos livraisons effectuées
                </p>
            </div>
            <DriverHistory />
        </div>
    );
}
