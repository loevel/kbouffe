"use client";

/**
 * MessageSearch -- Barre de recherche + Threading des messages
 *
 * - Recherche par nom restaurant, produit, texte du message
 * - Threading: groupe les messages du meme restaurant
 * - Affiche nombre total de messages par thread
 * - Timeline chronologique dans chaque thread
 * - Collapse/expand threads
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    X,
    ChevronDown,
    ChevronRight,
    Store,
    MessageCircle,
    Clock,
    Package,
    Inbox,
} from "lucide-react";

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

interface MessageThread {
    restaurantId: string;
    restaurantName: string;
    restaurantCity: string;
    messages: SupplierMessage[];
    latestDate: string;
    unreadCount: number;
}

interface MessageSearchProps {
    messages: SupplierMessage[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    threadView: boolean;
    onToggleThreadView: () => void;
    onSelectMessage: (msg: SupplierMessage) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "A l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
}

const TYPE_LABELS: Record<string, string> = {
    rfq:        "Demande de devis",
    inquiry:    "Renseignement",
    order_note: "Note de commande",
    complaint:  "Reclamation",
};

const TYPE_COLORS: Record<string, string> = {
    rfq:        "bg-brand-500/10 text-brand-300 border-brand-500/20",
    inquiry:    "bg-blue-500/10 text-blue-300 border-blue-500/20",
    order_note: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    complaint:  "bg-red-500/10 text-red-300 border-red-500/20",
};

const STATUS_COLORS: Record<string, string> = {
    unread:   "bg-amber-500/10 text-amber-300 border-amber-500/20",
    read:     "bg-surface-700 text-surface-400 border-white/8",
    replied:  "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    archived: "bg-surface-800 text-surface-500 border-white/5",
};

const STATUS_LABELS: Record<string, string> = {
    unread:   "Non lu",
    read:     "Lu",
    replied:  "Repondu",
    archived: "Archive",
};

// ── Thread component ──────────────────────────────────────────────────────

function ThreadItem({
    thread,
    onSelectMessage,
}: {
    thread: MessageThread;
    onSelectMessage: (msg: SupplierMessage) => void;
}) {
    const [expanded, setExpanded] = useState(thread.unreadCount > 0);

    return (
        <div className="border-b border-white/5 last:border-0">
            {/* Thread header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
            >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    thread.unreadCount > 0
                        ? "bg-brand-500/15 text-brand-400"
                        : "bg-surface-800 text-surface-500"
                }`}>
                    <Store size={16} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                            {thread.restaurantName}
                        </span>
                        {thread.restaurantCity && (
                            <span className="text-[10px] text-surface-500">
                                {thread.restaurantCity}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-400">
                            {thread.messages.length} message{thread.messages.length > 1 ? "s" : ""}
                        </span>
                        {thread.unreadCount > 0 && (
                            <span className="bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                                {thread.unreadCount}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-surface-600 ml-auto">
                            <Clock size={10} />
                            {formatDate(thread.latestDate)}
                        </span>
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-surface-600 shrink-0"
                >
                    <ChevronRight size={14} />
                </motion.div>
            </button>

            {/* Thread messages (timeline) */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pl-8 pr-4 pb-3">
                            <div className="relative border-l-2 border-white/8 pl-4 space-y-1">
                                {thread.messages.map((msg, i) => (
                                    <motion.button
                                        key={msg.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => onSelectMessage(msg)}
                                        className={`w-full text-left p-2.5 rounded-lg hover:bg-white/4 transition-colors relative ${
                                            msg.status === "unread" ? "bg-brand-500/4" : ""
                                        }`}
                                    >
                                        {/* Timeline dot */}
                                        <div
                                            className={`absolute -left-[21px] top-3.5 w-2.5 h-2.5 rounded-full border-2 ${
                                                msg.status === "unread"
                                                    ? "bg-brand-400 border-brand-500"
                                                    : msg.status === "replied"
                                                    ? "bg-emerald-400 border-emerald-500"
                                                    : "bg-surface-600 border-surface-500"
                                            }`}
                                        />

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                                                    TYPE_COLORS[msg.message_type] ?? ""
                                                }`}
                                            >
                                                {TYPE_LABELS[msg.message_type] ?? msg.message_type}
                                            </span>
                                            <span
                                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                                                    STATUS_COLORS[msg.status] ?? ""
                                                }`}
                                            >
                                                {STATUS_LABELS[msg.status] ?? msg.status}
                                            </span>
                                            <span className="text-[10px] text-surface-600 ml-auto">
                                                {formatDate(msg.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-surface-300 mt-1 line-clamp-1">
                                            {msg.subject ?? msg.body}
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main search component ─────────────────────────────────────────────────

export function MessageSearch({
    messages,
    searchQuery,
    onSearchChange,
    threadView,
    onToggleThreadView,
    onSelectMessage,
}: MessageSearchProps) {
    // Filter messages by search query
    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages;
        const q = searchQuery.toLowerCase();
        return messages.filter(
            (m) =>
                (m.restaurants?.name ?? "").toLowerCase().includes(q) ||
                (m.subject ?? "").toLowerCase().includes(q) ||
                m.body.toLowerCase().includes(q) ||
                (m.product_id ?? "").toLowerCase().includes(q)
        );
    }, [messages, searchQuery]);

    // Group into threads
    const threads = useMemo<MessageThread[]>(() => {
        const map = new Map<string, SupplierMessage[]>();
        for (const msg of filteredMessages) {
            const key = msg.restaurant_id;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(msg);
        }

        return Array.from(map.entries())
            .map(([restaurantId, msgs]) => {
                // Sort by date descending within thread
                const sorted = [...msgs].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                return {
                    restaurantId,
                    restaurantName: sorted[0].restaurants?.name ?? "Restaurant",
                    restaurantCity: sorted[0].restaurants?.city ?? "",
                    messages: sorted,
                    latestDate: sorted[0].created_at,
                    unreadCount: sorted.filter((m) => m.status === "unread").length,
                };
            })
            .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
    }, [filteredMessages]);

    const totalResults = threadView ? threads.length : filteredMessages.length;

    return (
        <div className="space-y-3">
            {/* Search bar + thread toggle */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Chercher par restaurant, produit, message..."
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                        aria-label="Rechercher dans les messages"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-white hover:bg-surface-700 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                <button
                    onClick={onToggleThreadView}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                        threadView
                            ? "bg-brand-500/15 text-brand-300 border-brand-500/25"
                            : "bg-surface-800 text-surface-400 border-white/8 hover:text-white hover:bg-surface-700"
                    }`}
                    title={threadView ? "Desactiver la vue fil" : "Activer la vue fil"}
                >
                    <MessageCircle size={13} />
                    Fils
                </button>
            </div>

            {/* Results count */}
            {searchQuery && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-surface-500 px-1"
                >
                    {totalResults === 0
                        ? "Aucun resultat"
                        : threadView
                        ? `${totalResults} fil${totalResults > 1 ? "s" : ""} de conversation`
                        : `${totalResults} message${totalResults > 1 ? "s" : ""} trouve${totalResults > 1 ? "s" : ""}`}
                </motion.p>
            )}

            {/* Thread view */}
            {threadView && (
                <div className="bg-surface-900 rounded-2xl border border-white/8 overflow-hidden">
                    {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-surface-800 border border-white/8 flex items-center justify-center mb-3">
                                <Inbox size={20} className="text-surface-500" />
                            </div>
                            <p className="text-sm text-surface-400">
                                {searchQuery ? "Aucun resultat pour cette recherche" : "Aucun fil de conversation"}
                            </p>
                        </div>
                    ) : (
                        threads.map((thread) => (
                            <ThreadItem
                                key={thread.restaurantId}
                                thread={thread}
                                onSelectMessage={onSelectMessage}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
