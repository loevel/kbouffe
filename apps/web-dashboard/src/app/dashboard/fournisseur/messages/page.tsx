"use client";

/**
 * Messages — Dashboard Fournisseur KBouffe
 *
 * Boîte de réception des demandes de devis (RFQ) et messages
 * envoyés par les restaurants.
 *
 * Fonctionnalités:
 *  - Liste des messages avec badge non-lu
 *  - Filtres : Tous / Non lus / Répondus / Archivés
 *  - Modale de détail avec possibilité de répondre (texte libre)
 *  - Affichage du restaurant expéditeur
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    Inbox,
    CheckCheck,
    Archive,
    Loader2,
    AlertCircle,
    X,
    Store,
    Package,
    Calendar,
    Send,
    Clock,
    ChevronRight,
    RefreshCw,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { useSupplier } from "../SupplierContext";

// ── Types ──────────────────────────────────────────────────────────────────

interface SupplierMessage {
    id: string;
    restaurant_id: string;
    supplier_id: string;
    product_id: string | null;
    message_type: "rfq" | "inquiry" | "order_note" | "complaint";
    subject: string | null;
    body: string;
    quantity: number | null;
    unit: string | null;
    requested_date: string | null;
    status: "unread" | "read" | "replied" | "archived";
    reply_body: string | null;
    replied_at: string | null;
    created_at: string;
    restaurants?: { id: string; name: string; city: string; logo_url: string | null };
}

type FilterTab = "all" | "unread" | "replied" | "archived";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
}

const TYPE_LABELS: Record<SupplierMessage["message_type"], string> = {
    rfq:        "Demande de devis",
    inquiry:    "Renseignement",
    order_note: "Note de commande",
    complaint:  "Réclamation",
};

const TYPE_COLORS: Record<SupplierMessage["message_type"], string> = {
    rfq:        "bg-brand-500/10 text-brand-300 border-brand-500/20",
    inquiry:    "bg-blue-500/10 text-blue-300 border-blue-500/20",
    order_note: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    complaint:  "bg-red-500/10 text-red-300 border-red-500/20",
};

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SupplierMessage["status"] }) {
    const cfg = {
        unread:   { label: "Non lu",  cls: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
        read:     { label: "Lu",      cls: "bg-surface-700 text-surface-400 border-white/8" },
        replied:  { label: "Répondu", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
        archived: { label: "Archivé", cls: "bg-surface-800 text-surface-500 border-white/5" },
    }[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ── Message detail modal ───────────────────────────────────────────────────

function MessageModal({
    msg,
    onClose,
    onUpdated,
}: {
    msg: SupplierMessage;
    onClose: () => void;
    onUpdated: (updated: SupplierMessage) => void;
}) {
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Marquer comme lu à l'ouverture
    useEffect(() => {
        if (msg.status === "unread") {
            authFetch(`/api/marketplace/messages/${msg.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "read" }),
            }).then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    onUpdated(data.message);
                }
            }).catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [msg.id]);

    async function handleReply() {
        if (!replyText.trim()) return;
        setSending(true);
        setErr(null);
        try {
            const res = await authFetch(`/api/marketplace/messages/${msg.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "replied", reply_body: replyText.trim() }),
            });
            if (!res.ok) throw new Error("Erreur lors de l'envoi");
            const data = await res.json();
            onUpdated(data.message);
            onClose();
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setSending(false);
        }
    }

    async function handleArchive() {
        setArchiving(true);
        try {
            const res = await authFetch(`/api/marketplace/messages/${msg.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "archived" }),
            });
            if (res.ok) {
                const data = await res.json();
                onUpdated(data.message);
                onClose();
            }
        } finally {
            setArchiving(false);
        }
    }

    const restaurant = msg.restaurants;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="relative w-full sm:max-w-lg bg-surface-900 rounded-t-3xl sm:rounded-2xl border border-white/8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                            <MessageCircle size={18} className="text-brand-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                                {msg.subject ?? TYPE_LABELS[msg.message_type]}
                            </p>
                            <p className="text-xs text-surface-500">{formatDate(msg.created_at)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-surface-400">
                        <X size={16} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    {/* Restaurant info */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/60 border border-white/8">
                        <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                            <Store size={16} className="text-brand-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                                {restaurant?.name ?? "Restaurant"}
                            </p>
                            {restaurant?.city && (
                                <p className="text-xs text-surface-500">{restaurant.city}</p>
                            )}
                        </div>
                        <span className={`ml-auto shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[msg.message_type]}`}>
                            {TYPE_LABELS[msg.message_type]}
                        </span>
                    </div>

                    {/* Détails RFQ */}
                    {(msg.quantity || msg.requested_date) && (
                        <div className="grid grid-cols-2 gap-3">
                            {msg.quantity && (
                                <div className="p-3 rounded-xl bg-surface-800/40 border border-white/5">
                                    <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-0.5">
                                        <Package size={12} /> Quantité souhaitée
                                    </div>
                                    <p className="text-sm font-bold text-white">
                                        {msg.quantity} {msg.unit ?? ""}
                                    </p>
                                </div>
                            )}
                            {msg.requested_date && (
                                <div className="p-3 rounded-xl bg-surface-800/40 border border-white/5">
                                    <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-0.5">
                                        <Calendar size={12} /> Date souhaitée
                                    </div>
                                    <p className="text-sm font-bold text-white">
                                        {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(msg.requested_date))}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Corps du message */}
                    <div className="p-4 rounded-xl bg-surface-800/40 border border-white/6">
                        <p className="text-xs text-surface-500 mb-2">Message</p>
                        <p className="text-sm text-surface-200 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>

                    {/* Réponse existante */}
                    {msg.reply_body && (
                        <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                            <p className="text-xs text-emerald-500 mb-2">Votre réponse ({msg.replied_at ? formatDate(msg.replied_at) : ""})</p>
                            <p className="text-sm text-emerald-200 whitespace-pre-wrap">{msg.reply_body}</p>
                        </div>
                    )}

                    {/* Formulaire de réponse */}
                    {msg.status !== "replied" && msg.status !== "archived" && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-surface-300">Votre réponse</label>
                            <textarea
                                rows={4}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Répondez directement ici (tarif, disponibilité, délai…)"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
                            />
                            {err && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{err}</p>}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {msg.status !== "archived" && (
                    <div className="px-5 py-4 border-t border-white/8 shrink-0 flex items-center gap-3">
                        {msg.status !== "replied" && (
                            <button
                                onClick={handleReply}
                                disabled={sending || !replyText.trim()}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                {sending ? "Envoi…" : "Répondre"}
                            </button>
                        )}
                        <button
                            onClick={handleArchive}
                            disabled={archiving}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white text-sm rounded-xl transition-colors"
                        >
                            {archiving ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                            Archiver
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function MessagesPage() {
    const { supplier } = useSupplier();
    const [messages, setMessages] = useState<SupplierMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [selectedMsg, setSelectedMsg] = useState<SupplierMessage | null>(null);

    async function fetchMessages() {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch("/api/marketplace/messages?role=supplier");
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json() as any;
            setMessages(data.messages ?? []);
        } catch (e: any) {
            setError(e.message ?? "Erreur de chargement");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (supplier) fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supplier]);

    function handleUpdated(updated: SupplierMessage) {
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        if (selectedMsg?.id === updated.id) setSelectedMsg(updated);
    }

    const tabs: { key: FilterTab; label: string; icon: React.ElementType }[] = [
        { key: "all",      label: "Tous",      icon: Inbox     },
        { key: "unread",   label: "Non lus",   icon: MessageCircle },
        { key: "replied",  label: "Répondus",  icon: CheckCheck },
        { key: "archived", label: "Archivés",  icon: Archive   },
    ];

    const filtered = useMemo(() =>
        activeTab === "all"
            ? messages
            : messages.filter((m) => m.status === activeTab),
        [messages, activeTab]
    );

    const unreadCount = useMemo(() => messages.filter((m) => m.status === "unread").length, [messages]);

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            Messages
                            {unreadCount > 0 && (
                                <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-surface-400 text-sm mt-1">
                            Demandes de devis et messages des restaurants
                        </p>
                    </div>
                    <button
                        onClick={fetchMessages}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white text-sm rounded-xl transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Actualiser
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {tabs.map((tab) => {
                        const count = tab.key === "all"
                            ? messages.length
                            : messages.filter((m) => m.status === tab.key).length;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                                    activeTab === tab.key
                                        ? "bg-brand-500/15 text-brand-300 border-brand-500/25"
                                        : "bg-surface-900 text-surface-400 border-white/8 hover:text-white hover:bg-surface-800"
                                }`}
                            >
                                <Icon size={15} />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`min-w-[18px] h-[18px] rounded-full text-xs flex items-center justify-center px-1 ${
                                        activeTab === tab.key ? "bg-brand-500/30 text-brand-200" : "bg-surface-700 text-surface-400"
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* Liste */}
                <div className="bg-surface-900 rounded-2xl border border-white/8 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={24} className="text-brand-400 animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-white/8 flex items-center justify-center mb-4">
                                <Inbox size={24} className="text-surface-500" />
                            </div>
                            <p className="text-white font-semibold mb-2">
                                {activeTab === "all" ? "Aucun message reçu" : "Aucun message dans cette catégorie"}
                            </p>
                            <p className="text-sm text-surface-500 max-w-sm">
                                {activeTab === "all"
                                    ? "Les demandes de devis et messages des restaurants apparaîtront ici."
                                    : "Changez de filtre pour voir d'autres messages."}
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {filtered.map((msg, i) => (
                                <motion.li
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <button
                                        onClick={() => setSelectedMsg(msg)}
                                        className={`w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-white/3 transition-colors ${
                                            msg.status === "unread" ? "bg-brand-500/4" : ""
                                        }`}
                                    >
                                        {/* Avatar restaurant */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            msg.status === "unread"
                                                ? "bg-brand-500/15 text-brand-400"
                                                : "bg-surface-800 text-surface-500"
                                        }`}>
                                            <Store size={18} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-white truncate">
                                                    {msg.restaurants?.name ?? "Restaurant"}
                                                </span>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[msg.message_type]}`}>
                                                    {TYPE_LABELS[msg.message_type]}
                                                </span>
                                            </div>
                                            <p className="text-xs text-surface-400 mt-0.5 truncate">
                                                {msg.subject ?? msg.body}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <StatusBadge status={msg.status} />
                                                <span className="flex items-center gap-1 text-[10px] text-surface-600">
                                                    <Clock size={10} />
                                                    {formatDate(msg.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight size={16} className="text-surface-600 shrink-0" />
                                    </button>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedMsg && (
                    <MessageModal
                        msg={selectedMsg}
                        onClose={() => setSelectedMsg(null)}
                        onUpdated={handleUpdated}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
