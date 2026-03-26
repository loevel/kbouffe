"use client";

import { useState, useEffect } from "react";
import { Card, Badge, Spinner, EmptyState } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";
import type { CapitalApplication, ApplicationStatus } from "../../lib/types";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }> = {
    draft:     { label: "Brouillon",  variant: "default" },
    submitted: { label: "Soumis",     variant: "info" },
    reviewing: { label: "En cours",   variant: "warning" },
    approved:  { label: "Approuvé",   variant: "success" },
    rejected:  { label: "Rejeté",     variant: "danger" },
};

function formatFcfa(amount: number) {
    return amount.toLocaleString("fr-FR") + " FCFA";
}

export function CapitalApplicationsList() {
    const [applications, setApplications] = useState<CapitalApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authFetch("/api/capital/applications");
                if (!res.ok) {
                    const data = await res.json() as { error?: string };
                    throw new Error(data.error ?? "Erreur lors du chargement des demandes.");
                }
                const data = await res.json() as { applications: CapitalApplication[] };
                setApplications(data.applications ?? []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue.");
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Mes demandes de financement</h2>

            {loading && (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            )}

            {error && !loading && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {!loading && !error && applications.length === 0 && (
                <EmptyState
                    title="Aucune demande"
                    description="Vous n'avez pas encore soumis de demande de financement."
                />
            )}

            {!loading && applications.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-700">
                                {["Date", "Score", "Grade", "Banque", "Montant demandé", "Statut"].map((col) => (
                                    <th key={col} className="text-left px-3 py-2.5 font-medium text-surface-500 dark:text-surface-400">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                            {applications.map((app) => {
                                const status = STATUS_CONFIG[app.status];
                                return (
                                    <tr key={app.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                                        <td className="px-3 py-3 text-surface-600 dark:text-surface-400 whitespace-nowrap">
                                            {new Date(app.created_at).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-3 py-3 font-medium text-surface-900 dark:text-white">
                                            {app.score}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                                                app.risk_grade === "A" ? "bg-green-500" :
                                                app.risk_grade === "B" ? "bg-yellow-500" :
                                                app.risk_grade === "C" ? "bg-orange-500" : "bg-red-500"
                                            }`}>
                                                {app.risk_grade}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                                            {app.bank_partner}
                                        </td>
                                        <td className="px-3 py-3 font-medium text-surface-900 dark:text-white whitespace-nowrap">
                                            {formatFcfa(app.requested_amount)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
