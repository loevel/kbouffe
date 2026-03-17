import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutPageClient } from "./_checkout-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Valider la commande — Kbouffe",
    description: "Finalisez votre commande et choisissez votre mode de paiement.",
};

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
            }
        >
            <CheckoutPageClient />
        </Suspense>
    );
}
