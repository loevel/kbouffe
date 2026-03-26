"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Spinner, EmptyState } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";

const CNPS_EMPLOYER_RATE = 0.112;
const CNPS_EMPLOYEE_RATE = 0.0525;

function computeIrpp(gross: number): number {
    // Simplified IRPP bracket estimate (Cameroon DGI schedule)
    const taxable = gross * 0.8;
    if (taxable <= 62000) return 0;
    if (taxable <= 150000) return taxable * 0.11;
    if (taxable <= 250000) return taxable * 0.165;
    if (taxable <= 500000) return taxable * 0.275;
    return taxable * 0.385;
}

function formatFcfa(amount: number) {
    return Math.round(amount).toLocaleString("fr-FR") + " FCFA";
}

interface StaffPayout {
    id: string;
    member_name: string;
    role: string;
    gross_amount: number;
    payment_status: string;
}

interface PayrollRow extends StaffPayout {
    cnps_employer: number;
    cnps_employee: number;
    irpp: number;
    net: number;
}

interface PayrollReportData {
    payouts: StaffPayout[];
}

export function PayrollReport() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [periodStart, setPeriodStart] = useState(firstOfMonth);
    const [periodEnd, setPeriodEnd] = useState(lastOfMonth);
    const [rows, setRows] = useState<PayrollRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const buildRows = (payouts: StaffPayout[]): PayrollRow[] =>
        payouts.map((p) => {
            const cnps_employer = p.gross_amount * CNPS_EMPLOYER_RATE;
            const cnps_employee = p.gross_amount * CNPS_EMPLOYEE_RATE;
            const irpp = computeIrpp(p.gross_amount);
            const net = p.gross_amount - cnps_employee - irpp;
            return { ...p, cnps_employer, cnps_employee, irpp, net };
        });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(
                `/api/payouts/payroll-report?period_start=${periodStart}&period_end=${periodEnd}`
            );
            if (!res.ok) throw new Error("Erreur lors de la génération du rapport.");
            const data = await res.json() as PayrollReportData;
            setRows(buildRows(data.payouts ?? []));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue.");
        } finally {
            setLoading(false);
        }
    }, [periodStart, periodEnd]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleConfirmPayment = async (id: string) => {
        setConfirmingId(id);
        try {
            await authFetch(`/api/payouts/staff/${id}/confirm`, { method: "PATCH" });
            fetchReport();
        } catch {
            // silently refetch
        } finally {
            setConfirmingId(null);
        }
    };

    const totalGross = rows.reduce((s, r) => s + r.gross_amount, 0);
    const totalCnpsEmployer = rows.reduce((s, r) => s + r.cnps_employer, 0);
    const totalCnpsEmployee = rows.reduce((s, r) => s + r.cnps_employee, 0);
    const totalIrpp = rows.reduce((s, r) => s + r.irpp, 0);
    const totalNet = rows.reduce((s, r) => s + r.net, 0);

    const summaryCards = [
        { label: "Total Brut", value: totalGross, color: "text-surface-900 dark:text-white" },
        { label: "CNPS Employeur (11,2%)", value: totalCnpsEmployer, color: "text-red-600 dark:text-red-400" },
        { label: "CNPS Salarié (5,25%)", value: totalCnpsEmployee, color: "text-orange-600 dark:text-orange-400" },
        { label: "IRPP estimé", value: totalIrpp, color: "text-yellow-600 dark:text-yellow-400" },
        { label: "Total Net", value: totalNet, color: "text-green-600 dark:text-green-400" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-5 space-y-4">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Rapport de paie</h2>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">Début de période</label>
                        <input
                            type="date"
                            value={periodStart}
                            onChange={(e) => setPeriodStart(e.target.value)}
                            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">Fin de période</label>
                        <input
                            type="date"
                            value={periodEnd}
                            onChange={(e) => setPeriodEnd(e.target.value)}
                            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {loading ? <Spinner /> : "Générer le rapport"}
                    </button>
                </div>
            </Card>

            {/* Summary cards */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {summaryCards.map((c) => (
                        <Card key={c.label} className="p-4 space-y-1">
                            <p className="text-xs text-surface-500 dark:text-surface-400">{c.label}</p>
                            <p className={`text-sm font-bold ${c.color}`}>{formatFcfa(c.value)}</p>
                        </Card>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Staff table */}
            {!loading && !error && rows.length === 0 && (
                <EmptyState
                    title="Aucune donnée"
                    description="Aucun membre du personnel trouvé pour cette période."
                />
            )}

            {!loading && rows.length > 0 && (
                <Card className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-700">
                                {["Membre", "Rôle", "Montant Brut", "CNPS Employeur", "CNPS Salarié", "IRPP estimé", "Net à payer", ""].map((col) => (
                                    <th key={col} className="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400 whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                            {rows.map((row) => (
                                <tr key={row.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">{row.member_name}</td>
                                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{row.role}</td>
                                    <td className="px-4 py-3 text-surface-900 dark:text-white">{formatFcfa(row.gross_amount)}</td>
                                    <td className="px-4 py-3 text-red-600 dark:text-red-400">{formatFcfa(row.cnps_employer)}</td>
                                    <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{formatFcfa(row.cnps_employee)}</td>
                                    <td className="px-4 py-3 text-yellow-600 dark:text-yellow-400">{formatFcfa(row.irpp)}</td>
                                    <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{formatFcfa(row.net)}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleConfirmPayment(row.id)}
                                            disabled={confirmingId === row.id || row.payment_status === "paid"}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {row.payment_status === "paid" ? "✓ Payé" : confirmingId === row.id ? "…" : "Confirmer paiement"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Legal disclaimer */}
            <div className="rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-5 space-y-1">
                <p className="text-sm font-bold text-orange-800 dark:text-orange-300">⚠️ Avertissement important</p>
                <p className="text-sm text-orange-700 dark:text-orange-400 leading-relaxed">
                    Ce rapport est fourni à titre <strong>INDICATIF</strong> uniquement. Le restaurateur est seul responsable du paiement effectif de son personnel et de ses obligations envers la CNPS et la Direction Générale des Impôts (DGI). KBouffe n'est pas un co-employeur et ne traite aucun versement salarial.
                </p>
            </div>
        </div>
    );
}
