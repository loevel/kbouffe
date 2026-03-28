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
import { adminFetch } from "@kbouffe/module-core/ui";

type TableStat = { table: string; count: number | null };

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

export default function AdminBackupPage() {
    const [stats, setStats] = useState<TableStat[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [checkedAt, setCheckedAt] = useState<string | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Export config
    const [selectedTables, setSelectedTables] = useState<string[]>(["all"]);
    const [format, setFormat] = useState<"json" | "csv">("json");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [lastExport, setLastExport] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await adminFetch("/api/admin/backup/stats");
            const data = await res.json();
            setStats(data.tables ?? []);
            setTotalRows(data.total_rows ?? 0);
            setCheckedAt(data.checked_at ?? null);
        } catch {
            // silent
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const allTableNames = stats.map(s => s.table);

    const toggleTable = (table: string) => {
        if (table === "all") {
            setSelectedTables(["all"]);
            return;
        }
        setSelectedTables(prev => {
            const without = prev.filter(t => t !== "all");
            if (without.includes(table)) {
                const next = without.filter(t => t !== table);
                return next.length === 0 ? ["all"] : next;
            }
            const next = [...without, table];
            return next.length === allTableNames.length ? ["all"] : next;
        });
    };

    const effectiveTables =
        selectedTables.includes("all")
            ? "all"
            : selectedTables.join(",");

    const handleExport = async () => {
        if (format === "csv" && !selectedTables.includes("all") && selectedTables.length !== 1) {
            alert("Le format CSV ne supporte qu'une seule table. Sélectionnez une table ou passez en JSON.");
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

            const res = await adminFetch(`/api/admin/backup/export?${params}`);
            if (!res.ok) {
                const err = await res.json();
                alert(err.error ?? "Erreur lors de l'export");
                return;
            }

            const disposition = res.headers.get("Content-Disposition") ?? "";
            const match = disposition.match(/filename="([^"]+)"/);
            const filename = match?.[1] ?? `kbouffe-backup.${format}`;

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            setLastExport(new Date().toLocaleString("fr-FR"));
        } catch {
            alert("Erreur de connexion. Réessayez.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl pb-16">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                            <HardDrive size={20} className="text-white" />
                        </div>
                        Backup & Export des données
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Exportez tout ou partie des données de la plateforme kBouffe au format JSON ou CSV.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchStats}
                    disabled={loadingStats}
                    className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                    <RefreshCw size={16} className={loadingStats ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Données sensibles :</strong> les fichiers exportés contiennent des informations personnelles (emails, adresses, commandes). Ne pas partager ces fichiers. Stockez-les dans un emplacement sécurisé.
                </div>
            </div>

            {/* Table stats */}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-surface-100 dark:divide-surface-800">
                    {loadingStats
                        ? Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="p-4 animate-pulse">
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

            {/* Export configurator */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                    <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                        <Download size={16} className="text-indigo-500" />
                        Configurer l'export
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Table selection */}
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
                            {allTableNames.map(table => {
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

                    {/* Format + Date range */}
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
                                onChange={e => setFromDate(e.target.value)}
                                className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                <span className="flex items-center gap-1.5"><Calendar size={13} /> Jusqu'au</span>
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Summary */}
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

                    {/* Download button */}
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

            {/* Disaster recovery info */}
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
                            desc: "Point-in-time recovery automatique (plan Pro). Restauration jusqu'à 7 jours en arrière.",
                            color: "border-green-500/30 bg-green-500/5",
                            badge: "Automatique",
                            badgeColor: "bg-green-500/20 text-green-300",
                        },
                        {
                            level: "Niveau 2",
                            title: "Export manuel",
                            desc: "Cet outil. Téléchargez un snapshot JSON complet à tout moment. Stockez hors-ligne.",
                            color: "border-indigo-500/30 bg-indigo-500/5",
                            badge: "Manuel",
                            badgeColor: "bg-indigo-500/20 text-indigo-300",
                        },
                        {
                            level: "Niveau 3",
                            title: "Archive D1 Cloudflare",
                            desc: "Audit logs archivés automatiquement dans Cloudflare D1 — immuable et séparé.",
                            color: "border-orange-500/30 bg-orange-500/5",
                            badge: "Bientôt",
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
