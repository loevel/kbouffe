"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Headset,
    User,
    Mail,
    Phone,
    Calendar,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    Store,
    FileText,
    UserCheck,
} from "lucide-react";
import { Badge } from "@kbouffe/module-core/ui";

interface TicketDetail {
    id: string;
    reporterId: string | null;
    reporterType: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    restaurantId: string | null;
    orderId: string | null;
    createdAt: string;
    resolvedAt: string | null;
    reporterName: string | null;
    reporterEmail: string | null;
    reporterPhone: string | null;
    assigneeName: string | null;
    assigneeEmail: string | null;
}

const statusBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
    open: { label: "Ouvert", variant: "warning" },
    in_progress: { label: "En cours", variant: "info" },
    resolved: { label: "Résolu", variant: "success" },
    closed: { label: "Fermé", variant: "default" },
};

const priorityBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" }> = {
    low: { label: "Basse", variant: "default" },
    medium: { label: "Moyenne", variant: "warning" },
    high: { label: "Haute", variant: "danger" },
    urgent: { label: "Urgente", variant: "danger" },
};

export default function AdminSupportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/admin/support/${id}`);
                if (res.ok) setTicket(await res.json());
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const updateTicket = async (updates: Record<string, string>) => {
        if (!ticket) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/support", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: ticket.id, ...updates }),
            });
            if (res.ok) setTicket({ ...ticket, ...updates } as TicketDetail);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64 text-surface-400">Chargement...</div>;
    if (!ticket) return (
        <div className="text-center py-16">
            <p className="text-surface-400">Ticket introuvable</p>
            <Link href="/admin/support" className="text-brand-500 text-sm mt-2 inline-block">← Retour</Link>
        </div>
    );

    const t = ticket;
    const sb = statusBadge[t.status] ?? statusBadge.open;
    const pb = priorityBadge[t.priority] ?? priorityBadge.medium;
    const formatDate = (val: string | null) =>
        val ? new Date(val).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

    return (
        <>
            <Link href="/admin/support" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-brand-500 transition-colors mb-6">
                <ArrowLeft size={16} /> Retour aux tickets
            </Link>

            {/* Header */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                            <Headset size={22} /> {t.subject}
                        </h1>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant={sb.variant}>{sb.label}</Badge>
                            <Badge variant={pb.variant}>
                                {t.priority === "urgent" && <AlertTriangle size={10} className="inline mr-1" />}
                                Priorité {pb.label}
                            </Badge>
                            <Badge variant="default">{t.reporterType}</Badge>
                        </div>
                    </div>
                    <p className="text-xs text-surface-400">ID: {t.id.substring(0, 8)}…</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Description */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Description</h3>
                    <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
                        {t.description}
                    </p>

                    {/* References */}
                    {(t.restaurantId || t.orderId) && (
                        <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800">
                            <p className="text-xs font-medium text-surface-500 mb-2">Références</p>
                            <div className="flex gap-3 flex-wrap">
                                {t.restaurantId && (
                                    <Link href={`/admin/restaurants/${t.restaurantId}`} className="flex items-center gap-1 text-xs text-brand-500 hover:underline">
                                        <Store size={12} /> Restaurant {t.restaurantId.substring(0, 8)}…
                                    </Link>
                                )}
                                {t.orderId && (
                                    <span className="flex items-center gap-1 text-xs text-surface-500">
                                        <FileText size={12} /> Commande {t.orderId.substring(0, 8)}…
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Reporter */}
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                        <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Rapporteur</h3>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300"><User size={14} className="text-surface-400" /> {t.reporterName ?? "—"}</p>
                            <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300"><Mail size={14} className="text-surface-400" /> {t.reporterEmail ?? "—"}</p>
                            {t.reporterPhone && <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300"><Phone size={14} className="text-surface-400" /> {t.reporterPhone}</p>}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                        <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Dates</h3>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300"><Calendar size={14} className="text-surface-400" /> Créé: {formatDate(t.createdAt)}</p>
                            <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300"><CheckCircle size={14} className="text-surface-400" /> Résolu: {formatDate(t.resolvedAt)}</p>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                        <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Assigné à</h3>
                        <p className="text-sm text-surface-700 dark:text-surface-300 flex items-center gap-2">
                            <UserCheck size={14} className="text-surface-400" /> {t.assigneeName ?? t.assigneeEmail ?? "Non assigné"}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                        <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Changer le statut</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(["open", "in_progress", "resolved", "closed"] as const).map((s) => {
                                const sbi = statusBadge[s];
                                return (
                                    <button
                                        key={s}
                                        onClick={() => updateTicket({ status: s })}
                                        disabled={saving || t.status === s}
                                        className={`px-3 py-2 text-xs rounded-xl border transition-colors ${t.status === s
                                                ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                                : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                                            }`}
                                    >
                                        {sbi?.label ?? s}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                            <p className="text-xs font-medium text-surface-500 mb-2">Priorité</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(["low", "medium", "high", "urgent"] as const).map((p) => {
                                    const pbi = priorityBadge[p];
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => updateTicket({ priority: p })}
                                            disabled={saving || t.priority === p}
                                            className={`px-3 py-2 text-xs rounded-xl border transition-colors ${t.priority === p
                                                    ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                                    : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                                                }`}
                                        >
                                            {pbi?.label ?? p}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
