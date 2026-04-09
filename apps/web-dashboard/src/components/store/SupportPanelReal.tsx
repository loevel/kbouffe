"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    MessageCircle,
    Plus,
    Send,
    Loader2,
    ArrowLeft,
    Clock,
    CheckCircle2,
    AlertCircle,
    Store,
    User,
    LifeBuoy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SupportConversation {
    ticket: {
        id: string;
        subject: string;
        description: string;
        status: string;
        priority: string;
        order_id: string | null;
        restaurant_id: string | null;
        created_at: string;
    };
    conversationId: string | null;
    restaurantId: string | null;
    lastMessage: {
        content: string;
        senderId: string;
        createdAt: string;
    } | null;
    unreadCount: number;
}

interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
}

function formatRelativeTime(dateStr: string) {
    try {
        const now = new Date();
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "date invalide";
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60_000);
        const diffH = Math.floor(diffMin / 60);
        const diffD = Math.floor(diffH / 24);

        if (diffMin < 1) return "à l'instant";
        if (diffMin < 60) return `il y a ${diffMin} min`;
        if (diffH < 24) return `il y a ${diffH}h`;
        if (diffD < 7) return `il y a ${diffD}j`;
        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    } catch {
        return "date invalide";
    }
}

function statusLabel(status: string) {
    switch (status) {
        case "open":
            return "Ouvert";
        case "in_progress":
            return "En cours";
        case "resolved":
            return "Résolu";
        case "closed":
            return "Fermé";
        default:
            return status;
    }
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case "resolved":
        case "closed":
            return <CheckCircle2 size={14} className="text-green-500" />;
        case "in_progress":
            return <Clock size={14} className="text-amber-500" />;
        default:
            return <AlertCircle size={14} className="text-brand-500" />;
    }
}

// ── Ticket list view ──
function TicketList({
    conversations,
    isLoading,
    onSelect,
    onNew,
}: {
    conversations: SupportConversation[];
    isLoading: boolean;
    onSelect: (conv: SupportConversation) => void;
    onNew: () => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-brand-500" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                    {conversations.length === 0
                        ? "Aucune demande en cours"
                        : `${conversations.length} demande${conversations.length > 1 ? "s" : ""}`}
                </p>
                <button
                    onClick={onNew}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
                >
                    <Plus size={16} />
                    Nouvelle demande
                </button>
            </div>

            {conversations.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                        <LifeBuoy size={28} className="text-surface-400" />
                    </div>
                    <p className="text-surface-500 dark:text-surface-400 text-sm">
                        Vous n&apos;avez pas encore de demande de support.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {conversations.map((conv) => (
                        <button
                            key={conv.ticket.id}
                            onClick={() => onSelect(conv)}
                            className="w-full text-left p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StatusIcon status={conv.ticket.status} />
                                        <span className="font-semibold text-surface-900 dark:text-white text-sm truncate">
                                            {conv.ticket.subject}
                                        </span>
                                    </div>
                                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                                        {conv.lastMessage
                                            ? conv.lastMessage.content
                                            : conv.ticket.description}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className="text-[10px] text-surface-400">
                                        {formatRelativeTime(
                                            conv.lastMessage?.createdAt || conv.ticket.created_at
                                        )}
                                    </span>
                                    {conv.unreadCount > 0 && (
                                        <span className="min-w-5 h-5 px-1.5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-surface-400 px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800">
                                        {statusLabel(conv.ticket.status)}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── New ticket form ──
function NewTicketForm({
    onBack,
    onCreated,
    recentOrders,
}: {
    onBack: () => void;
    onCreated: () => void;
    recentOrders: { id: string; restaurant_id: string; restaurant_name: string; created_at: string }[];
}) {
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [selectedOrder, setSelectedOrder] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !description.trim()) return;
        setIsSubmitting(true);
        setError("");

        try {
            const order = recentOrders.find((o) => o.id === selectedOrder);
            const body: Record<string, string> = { subject, description };
            if (order) {
                body.order_id = order.id;
                body.restaurant_id = order.restaurant_id;
            } else if (recentOrders.length > 0) {
                // Default to most recent order's restaurant
                body.restaurant_id = recentOrders[0].restaurant_id;
            }

            if (!body.restaurant_id) {
                setError("Aucun restaurant associé. Veuillez effectuer une commande d'abord.");
                setIsSubmitting(false);
                return;
            }

            const res = await fetch("/api/auth/support/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Erreur lors de la création");
            }

            onCreated();
        } catch (err: any) {
            setError(err.message || "Erreur inattendue");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4"
            >
                <ArrowLeft size={16} />
                Retour
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-surface-900 dark:text-white mb-1.5">
                        Sujet
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ex : Problème avec ma commande"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                {recentOrders.length > 0 && (
                    <div>
                        <label className="block text-sm font-semibold text-surface-900 dark:text-white mb-1.5">
                            Commande concernée (optionnel)
                        </label>
                        <select
                            value={selectedOrder}
                            onChange={(e) => setSelectedOrder(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Aucune commande spécifique</option>
                            {recentOrders.map((order) => (
                                <option key={order.id} value={order.id}>
                                    {order.restaurant_name} — {new Date(order.created_at).toLocaleDateString("fr-FR")}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-surface-900 dark:text-white mb-1.5">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre problème en détail..."
                        required
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !subject.trim() || !description.trim()}
                    className="w-full px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Envoyer la demande
                </button>
            </form>
        </div>
    );
}

// ── Chat view ──
function SupportChatView({
    conversation,
    onBack,
}: {
    conversation: SupportConversation;
    onBack: () => void;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [input, setInput] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const conversationId = conversation.conversationId;

    // Get current user
    useEffect(() => {
        async function getUser() {
            const supabase = createClient();
            if (!supabase) return;
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setCurrentUserId(session?.user?.id ?? null);
        }
        getUser();
    }, []);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;
        try {
            const supabase = createClient();
            const headers: Record<string, string> = {};
            if (supabase) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }
            }

            const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                headers,
            });
            if (!res.ok) throw new Error("Erreur API");
            const data = await res.json();
            // The Hono route returns a flat array for /conversations/:id/messages
            const msgs = Array.isArray(data) ? data : data.messages || [];
            setMessages(msgs);
        } catch (err) {
            console.error("[SupportChat] Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Supabase Realtime subscription
    useEffect(() => {
        if (!conversationId) return;
        const supabase = createClient();
        if (!supabase) return;

        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on("broadcast", { event: "new_message" }, (payload) => {
                const newMsg = payload.payload as ChatMessage;
                setMessages((prev) => {
                    if (prev.some((m) => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Mark as read
    useEffect(() => {
        if (!conversationId) return;
        async function markRead() {
            const supabase = createClient();
            if (!supabase) return;
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            await fetch(`/api/chat/conversations/${conversationId}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
        }
        markRead();
    }, [conversationId, messages.length]);

    const handleSend = async () => {
        if (!input.trim() || isSending || !conversationId) return;
        const text = input;
        setInput("");
        setIsSending(true);

        try {
            const supabase = createClient();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (supabase) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }
            }

            const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                method: "POST",
                headers,
                body: JSON.stringify({ content: text, type: "text" }),
            });
            if (!res.ok) throw new Error("Erreur envoi");
            const newMsg = await res.json();
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
        } catch (err) {
            console.error("[SupportChat] Send error:", err);
        } finally {
            setIsSending(false);
        }
    };

    const isClosed = conversation.ticket.status === "closed" || conversation.ticket.status === "resolved";

    return (
        <div className="flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-surface-200 dark:border-surface-800">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                    <ArrowLeft size={18} className="text-surface-500" />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 dark:text-white text-sm truncate">
                        {conversation.ticket.subject}
                    </p>
                    <div className="flex items-center gap-2">
                        <StatusIcon status={conversation.ticket.status} />
                        <span className="text-[11px] text-surface-500">
                            {statusLabel(conversation.ticket.status)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto py-4 space-y-3"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 size={20} className="animate-spin text-brand-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                        <MessageCircle size={28} className="text-surface-300 dark:text-surface-600" />
                        <p className="text-sm text-surface-500">Aucun message pour le moment.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                {!isMe && (
                                    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 mr-2 mt-1">
                                        <Store size={13} className="text-brand-600 dark:text-brand-400" />
                                    </div>
                                )}
                                <div className={`max-w-[75%]`}>
                                    <p
                                        className={`text-[10px] font-semibold mb-0.5 px-1 ${
                                            isMe
                                                ? "text-right text-brand-600 dark:text-brand-400"
                                                : "text-surface-400"
                                        }`}
                                    >
                                        {isMe ? "Vous" : "Restaurant"}
                                    </p>
                                    <div
                                        className={`rounded-2xl px-4 py-2 ${
                                            isMe
                                                ? "bg-brand-600 text-white rounded-tr-sm"
                                                : "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-tl-sm"
                                        }`}
                                    >
                                        {msg.type === "image" ? (
                                            <img
                                                src={msg.content}
                                                alt="Pièce jointe"
                                                className="rounded-lg max-w-full h-auto"
                                            />
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap leading-snug">
                                                {msg.content}
                                            </p>
                                        )}
                                        <p
                                            className={`text-[10px] mt-1 ${
                                                isMe ? "text-brand-200 text-right" : "text-surface-400"
                                            }`}
                                        >
                                            {formatRelativeTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                {isMe && (
                                    <div className="w-7 h-7 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center shrink-0 ml-2 mt-1">
                                        <User size={13} className="text-surface-500" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input bar */}
            {isClosed ? (
                <div className="pt-3 border-t border-surface-200 dark:border-surface-800 text-center">
                    <p className="text-sm text-surface-500">Cette conversation est fermée.</p>
                </div>
            ) : (
                <div className="pt-3 border-t border-surface-200 dark:border-surface-800">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Votre message..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isSending}
                            className="h-10 w-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
                        >
                            {isSending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main SupportPanelReal ──
export function SupportPanelReal() {
    const [view, setView] = useState<"list" | "new" | "chat">("list");
    const [conversations, setConversations] = useState<SupportConversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<SupportConversation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentOrders, setRecentOrders] = useState<
        { id: string; restaurant_id: string; restaurant_name: string; created_at: string }[]
    >([]);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/support/conversations");
            if (!res.ok) throw new Error("Erreur API");
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            console.error("[Support] Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch recent orders (for new ticket form)
    const fetchRecentOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/orders");
            if (!res.ok) return;
            const data = await res.json();
            const orders = Array.isArray(data) ? data : data.orders || [];
            setRecentOrders(
                orders.slice(0, 10).map((o: any) => ({
                    id: o.id,
                    restaurant_id: o.restaurantId || o.restaurant_id,
                    restaurant_name: o.restaurantName || o.restaurant?.name || o.restaurant_name || "Restaurant",
                    created_at: o.createdAt || o.created_at,
                }))
            );
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        fetchRecentOrders();
    }, [fetchConversations, fetchRecentOrders]);

    const handleSelect = (conv: SupportConversation) => {
        if (!conv.conversationId) return;
        setSelectedConv(conv);
        setView("chat");
    };

    const handleCreated = () => {
        setView("list");
        setIsLoading(true);
        fetchConversations();
    };

    return (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                Aide & support
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-5">
                Besoin d&apos;aide ? Contactez directement le restaurant.
            </p>

            {view === "list" && (
                <TicketList
                    conversations={conversations}
                    isLoading={isLoading}
                    onSelect={handleSelect}
                    onNew={() => setView("new")}
                />
            )}

            {view === "new" && (
                <NewTicketForm
                    onBack={() => setView("list")}
                    onCreated={handleCreated}
                    recentOrders={recentOrders}
                />
            )}

            {view === "chat" && selectedConv && (
                <SupportChatView
                    conversation={selectedConv}
                    onBack={() => {
                        setView("list");
                        fetchConversations();
                    }}
                />
            )}
        </div>
    );
}
