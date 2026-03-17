import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmationPageClient } from "./_confirmation-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Commande confirmée — Kbouffe",
    description: "Votre commande a bien été enregistrée.",
};

export default function ConfirmationPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
            }
        >
            <ConfirmationPageClient />
        </Suspense>
    );
}
