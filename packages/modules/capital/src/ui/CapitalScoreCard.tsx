"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge, Spinner, EmptyState } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";
import type { CapitalScore, RiskGrade } from "../../lib/types";
import { CapitalApplicationForm } from "./CapitalApplicationForm";

const GRADE_CONFIG: Record<RiskGrade, { label: string; variant: "success" | "warning" | "danger" | "default"; color: string }> = {
    A: { label: "A", variant: "success", color: "bg-green-500" },
    B: { label: "B", variant: "warning", color: "bg-yellow-500" },
    C: { label: "C", variant: "default", color: "bg-orange-500" },
    D: { label: "D", variant: "danger", color: "bg-red-500" },
};

const BREAKDOWN_LABELS: Record<string, string> = {
    monthly_revenue: "Revenu mensuel",
    payment_rate: "Taux de paiement",
    orders_per_month: "Commandes / mois",
    account_age_months: "Ancienneté (mois)",
};

function formatFcfa(amount: number) {
    return amount.toLocaleString("fr-FR") + " FCFA";
}

export function CapitalScoreCard() {
    const [score, setScore] = useState<CapitalScore | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showApply, setShowApply] = useState(false);

    const fetchScore = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch("/api/capital/score");
            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error ?? "Erreur lors du calcul du score.");
            }
            const data = await res.json() as CapitalScore;
            setScore(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScore();
    }, []);

    const grade = score ? GRADE_CONFIG[score.risk_grade] : null;

    return (
        <>
            <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Score de financement</h2>
                        <p className="text-sm text-surface-500 mt-0.5">Évaluation de votre éligibilité au financement KBouffe Capital</p>
                    </div>
                    <Button onClick={fetchScore} isLoading={loading} variant="outline" size="sm">
                        Calculer mon score
                    </Button>
                </div>

                {loading && !score && (
                    <div className="flex justify-center py-10">
                        <Spinner />
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                {score && (
                    <>
                        {/* Score gauge */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Score global</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant={grade!.variant}>Grade {grade!.label}</Badge>
                                    <span className="text-2xl font-bold text-surface-900 dark:text-white">{score.score}</span>
                                    <span className="text-sm text-surface-500">/ 100</span>
                                </div>
                            </div>
                            <div className="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${grade!.color}`}
                                    style={{ width: `${score.score}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-surface-400">
                                <span>0</span>
                                <span>40 (seuil)</span>
                                <span>100</span>
                            </div>
                        </div>

                        {/* Eligibility banner */}
                        {score.eligible ? (
                            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-medium">
                                    <span>✅</span>
                                    <span>Éligible au financement — Montant max estimé : <strong>{formatFcfa(score.max_estimated_amount)}</strong></span>
                                </div>
                                <Button size="sm" onClick={() => setShowApply(true)}>
                                    Faire une demande
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 flex items-center gap-2 text-red-800 dark:text-red-300 font-medium">
                                <span>❌</span>
                                <span>Non éligible — score insuffisant (minimum requis : 40)</span>
                            </div>
                        )}

                        {/* Breakdown table */}
                        <div>
                            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Détail du score</h3>
                            <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-surface-50 dark:bg-surface-800">
                                            <th className="text-left px-4 py-2.5 font-medium text-surface-600 dark:text-surface-400">Critère</th>
                                            <th className="text-right px-4 py-2.5 font-medium text-surface-600 dark:text-surface-400">Valeur</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                                        {(Object.entries(score.breakdown) as [keyof typeof score.breakdown, number][]).map(([key, value]) => (
                                            <tr key={key} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                                                <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                                                    {BREAKDOWN_LABELS[key] ?? key}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-surface-900 dark:text-white">
                                                    {key === "monthly_revenue"
                                                        ? formatFcfa(value)
                                                        : key === "payment_rate"
                                                        ? `${(value * 100).toFixed(1)} %`
                                                        : value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <p className="text-xs text-surface-400 dark:text-surface-500">
                            Score calculé le {new Date(score.computed_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                        </p>
                    </>
                )}
            </Card>

            {showApply && score && (
                <CapitalApplicationForm
                    score={score}
                    onClose={() => setShowApply(false)}
                    onSuccess={() => {
                        setShowApply(false);
                    }}
                />
            )}
        </>
    );
}
