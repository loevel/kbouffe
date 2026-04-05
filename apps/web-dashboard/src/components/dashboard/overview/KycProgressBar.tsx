"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

interface KycStep {
    id: string;
    label: string;
    description: string;
    href: string;
    check: (r: any) => boolean;
}

const STEPS: KycStep[] = [
    {
        id: "name",
        label: "Nom du restaurant",
        description: "Nom affiché aux clients",
        href: "/dashboard/settings/restaurant",
        check: (r) => !!r?.name,
    },
    {
        id: "logo",
        label: "Logo / Photo de couverture",
        description: "Photo principale de votre restaurant",
        href: "/dashboard/settings/restaurant",
        check: (r) => !!r?.avatar_url || !!r?.cover_url,
    },
    {
        id: "description",
        label: "Description",
        description: "Présentez votre restaurant",
        href: "/dashboard/settings/restaurant",
        check: (r) => !!r?.description && r.description.length >= 20,
    },
    {
        id: "address",
        label: "Adresse",
        description: "Localisation pour la livraison",
        href: "/dashboard/settings/restaurant",
        check: (r) => !!r?.city || !!r?.address,
    },
    {
        id: "phone",
        label: "Numéro de téléphone",
        description: "Contact pour les clients",
        href: "/dashboard/settings/restaurant",
        check: (r) => !!r?.phone,
    },
    {
        id: "hours",
        label: "Horaires d'ouverture",
        description: "Quand êtes-vous disponible ?",
        href: "/dashboard/settings/restaurant",
        check: (r) => !!r?.opening_time || !!r?.opening_hours,
    },
];

export function KycProgressBar() {
    const { restaurant, loading } = useDashboard();

    if (loading || !restaurant) return null;

    const completedSteps = STEPS.filter((s) => s.check(restaurant));
    const progress = Math.round((completedSteps.length / STEPS.length) * 100);

    if (progress === 100) return null;

    const nextStep = STEPS.find((s) => !s.check(restaurant));

    return (
        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/5">
            <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-amber-500" />
                        <CardTitle className="text-amber-900 dark:text-amber-100 text-sm">
                            Complétez votre profil — {progress}%
                        </CardTitle>
                    </div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {completedSteps.length}/{STEPS.length} étapes
                    </span>
                </div>
            </CardHeader>
            <div className="px-5 pb-5 space-y-4">
                {/* Progress bar */}
                <div className="w-full h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Steps list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STEPS.map((step) => {
                        const done = step.check(restaurant);
                        return (
                            <div
                                key={step.id}
                                className="flex items-center gap-2.5"
                            >
                                {done ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                ) : (
                                    <Circle size={16} className="text-amber-300 dark:text-amber-700 shrink-0" />
                                )}
                                <span className={`text-xs ${done ? "text-surface-400 dark:text-surface-500 line-through" : "text-surface-700 dark:text-surface-300"}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* CTA — next incomplete step */}
                {nextStep && (
                    <Link
                        href={nextStep.href}
                        className="flex items-center justify-between p-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm font-medium"
                    >
                        <span>→ {nextStep.label}</span>
                        <ChevronRight size={16} />
                    </Link>
                )}
            </div>
        </Card>
    );
}
