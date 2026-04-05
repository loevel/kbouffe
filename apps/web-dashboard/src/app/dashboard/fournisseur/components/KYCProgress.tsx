"use client";

/**
 * KYCProgress -- Progress bar with steps: Docs -> Face verify -> Approved
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
    FileText,
    ScanFace,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";

interface KYCProgressProps {
    kycStatus: string;
    faceVerified: boolean | null;
    hasDocuments: boolean;
}

interface Step {
    label: string;
    icon: React.ElementType;
    completed: boolean;
    active: boolean;
}

export function KYCProgress({ kycStatus, faceVerified, hasDocuments }: KYCProgressProps) {
    const isApproved = kycStatus === "approved";
    const docsSubmitted = hasDocuments || kycStatus === "documents_submitted" || isApproved;
    const faceOk = faceVerified === true || isApproved;

    const steps: Step[] = [
        {
            label: "Documents soumis",
            icon: FileText,
            completed: docsSubmitted,
            active: !docsSubmitted,
        },
        {
            label: "Verification faciale",
            icon: ScanFace,
            completed: faceOk,
            active: docsSubmitted && !faceOk,
        },
        {
            label: "Compte approuve",
            icon: CheckCircle2,
            completed: isApproved,
            active: docsSubmitted && faceOk && !isApproved,
        },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const progress = (completedCount / steps.length) * 100;

    // CTA
    let ctaLabel = "";
    let ctaHref = "/dashboard/fournisseur/profil";
    if (!docsSubmitted) {
        ctaLabel = "Soumettre mes documents";
    } else if (!faceOk) {
        ctaLabel = "Verifier mon identite";
    } else if (!isApproved) {
        ctaLabel = "En attente d'approbation";
    }

    if (isApproved) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-900 border border-white/8 rounded-2xl p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Progression KYC</h3>
                <span className="text-xs font-semibold text-surface-400">
                    {completedCount}/{steps.length}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden mb-5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                />
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between gap-2">
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.label} className="flex items-center gap-2 flex-1">
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    step.completed
                                        ? "bg-emerald-500/15 text-emerald-400"
                                        : step.active
                                        ? "bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30"
                                        : "bg-surface-800 text-surface-600"
                                }`}
                            >
                                <Icon size={14} />
                            </div>
                            <span
                                className={`text-xs font-medium hidden sm:block ${
                                    step.completed
                                        ? "text-emerald-400"
                                        : step.active
                                        ? "text-white"
                                        : "text-surface-600"
                                }`}
                            >
                                {step.label}
                            </span>
                            {i < steps.length - 1 && (
                                <div className="flex-1 h-px bg-white/8 mx-1 hidden sm:block" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            {ctaLabel && !isApproved && (
                <Link
                    href={ctaHref}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 text-sm font-semibold transition-all border border-brand-500/20"
                >
                    {ctaLabel}
                    <ArrowRight size={14} />
                </Link>
            )}
        </motion.div>
    );
}
