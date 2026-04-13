"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    ShieldAlert,
    Search,
    ChevronLeft,
    ChevronRight,
    Clock,
    Activity,
    Users,
    ChevronDown,
    ChevronUp,
    Download,
    X,
    RefreshCw,
    Terminal,
} from "lucide-react";
import { Badge, Button, adminFetch, useLocale } from "@kbouffe/module-core/ui";
import { useAdminQuery } from "@/hooks/use-admin-query";
import { cn } from "@/lib/utils";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminStatsCardsSkeleton } from "@/components/admin/AdminStatsCardsSkeleton";
import { ExportCSVButton } from "@/components/admin/ExportCSVButton";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditLog {
    id: string;
    adminId: string | null;
    adminName: string | null;
    adminEmail: string | null;
    adminRole: string | null;
    action: string;
    targetType: string;
    targetId: string;
    details: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
}

interface AuditResponse {
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
}

interface AuditStats {
    today: number;
    thisWeek: number;
    activeAdmins: number;
    mostFrequentAction: string | null;
    topAdmins: Array<{ id: string; name: string | null; email: string | null; role: string | null; count: number }>;
    topActions: Array<{ action: string; count: number }>;
}

// ── Action label map ──────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
    ban_user: "Suspension utilisateur",
    unban_user: "Levée de suspension",
    create_user: "Création utilisateur",
    delete_user: "Suppression utilisateur",
    update_user: "Modification utilisateur",
    impersonate_user: "Connexion admin (impersonate)",
    reset_password_request: "Réinitialisation mot de passe",
    approve_restaurant: "Approbation restaurant",
    block_restaurant: "Blocage restaurant",
    kyc_approve: "KYC approuvé",
    kyc_reject: "KYC rejeté",
    update_restaurant: "Modification restaurant",
    delete_restaurant: "Suppression restaurant",
    enable_module: "Module activé",
    disable_module: "Module désactivé",
    update_member: "Modification membre",
    revoke_member: "Révocation membre",
    refund_order: "Remboursement commande",
    update_order_status: "Mise à jour statut commande",
    update_payout: "Mise à jour paiement",
    manual_payout: "Paiement manuel",
    hide_review: "Masquage avis",
    show_review: "Publication avis",
    update_setting: "Modification réglage",
    bulk_update_settings: "Mise à jour réglages",
};

// ── Severity classification ────────────────────────────────────────────────────

type Severity = "danger" | "success" | "warning" | "neutral";

function getSeverity(action: string): Severity {
    if (["ban_user", "delete_user", "delete_restaurant", "refund_order", "kyc_reject", "block_restaurant", "revoke_member", "hide_review"].includes(action)) return "danger";
    if (["approve_restaurant", "unban_user", "kyc_approve", "show_review"].includes(action)) return "success";
    if (["impersonate_user", "manual_payout", "update_payout", "reset_password_request", "disable_module"].includes(action)) return "warning";
    return "neutral";
}

const SEVERITY_STYLES: Record<Severity, string> = {
    danger:  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    neutral: "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700",
};

const ROLE_LABELS: Record<string, string> = {
    super_admin: "Super Admin",
    support:     "Support",
    sales:       "Ventes",
    moderator:   "Modérateur",
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

// ── Detail cell ────────────────────────────────────────────────────────────────

function DetailCell({ details }: { details: Record<string, unknown> | null }) {
    const [open, setOpen] = useState(false);
    if (!details || Object.keys(details).length === 0) return <span className="text-surface-400">—</span>;

    const preview = Object.entries(details)
        .slice(0, 2)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(", ");

    return (
        <div className="max-w-xs">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {open ? "Masquer" : "Voir détails"}
            </button>
            {!open && <p className="text-[11px] text-surface-500 truncate mt-0.5">{preview}</p>}
            {open && (
                <pre className="mt-2 text-[10px] font-mono bg-surface-50 dark:bg-surface-900 p-3 rounded-xl border border-surface-200 dark:border-surface-700 overflow-auto max-h-40 text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                    {JSON.stringify(details, null, 2)}
                </pre>
            )}
        </div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    return (
        <div className={cn("relative overflow-hidden rounded-2xl border p-6 flex items-center gap-5 bg-white dark:bg-surface-900", "border-surface-200 dark:border-surface-800 hover:shadow-lg transition-shadow")}>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", color)}>
                <Icon size={22} strokeWidth={1.5} />
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-surface-400 mb-0.5">{label}</p>
                <p className="text-2xl font-black text-surface-900 dark:text-white tabular-nums">{value}</p>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAuditLogsPage() {
    const { t } = useLocale();

    // Stats
    const { data: stats, loading: statsLoading } = useAdminQuery<AuditStats>("/api/admin/system/audit/stats");

    // Filters
    const [search,     setSearch]     = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [adminFilter,   setAdminFilter]   = useState("");
    const [actionFilter,  setActionFilter]  = useState("");
    const [dateFrom,      setDateFrom]      = useState("");
    const [dateTo,        setDateTo]        = useState("");
    const [page,          setPage]          = useState(1);
    const LIMIT = 50;

    // Debounce search
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    // Build query URL
    const queryUrl = (() => {
        const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (adminFilter)     params.set("admin_id", adminFilter);
        if (actionFilter)    params.set("action", actionFilter);
        if (dateFrom)        params.set("date_from", dateFrom);
        if (dateTo)          params.set("date_to", dateTo);
        return `/api/admin/system/audit?${params}`;
    })();

    const { data, loading, refetch } = useAdminQuery<AuditResponse>(queryUrl);

    const logs       = data?.logs ?? [];
    const total      = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 0;

    // Unique action types from current page + known list
    const uniqueActions = Array.from(new Set([...Object.keys(ACTION_LABELS), ...logs.map(l => l.action)])).sort();

    const resetFilters = () => {
        setSearch(""); setDebouncedSearch(""); setAdminFilter(""); setActionFilter(""); setDateFrom(""); setDateTo(""); setPage(1);
    };

    const hasFilters = search || adminFilter || actionFilter || dateFrom || dateTo;

    // CSV export
    const exportCSV = () => {
        const headers = ["Horodatage", "Admin", "Rôle", "Action", "Cible Type", "Cible ID", "IP", "Détails"];
        const rows = logs.map(log => [
            new Date(log.createdAt).toLocaleString("fr-FR"),
            log.adminName ?? log.adminEmail ?? log.adminId ?? "—",
            ROLE_LABELS[log.adminRole ?? ""] ?? log.adminRole ?? "—",
            ACTION_LABELS[log.action] ?? log.action,
            log.targetType,
            log.targetId,
            log.ipAddress ?? "—",
            log.details ? JSON.stringify(log.details).replace(/"/g, "'") : "—",
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url;
        link.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-100 dark:border-surface-800 pb-8">
                <div>
                    <div className="flex items-center gap-2 text-brand-500 mb-1">
                        <Terminal size={16} />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">Traçabilité</span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tighter">Journal d&apos;audit</h1>
                    <p className="text-surface-500 mt-1 max-w-xl">
                        Toutes les actions administratives enregistrées, filtrables et exportables.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        className="flex items-center gap-2 rounded-xl"
                    >
                        <RefreshCw size={15} />
                        Actualiser
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportCSV}
                        disabled={logs.length === 0}
                        className="flex items-center gap-2 rounded-xl"
                    >
                        <Download size={15} />
                        Exporter CSV
                    </Button>
                    <ExportCSVButton data={logs} filename="audit-logs" disabled={logs.length === 0} />
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                    <AdminStatsCardsSkeleton cards={4} />
                ) : (
                    <>
                        <StatCard label="Actions aujourd'hui" value={stats?.today ?? 0} icon={Clock} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
                        <StatCard label="Cette semaine" value={stats?.thisWeek ?? 0} icon={Activity} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
                        <StatCard label="Admins actifs" value={stats?.activeAdmins ?? 0} icon={Users} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
                        <StatCard
                            label="Action la plus fréquente"
                            value={stats?.mostFrequentAction ? (ACTION_LABELS[stats.mostFrequentAction] ?? stats.mostFrequentAction) : "—"}
                            icon={ShieldAlert}
                            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        />
                    </>
                )}
            </div>

            {/* ── Filters ── */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 space-y-4">
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher action, cible, IP…"
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Action filter */}
                    <select
                        value={actionFilter}
                        onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                        className="py-2.5 px-4 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[180px]"
                    >
                        <option value="">Toutes les actions</option>
                        {uniqueActions.map(a => (
                            <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
                        ))}
                    </select>

                    {/* Admin filter (top admins from stats) */}
                    <select
                        value={adminFilter}
                        onChange={e => { setAdminFilter(e.target.value); setPage(1); }}
                        className="py-2.5 px-4 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[160px]"
                    >
                        <option value="">Tous les admins</option>
                        {(stats?.topAdmins ?? []).map(a => (
                            <option key={a.id} value={a.id}>{a.name ?? a.email ?? a.id}</option>
                        ))}
                    </select>

                    {/* Date range */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                            className="py-2.5 px-3 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-surface-400 text-sm">→</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); setPage(1); }}
                            className="py-2.5 px-3 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {hasFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-red-500 transition-colors font-medium px-3 py-2.5"
                        >
                            <X size={14} />
                            Réinitialiser les filtres
                        </button>
                    )}
                </div>

                {total > 0 && (
                    <p className="text-xs text-surface-400 font-medium">
                        {total.toLocaleString("fr-FR")} entrée{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* ── Table ── */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-surface-400">Horodatage</th>
                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-surface-400">Admin</th>
                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-surface-400">Action</th>
                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-surface-400">Cible</th>
                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-surface-400">Détails</th>
                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-surface-400">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <AdminTableSkeleton rows={10} cols={6} />
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <AdminEmptyState
                                            title="Aucune entrée d'audit"
                                            description={hasFilters ? "Essayez de modifier vos filtres." : "Les actions admin apparaîtront ici."}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const severity = getSeverity(log.action);
                                    return (
                                        <tr key={log.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                            {/* Timestamp */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-surface-900 dark:text-white">
                                                        {new Date(log.createdAt).toLocaleDateString("fr-FR")}
                                                    </span>
                                                    <span className="text-[11px] text-surface-400 font-mono">
                                                        {new Date(log.createdAt).toLocaleTimeString("fr-FR")}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Admin */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold text-surface-900 dark:text-white truncate max-w-[140px]">
                                                        {log.adminName ?? log.adminEmail ?? "Admin inconnu"}
                                                    </span>
                                                    {log.adminRole && (
                                                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit", {
                                                            "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400": log.adminRole === "super_admin",
                                                            "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400": log.adminRole === "support",
                                                            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400": log.adminRole === "sales",
                                                            "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400": log.adminRole === "moderator",
                                                        })}>
                                                            {ROLE_LABELS[log.adminRole] ?? log.adminRole}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="px-4 py-4">
                                                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap", SEVERITY_STYLES[severity])}>
                                                    {ACTION_LABELS[log.action] ?? log.action}
                                                </span>
                                            </td>

                                            {/* Target */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">{log.targetType}</span>
                                                    <span className="text-xs font-mono text-surface-700 dark:text-surface-300 truncate max-w-[120px]" title={log.targetId}>
                                                        {log.targetId.length > 12 ? `…${log.targetId.slice(-10)}` : log.targetId}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Details */}
                                            <td className="px-4 py-4">
                                                <DetailCell details={log.details} />
                                            </td>

                                            {/* IP */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs font-mono text-surface-500">
                                                    {log.ipAddress ?? "local"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100 dark:border-surface-800">
                        <p className="text-sm text-surface-500">
                            Page {page} sur {totalPages} — {total.toLocaleString("fr-FR")} entrées
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="flex items-center gap-1 rounded-xl"
                            >
                                <ChevronLeft size={15} />
                                Précédent
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="flex items-center gap-1 rounded-xl"
                            >
                                Suivant
                                <ChevronRight size={15} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
