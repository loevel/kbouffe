"use client";

import { useState } from "react";
import { Button } from "@kbouffe/module-core/ui";
import { KYCForm } from "./KYCForm";

interface KYCComplianceBannerProps {
    kyc_status: string;
    kyc_notes?: string;
    restaurant_id: string;
}

export function KYCComplianceBanner({ kyc_status, kyc_notes }: KYCComplianceBannerProps) {
    const [showForm, setShowForm] = useState(false);

    const bannerConfig = {
        pending: {
            icon: "⚠️",
            message: "Complétez votre KYC pour publier votre restaurant. RCCM et NIF requis.",
            classes: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300",
            showButton: true,
        },
        documents_submitted: {
            icon: "⏳",
            message: "Documents KYC reçus — en attente de validation (2-5 jours ouvrables).",
            classes: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300",
            showButton: false,
        },
        approved: {
            icon: "✅",
            message: "KYC validé — votre restaurant est conforme.",
            classes: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300",
            showButton: false,
        },
        rejected: {
            icon: "❌",
            message: `KYC rejeté${kyc_notes ? ` : ${kyc_notes}` : ""}. Veuillez corriger et resoumettre.`,
            classes: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300",
            showButton: true,
        },
    };

    const config = bannerConfig[kyc_status as keyof typeof bannerConfig] ?? bannerConfig.pending;

    return (
        <>
            <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${config.classes}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{config.icon}</span>
                    <span>{config.message}</span>
                </div>
                {config.showButton && (
                    <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="shrink-0">
                        Compléter le KYC
                    </Button>
                )}
            </div>

            {showForm && (
                <KYCForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => setShowForm(false)}
                />
            )}
        </>
    );
}
