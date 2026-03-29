"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Send,
    Loader2,
    CheckCircle,
    Inbox,
    Clock,
    XCircle,
    LifeBuoy,
    ShieldCheck,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    senderType: "restaurant" | "admin";
    content: string;
    createdAt: string;
    senderName: string | null;
    senderAvatar: string | null;
    isMe: boolean;
}

interface TicketMeta {
    id: string;
    subject: string;
    status: string;
    priority: string;
    unreadReporter: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: "Ouvert", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10", icon: Inbox },
    in_progress: { label: "En cours", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", icon: Clock },
    resolved: { label: "Résolu", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle },
    closed: { label: "Fermé", color: "text-surface-400 bg-surface-100 dark:bg-surface-800", icon: XCircle },
};

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function SupportThreadPage() {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [ticket, setTicket] = useState<TicketMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/dashboard/support/${id}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages ?? []);
                if (data.ticket) {
                    setTicket(prev => prev ? { ...prev, ...data.ticket, unreadReporter: 0 } : data.ticket);
                }
            } else if (res.status === 404) {
                setError("Ticket introuvable.");
            }
        } catch {
            setError("Erreur de chargement.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Also fetch ticket meta from the list endpoint
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/dashboard/support");
                if (res.ok) {
                    const { tickets } = await res.json();
                    const t = (tickets ?? []).find((t: any) => t.id === id);
                    if (t) setTicket(t);
                }
            } catch {}
        })();
        fetchMessages();
    }, [id, fetchMessages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Poll for new messages every 10s when tab is active
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchMessages();
            }
        }, 10_000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const handleSend = async () => {
        const trimmed = content.trim();
        if (!trimmed || sending) return;
        setSending(true);
        try {
            const res = await fetch(`/api/dashboard/support/${id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: trimmed }),
            });
            if (res.ok) {
                const { message } = await res.json();
                setMessages(prev => [...prev, { ...message, isMe: true, senderName: "Vous", senderAvatar: null }]);
                setContent("");
                textareaRef.current?.focus();
            } else {
                const err = await res.json();
                alert(err.error ?? "Erreur lors de l'envoi");
            }
        } catch {
            alert("Erreur réseau");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const sc = statusConfig[ticket?.status ?? "open"] ?? statusConfig.open;
    const StatusIcon = sc.icon;
    const isClosed = ticket?.status === "closed";

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-surface-500">{error}</p>
                <Link href="/dashboard/support" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-500 hover:underline">
                    <ArrowLeft size={14} /> Retour au support
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
            {/* Header */}
            <div className="shrink-0 pb-4">
                <div className="flex items-center gap-3 mb-3">
                    <Link
                        href="/dashboard/support"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-surface-900 dark:text-white truncate">
                            {ticket?.subject ?? "Chargement..."}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", sc.color)}>
                                <StatusIcon size={11} />
                                {sc.label}
                            </span>
                            <span className="text-xs text-surface-400 font-mono">#{id.slice(0, 8)}</span>
                        </div>
                    </div>
                    <button
                        onClick={fetchMessages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        title="Actualiser"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Messages thread */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 text-surface-400">
                        <LifeBuoy size={36} className="mb-3 text-surface-200 dark:text-surface-700" />
                        <p className="text-sm">Votre ticket a bien été créé.<br />Notre équipe vous répondra bientôt.</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.isMe || msg.senderType === "restaurant";
                    const showSender = idx === 0 || messages[idx - 1].senderType !== msg.senderType;

                    return (
                        <div key={msg.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                            {/* Avatar */}
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 mt-auto">
                                    <ShieldCheck size={14} className="text-brand-500" />
                                </div>
                            )}

                            <div className={cn("max-w-[75%] space-y-1", isMe ? "items-end" : "items-start", "flex flex-col")}>
                                {showSender && (
                                    <span className={cn("text-[11px] font-medium px-1", isMe ? "text-right text-surface-400" : "text-surface-500")}>
                                        {isMe ? "Vous" : "kBouffe Support"}
                                    </span>
                                )}
                                <div
                                    className={cn(
                                        "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                                        isMe
                                            ? "bg-brand-500 text-white rounded-tr-sm"
                                            : "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-sm"
                                    )}
                                >
                                    {msg.content}
                                </div>
                                <span className={cn("text-[10px] text-surface-400 px-1", isMe ? "text-right" : "text-left")}>
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {isClosed ? (
                <div className="shrink-0 mt-2 p-4 bg-surface-100 dark:bg-surface-800 rounded-2xl text-center">
                    <p className="text-sm text-surface-500">Ce ticket est fermé.</p>
                    <Link href="/dashboard/support" className="text-sm text-brand-500 hover:underline mt-1 inline-block">
                        Créer un nouveau ticket
                    </Link>
                </div>
            ) : (
                <div className="shrink-0 mt-2">
                    <div className="flex gap-2 p-3 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Écrivez votre message… (Entrée pour envoyer)"
                            rows={2}
                            className="flex-1 bg-transparent text-sm text-surface-900 dark:text-white placeholder-surface-400 resize-none focus:outline-none py-1"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!content.trim() || sending}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50 shrink-0 self-end"
                        >
                            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    <p className="text-[11px] text-surface-400 text-center mt-2">
                        Entrée pour envoyer · Maj+Entrée pour saut de ligne
                    </p>
                </div>
            )}
        </div>
    );
}
