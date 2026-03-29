"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    LifeBuoy,
    Plus,
    Inbox,
    Clock,
    CheckCircle,
    XCircle,
    MessageSquare,
    ChevronRight,
    AlertTriangle,
    Loader2,
    X,
    Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
    id: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    lastRepliedAt: string | null;
    unreadReporter: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: "Ouvert", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10", icon: Inbox },
    in_progress: { label: "En cours", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", icon: Clock },
    resolved: { label: "Résolu", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle },
    closed: { label: "Fermé", color: "text-surface-400 bg-surface-100 dark:bg-surface-800", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: "Faible", color: "text-surface-500 bg-surface-100 dark:bg-surface-800" },
    medium: { label: "Moyenne", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    high: { label: "Haute", color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
    urgent: { label: "Urgente", color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
};

const CATEGORIES = [
    { value: "billing", label: "💳 Facturation" },
    { value: "technical", label: "🔧 Problème technique" },
    { value: "account", label: "👤 Mon compte" },
    { value: "feature", label: "💡 Suggestion" },
    { value: "urgent", label: "🚨 Urgent" },
    { value: "general", label: "📩 Général" },
];

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        subject: "",
        description: "",
        priority: "medium",
        category: "general",
    });

    const fetchTickets = useCallback(async () => {
        try {
            const res = await fetch("/api/dashboard/support");
            if (res.ok) {
                const { tickets } = await res.json();
                setTickets(tickets ?? []);
            }
        } catch {
            console.error("Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.description.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/dashboard/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const { ticket } = await res.json();
                setShowNew(false);
                setForm({ subject: "", description: "", priority: "medium", category: "general" });
                setTickets(prev => [ticket, ...prev]);
            } else {
                alert("Erreur lors de la création du ticket. Veuillez réessayer.");
            }
        } catch {
            alert("Erreur réseau. Veuillez réessayer.");
        } finally {
            setSubmitting(false);
        }
    };

    const totalUnread = tickets.reduce((acc, t) => acc + (t.unreadReporter ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <LifeBuoy size={20} className="text-brand-500" />
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Support</h1>
                        {totalUnread > 0 && (
                            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {totalUnread} nouveau{totalUnread > 1 ? "x" : ""}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        Contactez notre équipe pour toute question ou problème.
                    </p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-brand-500/25 shrink-0"
                >
                    <Plus size={16} />
                    Nouveau ticket
                </button>
            </div>

            {/* Tickets list */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-brand-500" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mb-4">
                            <LifeBuoy size={28} className="text-brand-500" />
                        </div>
                        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-1">
                            Aucun ticket pour l'instant
                        </h3>
                        <p className="text-sm text-surface-400 max-w-xs">
                            Besoin d'aide ? Créez votre premier ticket et notre équipe vous répondra rapidement.
                        </p>
                        <button
                            onClick={() => setShowNew(true)}
                            className="mt-5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            Créer un ticket
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                        {tickets.map((ticket) => {
                            const sc = statusConfig[ticket.status] ?? statusConfig.open;
                            const pc = priorityConfig[ticket.priority] ?? priorityConfig.medium;
                            const StatusIcon = sc.icon;
                            const hasUnread = ticket.unreadReporter > 0;

                            return (
                                <li key={ticket.id}>
                                    <Link
                                        href={`/dashboard/support/${ticket.id}`}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                                    >
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", sc.color)}>
                                            <StatusIcon size={18} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={cn("text-sm font-semibold truncate", hasUnread ? "text-brand-600 dark:text-brand-400" : "text-surface-900 dark:text-white")}>
                                                    {ticket.subject}
                                                </span>
                                                {hasUnread && (
                                                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-surface-400">
                                                <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", sc.color)}>
                                                    {sc.label}
                                                </span>
                                                <span>·</span>
                                                <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", pc.color)}>
                                                    {pc.label}
                                                </span>
                                                <span>·</span>
                                                <span>
                                                    {ticket.lastRepliedAt
                                                        ? new Date(ticket.lastRepliedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                                                        : new Date(ticket.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                                                </span>
                                            </div>
                                        </div>

                                        {hasUnread ? (
                                            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                                                {ticket.unreadReporter}
                                            </span>
                                        ) : (
                                            <ChevronRight size={16} className="text-surface-300 group-hover:text-surface-500 transition-colors shrink-0" />
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-blue-500" />
                <span>Notre équipe répond généralement sous <strong>24h</strong>. Pour les urgences, utilisez la priorité "Urgente".</span>
            </div>

            {/* New ticket modal */}
            {showNew && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                            <div className="flex items-center gap-2">
                                <Send size={18} className="text-brand-500" />
                                <h2 className="text-base font-semibold text-surface-900 dark:text-white">Nouveau ticket</h2>
                            </div>
                            <button
                                onClick={() => setShowNew(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                                    Catégorie
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                                form.category === cat.value
                                                    ? "bg-brand-500 text-white border-brand-500"
                                                    : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-brand-300"
                                            )}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                                    Sujet <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="Décrivez brièvement votre problème"
                                    maxLength={120}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Décrivez votre problème en détail. Plus vous donnez d'informations, plus nous pourrons vous aider rapidement."
                                    rows={4}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 resize-none"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                                    Priorité
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { value: "low", label: "Faible", color: "text-surface-600" },
                                        { value: "medium", label: "Moyenne", color: "text-blue-600" },
                                        { value: "high", label: "Haute", color: "text-orange-600" },
                                        { value: "urgent", label: "Urgente", color: "text-red-600" },
                                    ].map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                                            className={cn(
                                                "py-2 rounded-lg text-xs font-semibold transition-colors border",
                                                form.priority === p.value
                                                    ? "bg-brand-500 text-white border-brand-500"
                                                    : "bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-brand-300",
                                                form.priority !== p.value && p.color
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNew(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !form.subject.trim() || !form.description.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-brand-500/25"
                                >
                                    {submitting ? (
                                        <><Loader2 size={16} className="animate-spin" /> Envoi...</>
                                    ) : (
                                        <><Send size={16} /> Envoyer</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
