"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
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
    Send,
    MessageSquare,
    Shield,
    RotateCcw,
    Inbox,
    Loader2,
} from "lucide-react";
import { Badge, Button, Textarea, toast, adminFetch, Card } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    restaurantName: string | null;
    orderId: string | null;
    createdAt: string;
    resolvedAt: string | null;
    reporterName: string | null;
    reporterEmail: string | null;
    reporterPhone: string | null;
    assigneeName: string | null;
    assigneeEmail: string | null;
    unreadAdmin: number;
    unreadReporter: number;
}

interface Message {
    id: string;
    senderType: "restaurant" | "admin" | "customer";
    senderName: string | null;
    senderAvatar: string | null;
    content: string;
    isRead: boolean;
    createdAt: string;
}

const statusBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; color: string; icon: any }> = {
    open: { label: "Nouveau", variant: "warning", color: "text-amber-500 bg-amber-500/10", icon: Inbox },
    in_progress: { label: "En cours", variant: "info", color: "text-blue-500 bg-blue-500/10", icon: Clock },
    resolved: { label: "Résolu", variant: "success", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle },
    closed: { label: "Fermé", variant: "default", color: "text-surface-400 bg-surface-100", icon: XCircle },
};

const priorityBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger"; color: string }> = {
    low: { label: "Basse", variant: "default", color: "bg-surface-100 text-surface-500" },
    medium: { label: "Moyenne", variant: "warning", color: "bg-blue-500/10 text-blue-500" },
    high: { label: "Haute", variant: "danger", color: "bg-orange-500/10 text-orange-600" },
    urgent: { label: "Urgente", variant: "danger", color: "bg-red-500/10 text-red-600" },
};

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminSupportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);
    const [response, setResponse] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await adminFetch(`/api/admin/support/${id}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages ?? []);
            }
        } catch {
            console.error("Failed to load messages");
        } finally {
            setLoadingMsgs(false);
        }
    }, [id]);

    useEffect(() => {
        (async () => {
            try {
                const res = await adminFetch(`/api/admin/support/${id}`);
                if (res.ok) setTicket(await res.json());
            } finally {
                setLoading(false);
            }
        })();
        fetchMessages();
    }, [id, fetchMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Poll every 15s
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") fetchMessages();
        }, 15_000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const updateTicket = async (updates: Partial<TicketDetail>) => {
        if (!ticket) return;
        setSaving(true);
        try {
            const res = await adminFetch("/api/admin/support", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: ticket.id, ...updates }),
            });
            if (res.ok) {
                setTicket({ ...ticket, ...updates } as TicketDetail);
                toast.success("Ticket mis à jour");
            } else {
                toast.error("Erreur lors de la mise à jour");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSendMessage = async () => {
        const trimmed = response.trim();
        if (!trimmed || sendingMsg) return;
        setSendingMsg(true);
        try {
            const res = await adminFetch(`/api/admin/support/${id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: trimmed }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    ...data.message,
                    senderType: "admin",
                    senderName: "kBouffe Admin",
                    senderAvatar: null,
                    isRead: true,
                }]);
                setResponse("");
                // Auto in_progress
                if (ticket?.status === "open") {
                    setTicket(t => t ? { ...t, status: "in_progress" } : t);
                }
                toast.success("Message envoyé");
            } else {
                toast.error("Erreur lors de l'envoi");
            }
        } finally {
            setSendingMsg(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-surface-400">Chargement du ticket...</p>
        </div>
    );

    if (!ticket) return (
        <div className="text-center py-24">
            <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-surface-400" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Ticket introuvable</h2>
            <Link href="/admin/support">
                <Button variant="outline" className="mt-6">
                    <ArrowLeft size={16} className="mr-2" /> Retour à la liste
                </Button>
            </Link>
        </div>
    );

    const t = ticket;
    const sb = statusBadge[t.status] ?? statusBadge.open;
    const pb = priorityBadge[t.priority] ?? priorityBadge.medium;
    const formatDate = (val: string | null) =>
        val ? new Date(val).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto pb-20"
        >
            <div className="flex items-center justify-between mb-8">
                <Link href="/admin/support" className="group flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-brand-500 transition-all">
                    <div className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 group-hover:bg-brand-500/10 transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    Retour à l'assistance
                </Link>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchMessages}
                        className="text-surface-400"
                    >
                        <RotateCcw size={14} className="mr-1" /> Actualiser
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTicket({ status: t.status === "resolved" ? "open" : "resolved" })}
                        className={t.status === "resolved" ? "text-amber-600" : "text-emerald-600"}
                        disabled={saving}
                    >
                        {t.status === "resolved" ? "Réouvrir le ticket" : "Marquer comme résolu"}
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Header Card */}
                    <Card className="p-0 overflow-hidden">
                        <div className={`p-6 border-b border-surface-100 dark:border-surface-800 ${sb.color.split(" ")[1]} bg-opacity-30`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={sb.variant} className="font-bold border-none shadow-sm">{sb.label}</Badge>
                                        <Badge variant={pb.variant} className="font-bold border-none">{pb.label}</Badge>
                                        {t.unreadAdmin > 0 && (
                                            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {t.unreadAdmin} non lu{t.unreadAdmin > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight uppercase">
                                        {t.subject}
                                    </h1>
                                </div>
                                <span className="text-[10px] font-mono text-surface-400 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg shrink-0">
                                    ID: #{t.id.slice(0, 12)}
                                </span>
                            </div>
                        </div>
                        {/* References */}
                        {(t.restaurantId || t.orderId) && (
                            <div className="px-6 pt-4 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {t.restaurantId && (
                                    <Link href={`/admin/restaurants/${t.restaurantId}`} className="group p-4 rounded-2xl border border-surface-100 dark:border-surface-800 hover:border-brand-500/20 hover:bg-brand-500/5 transition-all">
                                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Établissement lié</p>
                                        <div className="flex items-center gap-3">
                                            <Store size={18} className="text-brand-500" />
                                            <span className="text-sm font-bold text-surface-900 dark:text-white truncate group-hover:text-brand-500">
                                                {t.restaurantName ?? `#${t.restaurantId.slice(0, 8)}`}
                                            </span>
                                        </div>
                                    </Link>
                                )}
                                {t.orderId && (
                                    <div className="p-4 rounded-2xl border border-surface-100 dark:border-surface-800">
                                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Commande associée</p>
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-brand-500" />
                                            <span className="text-sm font-bold text-surface-900 dark:text-white">#{t.orderId.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Messages thread */}
                    <Card className="p-0 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                            <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <MessageSquare size={16} className="text-brand-500" />
                                Conversation ({messages.length} messages)
                            </h3>
                        </div>

                        {/* Thread */}
                        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                            {loadingMsgs ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-brand-500" />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="text-sm text-surface-400 text-center py-8">Aucun message dans ce ticket.</p>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isAdmin = msg.senderType === "admin";
                                    const showSender = idx === 0 || messages[idx - 1].senderType !== msg.senderType;

                                    return (
                                        <div key={msg.id} className={cn("flex gap-3", isAdmin ? "flex-row-reverse" : "flex-row")}>
                                            {!isAdmin && (
                                                <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center shrink-0 mt-auto text-surface-500 font-bold text-sm">
                                                    {msg.senderName?.charAt(0) ?? "U"}
                                                </div>
                                            )}
                                            {isAdmin && (
                                                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 mt-auto">
                                                    <Shield size={14} className="text-brand-500" />
                                                </div>
                                            )}

                                            <div className={cn("max-w-[75%] space-y-1 flex flex-col", isAdmin ? "items-end" : "items-start")}>
                                                {showSender && (
                                                    <span className="text-[11px] font-medium text-surface-400 px-1">
                                                        {isAdmin ? "kBouffe Admin" : (msg.senderName ?? "Restaurant")}
                                                    </span>
                                                )}
                                                <div className={cn(
                                                    "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                                                    isAdmin
                                                        ? "bg-brand-500 text-white rounded-tr-sm"
                                                        : "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-sm"
                                                )}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-surface-400 px-1">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Reply box */}
                        {t.status !== "closed" ? (
                            <div className="px-6 pb-6 pt-2 border-t border-surface-100 dark:border-surface-800">
                                <div className="space-y-3">
                                    <Textarea
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Répondre au restaurant… (Entrée pour envoyer)"
                                        rows={3}
                                        className="bg-surface-50 dark:bg-surface-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all p-4"
                                    />
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-surface-400 italic">
                                            Le restaurant sera notifié de votre réponse.
                                        </p>
                                        <Button
                                            disabled={!response.trim() || sendingMsg}
                                            onClick={handleSendMessage}
                                            leftIcon={sendingMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            className="px-6 shadow-lg shadow-brand-500/20"
                                        >
                                            {sendingMsg ? "Envoi..." : "Envoyer"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="px-6 pb-6 pt-2 border-t border-surface-100 dark:border-surface-800 text-center">
                                <p className="text-sm text-surface-400">Ce ticket est fermé.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Reporter Info */}
                    <Card className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-surface-400 flex items-center gap-2">
                            <Shield size={14} /> Profil Rapporteur
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-xl">
                                    {t.reporterName?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <p className="font-bold text-surface-900 dark:text-white leading-tight">{t.reporterName || "Inconnu"}</p>
                                    <p className="text-xs text-surface-500 font-medium capitalize">{t.reporterType}</p>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                                    <Mail size={14} className="text-surface-400" />
                                    <span className="truncate">{t.reporterEmail || "Pas d'email"}</span>
                                </div>
                                {t.reporterPhone && (
                                    <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                                        <Phone size={14} className="text-surface-400" />
                                        <span>{t.reporterPhone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Meta Info */}
                    <Card className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-surface-400">Informations Clés</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                                <span className="text-xs font-bold text-surface-500 flex items-center gap-2"><Calendar size={14} /> Création</span>
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{new Date(t.createdAt).toLocaleDateString("fr-FR")}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                                <span className="text-xs font-bold text-surface-500 flex items-center gap-2"><UserCheck size={14} /> Assigné à</span>
                                <span className="text-xs font-bold text-brand-500">{t.assigneeName || "En attente"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                                <span className="text-xs font-bold text-surface-500 flex items-center gap-2"><MessageSquare size={14} /> Messages</span>
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{messages.length}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-xs font-bold text-surface-500 flex items-center gap-2"><Clock size={14} /> Résolu le</span>
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString("fr-FR") : "—"}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Status Management */}
                    <Card className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-surface-400">Statut du ticket</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {(["open", "in_progress", "resolved", "closed"] as const).map((s) => {
                                const active = t.status === s;
                                const sc = statusBadge[s];
                                const StatusIcon = sc.icon;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => updateTicket({ status: s })}
                                        disabled={saving || active}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                                            active
                                                ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                                                : "bg-surface-50 dark:bg-surface-800 border-surface-100 dark:border-surface-700 text-surface-500 hover:border-brand-500/30"
                                        )}
                                    >
                                        <span className="flex items-center gap-2 uppercase">
                                            <StatusIcon size={12} />
                                            {sc.label}
                                        </span>
                                        {active && <CheckCircle size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}
