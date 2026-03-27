"use client";

import { useState } from "react";
import { Button, Modal } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";

interface KYCFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function KYCForm({ onClose, onSuccess }: KYCFormProps) {
    const [rccm, setRccm] = useState("");
    const [nif, setNif] = useState("");
    const [licenceSanitaire, setLicenceSanitaire] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const res = await authFetch("/api/restaurant/kyc", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rccm, nif, licence_sanitaire: licenceSanitaire || undefined }),
            });
            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error ?? "Erreur lors de la soumission.");
            }
            setSuccess(true);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Dossier KYC">
            {success ? (
                <div className="p-4 text-center space-y-3">
                    <div className="text-3xl">✅</div>
                    <p className="font-semibold text-green-700 dark:text-green-300">Documents soumis avec succès !</p>
                    <p className="text-sm text-surface-500">Validation sous 2-5 jours ouvrables.</p>
                    <Button variant="secondary" onClick={onClose} className="w-full">Fermer</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5 p-2">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                            RCCM <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={rccm}
                            onChange={(e) => setRccm(e.target.value)}
                            placeholder="RC/YDE/2023/B/12345"
                            required
                            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <p className="text-xs text-surface-400">
                            Registre du Commerce et du Crédit Mobilier — délivré par le Greffe du Tribunal de Commerce.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                            NIF <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={nif}
                            onChange={(e) => setNif(e.target.value)}
                            placeholder="M123456789"
                            required
                            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <p className="text-xs text-surface-400">
                            Numéro Identifiant Unique/Fiscal — délivré par la Direction Générale des Impôts (DGI).
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                            Licence Sanitaire{" "}
                            <span className="text-surface-400 font-normal">(optionnelle)</span>
                        </label>
                        <input
                            value={licenceSanitaire}
                            onChange={(e) => setLicenceSanitaire(e.target.value)}
                            placeholder="Numéro de licence"
                            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <p className="text-xs text-surface-400">
                            Numéro délivré par le Ministère de la Santé Publique (MINSANTE).
                        </p>
                    </div>

                    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-xs text-red-700 dark:text-red-400 leading-relaxed">
                        Ces documents seront vérifiés par l'équipe KBouffe dans les 2-5 jours ouvrables. La publication de votre restaurant sera activée après validation.
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
                            Annuler
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={submitting}>
                            Soumettre
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
