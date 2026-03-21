"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    MessageCircle,
    ArrowLeft,
    Loader2,
    Send,
    User,
    Store,
    Clock,
    ShoppingBag,
    LifeBuoy,
    Search,
} from "lucide-react";
import { Card, Badge, Input, Button } from "@kbouffe/module-core/ui";
import { useLocale, useDashboard, formatDateTime } from "@kbouffe/module-core/ui";
import { useChat, type Message } from "@kbouffe/module-orders/ui";

interface ConversationItem {
    id: string;
    orderId: string | null;
    type: string;
    customerName: string;
    subject: string | null;
    ticketId: string | null;
    lastMessage: {
        content: string;
        senderId: string;
        createdAt: string;
        contentType: string;
    } | null;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

function formatRelativeTime(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffH < 24) return `${diffH}h`;
    if (diffD < 7) return `${diffD}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Conversation list ──
function ConversationList({
    conversations,
    selectedId,
    onSelect,
    filter,
    onFilterChange,
}: {
    conversations: ConversationItem[];
    selectedId: string | null;
    onSelect: (conv: ConversationItem) => void;
    filter: string;
    onFilterChange: (v: string) => void;
}) {
    const filtered = conversations.filter((c) => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return (
            c.customerName.toLowerCase().includes(q) ||
            c.subject?.toLowerCase().includes(q) ||
            c.lastMessage?.content.toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="p-3 border-b border-surface-100 dark:border-surface-800">
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
                    />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                        <MessageCircle
                            size={32}
                            className="text-surface-300 dark:text-surface-600 mb-3"
                        />
                        <p className="text-sm text-surface-500">Aucune conversation</p>
                    </div>
                ) : (
                    filtered.map((conv) => {
                        const isSelected = conv.id === selectedId;
                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                className={`w-full text-left px-4 py-3 border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${
                                    isSelected
                                        ? "bg-brand-50/50 dark:bg-brand-900/10 border-l-2 border-l-brand-500"
                                        : ""
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0 mt-0.5">
                                        <User
                                            size={16}
                                            className="text-surface-500"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`text-sm truncate ${
                                                    conv.unreadCount > 0
                                                        ? "font-bold text-surface-900 dark:text-white"
                                                        : "font-medium text-surface-700 dark:text-surface-300"
                                                }`}
                                            >
                                                {conv.customerName}
                                            </span>
                                            <span className="text-[10px] text-surface-400 whitespace-nowrap">
                                                {conv.lastMessage
                                                    ? formatRelativeTime(
                                                          conv.lastMessage.createdAt
                                                      )
                                                    : ""}
                                            </span>
                                        </div>
                                        {conv.subject && (
                                            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium truncate">
                                                {conv.subject}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                            <p
                                                className={`text-xs truncate ${
                                                    conv.unreadCount > 0
                                                        ? "text-surface-800 dark:text-surface-200 font-medium"
                                                        : "text-surface-500 dark:text-surface-400"
                                                }`}
                                            >
                                                {conv.lastMessage?.contentType === "image"
                                                    ? "📷 Image"
                                                    : conv.lastMessage?.content || "Pas de message"}
                                            </p>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {conv.orderId && (
                                                    <ShoppingBag
                                                        size={12}
                                                        className="text-surface-400"
                                                    />
                                                )}
                                                {conv.type === "support" && (
                                                    <LifeBuoy
                                                        size={12}
                                                        className="text-amber-500"
                                                    />
                                                )}
                                                {conv.unreadCount > 0 && (
                                                    <span className="min-w-4 h-4 px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ── Chat view for a conversation ──
function MerchantChatView({
    conversation,
}: {
    conversation: ConversationItem;
}) {
    const { user } = useDashboard();

    // If the conversation has an orderId, use the existing useChat hook
    if (conversation.orderId) {
        return (
            <OrderChatWrapper
                orderId={conversation.orderId}
                customerName={conversation.customerName}
                subject={conversation.subject}
                type={conversation.type}
            />
        );
    }

    // For non-order conversations, use conversation-based chat
    return (
        <ConversationChatWrapper
            conversationId={conversation.id}
            customerName={conversation.customerName}
            subject={conversation.subject}
            type={conversation.type}
            currentUserId={user?.id}
        />
    );
}

function OrderChatWrapper({
    orderId,
    customerName,
    subject,
    type,
}: {
    orderId: string;
    customerName: string;
    subject: string | null;
    type: string;
}) {
    const { user } = useDashboard();
    const { messages, isLoading, isSending, sendMessage, scrollRef } = useChat(
        orderId,
        user?.id
    );
    const [input, setInput] = useState("");

    const handleSend = async () => {
        if (!input.trim() || isSending) return;
        const text = input;
        setInput("");
        try {
            await sendMessage(text);
        } catch {
            // error handled by hook
        }
    };

    return (
        <ChatUI
            messages={messages}
            isLoading={isLoading}
            isSending={isSending}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            scrollRef={scrollRef}
            currentUserId={user?.id}
            customerName={customerName}
            subject={subject}
            type={type}
        />
    );
}

function ConversationChatWrapper({
    conversationId,
    customerName,
    subject,
    type,
    currentUserId,
}: {
    conversationId: string;
    customerName: string;
    subject: string | null;
    type: string;
    currentUserId?: string;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        try {
            const { createClient } = await import("@kbouffe/module-core/ui");
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

            const res = await fetch(
                `/api/chat/conversations/${conversationId}/messages`,
                { headers }
            );
            if (!res.ok) throw new Error("Erreur API");
            const data = await res.json();
            const msgs = Array.isArray(data) ? data : data.messages || [];
            setMessages(msgs);
        } catch (err) {
            console.error("[Chat] Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Realtime subscription
    useEffect(() => {
        let supabase: any;
        import("@kbouffe/module-core/ui").then(({ createClient }) => {
            supabase = createClient();
            if (!supabase) return;

            const channel = supabase
                .channel(`conversation:${conversationId}`)
                .on("broadcast", { event: "new_message" }, (payload: any) => {
                    const newMsg = payload.payload as Message;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                })
                .subscribe();

            return () => supabase.removeChannel(channel);
        });

        return () => {
            // cleanup handled by the promise chain
        };
    }, [conversationId]);

    // Mark as read
    useEffect(() => {
        async function markRead() {
            try {
                const { createClient } = await import("@kbouffe/module-core/ui");
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
            } catch {
                // ignore
            }
        }
        markRead();
    }, [conversationId, messages.length]);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;
        const text = input;
        setInput("");
        setIsSending(true);

        try {
            const { createClient } = await import("@kbouffe/module-core/ui");
            const supabase = createClient();
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            if (supabase) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }
            }

            const res = await fetch(
                `/api/chat/conversations/${conversationId}/messages`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ content: text, type: "text" }),
                }
            );
            if (!res.ok) throw new Error("Erreur envoi");
            const newMsg = await res.json();
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
        } catch {
            // error
        } finally {
            setIsSending(false);
        }
    };

    return (
        <ChatUI
            messages={messages}
            isLoading={isLoading}
            isSending={isSending}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            scrollRef={scrollRef}
            currentUserId={currentUserId}
            customerName={customerName}
            subject={subject}
            type={type}
        />
    );
}

// ── Shared ChatUI component ──
function ChatUI({
    messages,
    isLoading,
    isSending,
    input,
    onInputChange,
    onSend,
    scrollRef,
    currentUserId,
    customerName,
    subject,
    type,
}: {
    messages: Message[];
    isLoading: boolean;
    isSending: boolean;
    input: string;
    onInputChange: (v: string) => void;
    onSend: () => void;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    currentUserId?: string;
    customerName: string;
    subject: string | null;
    type: string;
}) {
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, scrollRef]);

    return (
        <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center gap-3 bg-surface-50/50 dark:bg-surface-800/30">
                <div className="w-9 h-9 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                    <User size={18} className="text-surface-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 dark:text-white text-sm">
                        {customerName}
                    </p>
                    {subject && (
                        <p className="text-xs text-surface-500 truncate">{subject}</p>
                    )}
                </div>
                <Badge
                    variant={type === "support" ? "warning" : "success"}
                    className="text-[10px]"
                >
                    {type === "support" ? "Support" : "Commande"}
                </Badge>
            </div>

            {/* Messages area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 size={24} className="animate-spin text-brand-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 mb-3">
                            <MessageCircle size={24} />
                        </div>
                        <p className="text-sm text-surface-500">
                            Aucun message. Envoyez le premier message.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                {!isMe && (
                                    <div className="w-7 h-7 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center shrink-0 mr-2 mt-1">
                                        <User
                                            size={13}
                                            className="text-surface-500"
                                        />
                                    </div>
                                )}
                                <div className="max-w-[75%]">
                                    <p
                                        className={`text-[10px] font-semibold mb-0.5 px-1 ${
                                            isMe
                                                ? "text-right text-brand-600 dark:text-brand-400"
                                                : "text-surface-400"
                                        }`}
                                    >
                                        {isMe ? "Vous (Restaurant)" : customerName}
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
                                                src={
                                                    (msg as any).attachmentUrl ||
                                                    msg.content
                                                }
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
                                                isMe
                                                    ? "text-brand-200 text-right"
                                                    : "text-surface-400"
                                            }`}
                                        >
                                            {formatDateTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                {isMe && (
                                    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 ml-2 mt-1">
                                        <Store
                                            size={13}
                                            className="text-brand-600 dark:text-brand-400"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-800/30">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                        placeholder="Votre réponse..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                        onClick={onSend}
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
        </div>
    );
}

// ── Main page ──
export default function MessagesPage() {
    const { t } = useLocale();
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<ConversationItem | null>(null);
    const [filter, setFilter] = useState("");

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/dashboard/messages");
            if (!res.ok) throw new Error("Erreur API");
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            console.error("[Messages] Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 30_000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return (
        <div>
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Messages
                    </h1>
                    {totalUnread > 0 && (
                        <span className="min-w-6 h-6 px-2 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {totalUnread}
                        </span>
                    )}
                </div>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Conversations avec vos clients — commandes et support
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-brand-500" />
                </div>
            ) : conversations.length === 0 ? (
                <Card className="text-center py-16">
                    <MessageCircle
                        size={40}
                        className="mx-auto text-surface-300 dark:text-surface-600 mb-4"
                    />
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                        Aucune conversation
                    </h3>
                    <p className="text-sm text-surface-500">
                        Les messages de vos clients apparaîtront ici.
                    </p>
                </Card>
            ) : (
                <Card padding="none" className="overflow-hidden">
                    <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
                        {/* Left panel — conversation list */}
                        <div
                            className={`w-full md:w-80 lg:w-96 border-r border-surface-100 dark:border-surface-800 flex-shrink-0 ${
                                selected ? "hidden md:flex md:flex-col" : "flex flex-col"
                            }`}
                        >
                            <ConversationList
                                conversations={conversations}
                                selectedId={selected?.id ?? null}
                                onSelect={(conv) => setSelected(conv)}
                                filter={filter}
                                onFilterChange={setFilter}
                            />
                        </div>

                        {/* Right panel — chat */}
                        <div
                            className={`flex-1 flex flex-col ${
                                selected ? "" : "hidden md:flex"
                            }`}
                        >
                            {selected ? (
                                <>
                                    {/* Mobile back button */}
                                    <div className="md:hidden px-4 py-2 border-b border-surface-100 dark:border-surface-800">
                                        <button
                                            onClick={() => setSelected(null)}
                                            className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700"
                                        >
                                            <ArrowLeft size={16} />
                                            Retour
                                        </button>
                                    </div>
                                    <MerchantChatView conversation={selected} />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                                        <MessageCircle
                                            size={32}
                                            className="text-surface-400"
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                                        Sélectionnez une conversation
                                    </h3>
                                    <p className="text-sm text-surface-500 max-w-sm">
                                        Choisissez une conversation dans la liste pour
                                        voir et répondre aux messages.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
