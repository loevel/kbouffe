"use client";

import { useState, useEffect, useCallback } from "react";
import {
    HardDrive,
    Download,
    Loader2,
    CheckCircle2,
    Database,
    FileJson,
    FileText,
    Calendar,
    RefreshCw,
    ShieldAlert,
    Package,
    Users,
    ShoppingBag,
    Star,
    Store,
    BarChart3,
    Layers,
    AlertTriangle,
    Info,
} from "lucide-react";
import { adminFetch, toast } from "@kbouffe/module-core/ui";

type TableStat = { table: string; count: number | null };

type BackupJob = {
    id: string;
    tables: string[];
    format: "json" | "csv";
    status: string;
    dateFrom: string | null;
    dateTo: string | null;
    rowCount: number;
    fileName: string | null;
    fileSizeBytes: number;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
};

type RestoreRequest = {
    id: string;
    backupJobId: string | null;
    restoreScope: string;
    sourceReference: string | null;
    reason: string;
    status: string;
    reviewNotes: string | null;
    createdAt: string;
    updatedAt: string;
    reviewedAt: string | null;
};

type BackupStatsResponse = {
    tables?: TableStat[];
    total_rows?: number;
    checked_at?: string | null;
};

type BackupHistoryResponse = {
    jobs?: BackupJob[];
};

type RestoreRequestsResponse = {
    requests?: RestoreRequest[];
};

const TABLE_ICONS: Record<string, any> = {
    restaurants: Store,
    users: Users,
    orders: ShoppingBag,
    order_items: Layers,
    products: Package,
    categories: BarChart3,
    reviews: Star,
    marketplace_purchases: Database,
    marketplace_services: Database,
    platform_integrations: Database,
    social_accounts: Database,
    social_posts: Database,
};

const TABLE_LABELS: Record<string, string> = {
    restaurants: "Restaurants",
    users: "Utilisateurs",
    orders: "Commandes",
    order_items: "Articles commandés",
    products: "Produits",
    categories: "Catégories",
    reviews: "Avis clients",
    marketplace_purchases: "Achats marketplace",
    marketplace_services: "Services marketplace",
    platform_integrations: "Intégrations",
    social_accounts: "Comptes sociaux",
    social_posts: "Publications sociales",
};

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return fallback;

    const payload = await response.json() as { error?: string };
    return payload.error ?? fallback;
}

function formatFileSize(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)} KB`;
    return `${value} B`;
}

function statusClassName(status: string): string {
    if (status === "completed" || status === "approved") {
        return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300";
    }
    if (status === "failed" || status === "rejected" || status === "cancelled") {
        return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
}

export default function AdminBackupPage() {
    const [stats, setStats] = useState<TableStat[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [checkedAt, setCheckedAt] = useState<string | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [history, setHistory] = useState<BackupJob[]>([]);
    const [restoreRequests, setRestoreRequests] = useState<RestoreRequest[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const [selectedTables, setSelectedTables] = useState<string[]>(["all"]);
    const [format, setFormat] = useState<"json" | "csv">("json");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [lastExport, setLastExport] = useState<string | null>(null);

    const [restoreScope, setRestoreScope] = useState<"full" | "orders" | "catalog" | "users" | "other">("orders");
    const [restoreReason, setRestoreReason] = useState("");
    const [restoreSourceReference, setRestoreSourceReference] = useState("");
    const [submittingRestore, setSubmittingRestore] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        setStatsError(null);

        try {
            const response = await adminFetch("/api/admin/backup/stats");
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Impossible de charger l'état des sauvegardes"));
            }

            const payload = await response.json() as BackupStatsResponse;
            setStats(payload.tables ?? []);
            setTotalRows(payload.total_rows ?? 0);
            setCheckedAt(payload.checked_at ?? null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Impossible de charger l'état des sauvegardes";
            setStatsError(message);
            toast.error(message);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);

        try {
            const [historyResponse, restoreResponse] = await Promise.all([
                adminFetch("/api/admin/backup/history?limit=8"),
                adminFetch("/api/admin/backup/restore-requests?limit=6"),
            ]);

            if (!historyResponse.ok) {
                throw new Error(await readErrorMessage(historyResponse, "Impossible de charger l'historique des exports"));
            }
            if (!restoreResponse.ok) {
                throw new Error(await readErrorMessage(restoreResponse, "Impossible de charger les demandes de restauration"));
            }

            const historyPayload = await historyResponse.json() as BackupHistoryResponse;
            const restorePayload = await restoreResponse.json() as RestoreRequestsResponse;

            setHistory(historyPayload.jobs ?? []);
            setRestoreRequests(restorePayload.requests ?? []);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Impossible de charger l'historique";
            toast.error(message);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        void fetchStats();
        void fetchHistory();
    }, [fetchStats, fetchHistory]);

    const allTableNames = stats.map((item) => item.table);

    const toggleTable = (table: string) => {
        if (table === "all") {
            setSelectedTables(["all"]);
            return;
        }

        setSelectedTables((previous) => {
            const withoutAll = previous.filter((value) => value !== "all");
            if (withoutAll.includes(table)) {
                const next = withoutAll.filter((value) => value !== table);
                return next.length === 0 ? ["all"] : next;
            }

            const next = [...withoutAll, table];
            return next.length === allTableNames.length ? ["all"] : next;
        });
    };

    const effectiveTables = selectedTables.includes("all")
        ? "all"
        : selectedTables.join(",");

    const handleExport = async () => {
        if (format === "csv" && !selectedTables.includes("all") && selectedTables.length !== 1) {
            toast.error("Le format CSV ne supporte qu'une seule table. Sélectionnez une table ou passez en JSON.");
            return;
        }

        setDownloading(true);

        try {
            const params = new URLSearchParams({
                tables: effectiveTables,
                format,
                ...(fromDate && { from: fromDate }),
                ...(toDate && { to: toDate }),
            });

            const response = await adminFetch(`/api/admin/backup/export?${params.toString()}`);
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Erreur lors de l'export"));
            }

            const disposition = response.headers.get("Content-Disposition") ?? "";
            const match = disposition.match(/filename="([^"]+)"/);
            const filename = match?.[1] ?? `kbouffe-backup.${format}`;

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
            URL.revokeObjectURL(url);

            setLastExport(new Date().toLocaleString("fr-FR"));
            toast.success("Export généré avec succès");
            void fetchStats();
            void fetchHistory();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur de connexion. Réessayez.";
            toast.error(message);
        } finally {
            setDownloading(false);
        }
    };

    const handleCreateRestoreRequest = async () => {
        if (restoreReason.trim().length < 10) {
            toast.error("Décrivez la raison de restauration en au moins 10 caractères.");
            return;
        }

        setSubmittingRestore(true);

        try {
            const response = await adminFetch("/api/admin/backup/restore-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restore_scope: restoreScope,
                    reason: restoreReason.trim(),
                    source_reference: restoreSourceReference.trim() || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Impossible d'enregistrer la demande de restauration"));
            }

            setRestoreReason("");
            setRestoreSourceReference("");
            toast.success("Demande de restauration enregistrée");
            void fetchHistory();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Impossible d'enregistrer la demande";
            toast.error(message);
        } finally {
            setSubmittingRestore(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl pb-16">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                            <HardDrive size={20} className="text-white" />
                        </div>
                        Backup & Export des données
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Exportez, historisez et préparez les restaurations sensibles depuis l&apos;interface admin.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        void fetchStats();
                        void fetchHistory();
                    }}
                    disabled={loadingStats || loadingHistory}
                    className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                    <RefreshCw size={16} className={loadingStats || loadingHistory ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Données sensibles :</strong> les fichiers exportés contiennent des informations personnelles. Ne partagez pas ces snapshots et stockez-les hors-ligne dans un coffre sécurisé.
                </div>
            </div>

            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                    <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                        <Database size={16} className="text-indigo-500" />
                        État de la base de données
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-surface-900 dark:text-white">
                            {loadingStats ? "…" : totalRows.toLocaleString("fr-FR")} lignes totales
                        </span>
                        {checkedAt && (
                            <span className="text-xs text-surface-400">
                                vérifié à {new Date(checkedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        )}
                    </div>
                </div>
                {statsError && (
                    <div className="px-6 py-3 border-b border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-sm text-red-700 dark:text-red-300">
                        {statsError}
                    </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-surface-100 dark:divide-surface-800">
                    {loadingStats
                        ? Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="p-4 animate-pulse">
                                <div className="h-4 bg-surface-100 dark:bg-surface-800 rounded w-24 mb-2" />
                                <div className="h-6 bg-surface-100 dark:bg-surface-800 rounded w-16" />
                            </div>
                        ))
                        : stats.map(({ table, count }) => {
                            const Icon = TABLE_ICONS[table] ?? Database;
                            return (
                                <div key={table} className="p-4">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Icon size={12} className="text-surface-400" />
                                        <span className="text-xs text-surface-500 dark:text-surface-400">
                                            {TABLE_LABELS[table] ?? table}
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-surface-900 dark:text-white tabular-nums">
                                        {count === null ? "—" : count.toLocaleString("fr-FR")}
                                    </p>
                                </div>
                            );
                        })}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                        <h2 className="font-semibold text-surface-900 dark:text-white">Exports récents</h2>
                        <span className="text-xs text-surface-400 uppercase tracking-widest">Historique</span>
                    </div>
                    <div className="divide-y divide-surface-100 dark:divide-surface-800">
                        {loadingHistory ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="p-4 animate-pulse">
                                    <div className="h-4 w-40 rounded bg-surface-100 dark:bg-surface-800 mb-2" />
                                    <div className="h-3 w-28 rounded bg-surface-100 dark:bg-surface-800" />
                                </div>
                            ))
                        ) : history.length === 0 ? (
                            <div className="p-6 text-sm text-surface-500 dark:text-surface-400">
                                Aucun export enregistré pour le moment.
                            </div>
                        ) : history.map((job) => (
                            <div key={job.id} className="p-4 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-surface-900 dark:text-white">
                                            {job.fileName ?? `Export ${job.format.toUpperCase()}`}
                                        </p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400">
                                            {job.tables.length === allTableNames.length ? "Toutes les tables" : job.tables.join(", ")}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusClassName(job.status)}`}>
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500 dark:text-surface-400">
                                    <span>{job.rowCount.toLocaleString("fr-FR")} lignes</span>
                                    <span>{formatFileSize(job.fileSizeBytes)}</span>
                                    <span>{new Date(job.createdAt).toLocaleString("fr-FR")}</span>
                                </div>
                                {job.errorMessage && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{job.errorMessage}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                        <h2 className="font-semibold text-surface-900 dark:text-white">Demandes de restauration</h2>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            Chaque restauration doit être justifiée, validée et exécutée manuellement.
                        </p>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Périmètre
                                </label>
                                <select
                                    value={restoreScope}
                                    onChange={(event) => setRestoreScope(event.target.value as "full" | "orders" | "catalog" | "users" | "other")}
                                    className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="orders">Commandes</option>
                                    <option value="catalog">Catalogue</option>
                                    <option value="users">Utilisateurs</option>
                                    <option value="full">Plateforme complète</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Référence source
                                </label>
                                <input
                                    type="text"
                                    value={restoreSourceReference}
                                    onChange={(event) => setRestoreSourceReference(event.target.value)}
                                    placeholder="Ex: backup JSON 2026-04-16 ou fenêtre PITR 09:30"
                                    className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Raison métier / incident
                            </label>
                            <textarea
                                value={restoreReason}
                                onChange={(event) => setRestoreReason(event.target.value)}
                                rows={4}
                                placeholder="Décrivez précisément l'incident, les données impactées et la fenêtre de restauration attendue."
                                className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={submittingRestore}
                            onClick={handleCreateRestoreRequest}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-semibold text-sm transition-colors disabled:opacity-60"
                        >
                            {submittingRestore ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                            Créer une demande de restauration
                        </button>

                        <div className="space-y-3 pt-2">
                            {restoreRequests.length === 0 ? (
                                <p className="text-sm text-surface-500 dark:text-surface-400">
                                    Aucune demande en cours.
                                </p>
                            ) : restoreRequests.map((request) => (
                                <div key={request.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white capitalize">
                                                {request.restoreScope.replace("_", " ")}
                                            </p>
                                            <p className="text-xs text-surface-500 dark:text-surface-400">
                                                {new Date(request.createdAt).toLocaleString("fr-FR")}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusClassName(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-surface-600 dark:text-surface-400">{request.reason}</p>
                                    {request.sourceReference && (
                                        <p className="text-xs text-surface-500 dark:text-surface-400">
                                            Source : {request.sourceReference}
                                        </p>
                                    )}
                                    {request.reviewNotes && (
                                        <p className="text-xs text-surface-500 dark:text-surface-400">
                                            Note de revue : {request.reviewNotes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                    <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                        <Download size={16} className="text-indigo-500" />
                        Configurer l&apos;export
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                            Tables à exporter
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => toggleTable("all")}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                    selectedTables.includes("all")
                                        ? "bg-indigo-500 border-indigo-500 text-white"
                                        : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-indigo-300"
                                }`}
                            >
                                Toutes ({allTableNames.length})
                            </button>
                            {allTableNames.map((table) => {
                                const selected = selectedTables.includes("all") || selectedTables.includes(table);
                                const Icon = TABLE_ICONS[table] ?? Database;

                                return (
                                    <button
                                        key={table}
                                        type="button"
                                        onClick={() => toggleTable(table)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                            selected
                                                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                                                : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-indigo-300"
                                        }`}
                                    >
                                        <Icon size={12} />
                                        {TABLE_LABELS[table] ?? table}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Format
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { value: "json", label: "JSON", icon: FileJson },
                                    { value: "csv", label: "CSV", icon: FileText },
                                ].map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setFormat(value as "json" | "csv")}
                                        className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                                            format === value
                                                ? "bg-indigo-500 border-indigo-500 text-white"
                                                : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-indigo-300"
                                        }`}
                                    >
                                        <Icon size={14} /> {label}
                                    </button>
                                ))}
                            </div>
                            {format === "csv" && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                    <AlertTriangle size={10} />
                                    CSV = une seule table
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                <span className="flex items-center gap-1.5"><Calendar size={13} /> Depuis</span>
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(event) => setFromDate(event.target.value)}
                                className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                <span className="flex items-center gap-1.5"><Calendar size={13} /> Jusqu&apos;au</span>
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(event) => setToDate(event.target.value)}
                                className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                        <Info size={16} className="text-surface-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-surface-600 dark:text-surface-400">
                            Export <strong className="text-surface-900 dark:text-white">{format.toUpperCase()}</strong> ·{" "}
                            <strong className="text-surface-900 dark:text-white">
                                {selectedTables.includes("all")
                                    ? `${allTableNames.length} tables`
                                    : `${selectedTables.length} table(s)`}
                            </strong>
                            {(fromDate || toDate) && (
                                <> · Période : {fromDate || "début"} → {toDate || "aujourd'hui"}</>
                            )}
                            {" "}· Limite 50 000 lignes par table.
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={downloading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 shadow-lg shadow-indigo-500/25"
                    >
                        {downloading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Génération du backup…
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Télécharger le backup
                            </>
                        )}
                    </button>

                    {lastExport && (
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 size={16} />
                            Dernier export généré le {lastExport}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gradient-to-br from-surface-900 to-black rounded-2xl p-8 text-white space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                    <ShieldAlert size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Disaster Recovery</span>
                </div>
                <h3 className="text-xl font-bold">Stratégie de sauvegarde kBouffe</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    {[
                        {
                            level: "Niveau 1",
                            title: "Supabase PITR",
                            desc: "Point-in-time recovery automatique. Restauration jusqu'à 7 jours en arrière après validation.",
                            color: "border-green-500/30 bg-green-500/5",
                            badge: "Automatique",
                            badgeColor: "bg-green-500/20 text-green-300",
                        },
                        {
                            level: "Niveau 2",
                            title: "Exports historisés",
                            desc: "Chaque export est tracé côté backend avec volume, statut et fichier généré.",
                            color: "border-indigo-500/30 bg-indigo-500/5",
                            badge: "Actif",
                            badgeColor: "bg-indigo-500/20 text-indigo-300",
                        },
                        {
                            level: "Niveau 3",
                            title: "Workflow de restauration",
                            desc: "Demandes formalisées, revues et auditées avant toute intervention manuelle en production.",
                            color: "border-orange-500/30 bg-orange-500/5",
                            badge: "Contrôlé",
                            badgeColor: "bg-orange-500/20 text-orange-300",
                        },
                    ].map(({ level, title, desc, color, badge, badgeColor }) => (
                        <div key={level} className={`p-4 rounded-xl border ${color}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-surface-400 uppercase">{level}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                            </div>
                            <p className="font-bold text-white mb-1">{title}</p>
                            <p className="text-xs text-surface-400 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
