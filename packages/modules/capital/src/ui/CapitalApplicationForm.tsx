"use client";

import { useState } from "react";
import { Button, Modal, Spinner } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";
import type { CapitalScore, CapitalApplication } from "../../lib/types";
import { BANK_PARTNERS } from "../../lib/types";

interface CapitalApplicationFormProps {
    score: CapitalScore;
    onClose: () => void;
    onSuccess: () => void;
}

function formatFcfa(amount: number) {
    return amount.toLocaleString("fr-FR") + " FCFA";
}

export function CapitalApplicationForm({ score, onClose, onSuccess }: CapitalApplicationFormProps) {
    const [bankPartner, setBankPartner] = useState<string>(BANK_PARTNERS[0]);
    const [requestedAmount, setRequestedAmount] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successApplication, setSuccessApplication] = useState<CapitalApplication | null>(null);

    const amountNum = parseInt(requestedAmount, 10);
    const amountValid = !isNaN(amountNum) && amountNum >= 100_000 && amountNum <= 10_000_000;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amountValid) return;

        setSubmitting(true);
        setError(null);
        try {
            const res = await authFetch("/api/capital/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requested_amount: amountNum, bank_partner: bankPartner }),
            });
            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error ?? "Erreur lors de la soumission.");
            }
            const data = await res.json() as CapitalApplication;
            setSuccessApplication(data);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Demande de financement">
            {successApplication ? (
                <div className="space-y-4 p-2">
                    <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 text-center space-y-2">
                        <div className="text-3xl">✅</div>
                        <p className="font-semibold text-green-800 dark:text-green-300">Demande soumise avec succès !</p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            Référence : <span className="font-mono font-bold">{successApplication.id}</span>
                        </p>
                        <p className="text-sm text-surface-600 dark:text-surface-400">
                            Vous serez contacté par <strong>{successApplication.bank_partner}</strong> pour la suite du processus.
                        </p>
                    </div>
                    <Button className="w-full" variant="secondary" onClick={onClose}>
                        Fermer
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5 p-2">
                    {/* Score recap */}
                    <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4 flex items-center justify-between text-sm">
                        <span className="text-surface-600 dark:text-surface-400">Score actuel</span>
                        <span className="font-bold text-surface-900 dark:text-white">{score.score}/100 — Grade {score.risk_grade}</span>
                    </div>

                    {/* Bank partner */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                            Banque partenaire
                        </label>
                        <select
                            value={bankPartner}
                            onChange={(e) => setBankPartner(e.target.value)}
                            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {BANK_PARTNERS.map((bank) => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                    </div>

                    {/* Requested amount */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                            Montant demandé (FCFA)
                        </label>
                        <input
                            type="number"
                            min={100_000}
                            max={10_000_000}
                            step={50_000}
                            value={requestedAmount}
                            onChange={(e) => setRequestedAmount(e.target.value)}
                            placeholder="Ex: 1 500 000"
                            required
                            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <p className="text-xs text-surface-400">
                            Min : {formatFcfa(100_000)} — Max : {formatFcfa(Math.min(10_000_000, score.max_estimated_amount))}
                        </p>
                        {requestedAmount && !amountValid && (
                            <p className="text-xs text-red-500">Montant invalide (min 100 000, max 10 000 000 FCFA).</p>
                        )}
                    </div>

                    {/* Legal disclaimer */}
                    <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-4 text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                        En soumettant cette demande, vous autorisez KBouffe à transmettre vos données d'activité à la banque sélectionnée à titre de rapport de scoring. Aucun engagement de prêt n'est créé. Le contrat sera signé directement entre vous et la banque.
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
                            Annuler
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={submitting} disabled={!amountValid}>
                            {submitting ? <Spinner /> : "Soumettre la demande"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
