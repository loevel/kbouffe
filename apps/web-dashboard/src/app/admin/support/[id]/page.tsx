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
    Send,
    MessageSquare,
    Shield,
} from "lucide-react";
import { Badge, Button, Input, Textarea, toast, adminFetch, Card } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
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
    orderId: string | null;
    createdAt: string;
    resolvedAt: string | null;
    reporterName: string | null;
    reporterEmail: string | null;
    reporterPhone: string | null;
    assigneeName: string | null;
    assigneeEmail: string | null;
}

const statusBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; color: string }> = {
    open: { label: "Nouveau", variant: "warning", color: "text-amber-500 bg-amber-500/10" },
    in_progress: { label: "En cours", variant: "info", color: "text-blue-500 bg-blue-500/10" },
    resolved: { label: "Résolu", variant: "success", color: "text-emerald-500 bg-emerald-500/10" },
    closed: { label: "Fermé", variant: "default", color: "text-surface-400 bg-surface-100" },
};

const priorityBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger"; color: string }> = {
    low: { label: "Basse", variant: "default", color: "bg-surface-100 text-surface-500" },
    medium: { label: "Moyenne", variant: "warning", color: "bg-blue-500/10 text-blue-500" },
    high: { label: "Haute", variant: "danger", color: "bg-orange-500/10 text-orange-600" },
    urgent: { label: "Urgente", variant: "danger", color: "bg-red-500/10 text-red-600" },
};

export default function AdminSupportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [response, setResponse] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await adminFetch(`/api/admin/support/${id}`);
                if (res.ok) setTicket(await res.json());
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

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

    const handleSendResponse = async () => {
        if (!response.trim()) return;
        toast.info("Envoi de la réponse (Simulation)...");
        // Here you would call an API to send email/notification to user
        setTimeout(() => {
            setResponse("");
            toast.success("Réponse envoyée au rapporteur");
            if (ticket?.status === "open") {
                updateTicket({ status: "in_progress" });
            }
        }, 1000);
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
                        variant="outline" 
                        size="sm"
                        onClick={() => updateTicket({ status: t.status === "resolved" ? "open" : "resolved" })}
                        className={t.status === "resolved" ? "text-amber-600" : "text-emerald-600"}
                    >
                        {t.status === "resolved" ? "Réouvrir le ticket" : "Marquer comme résolu"}
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Header Card */}
                    <Card className="p-0 overflow-hidden">
                        <div className={`p-6 border-b border-surface-100 dark:border-surface-800 ${sb.color.split(" ")[1]} bg-opacity-30`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={sb.variant} className="font-bold border-none shadow-sm">{sb.label}</Badge>
                                        <Badge variant={pb.variant} className="font-bold border-none">{pb.label}</Badge>
                                    </div>
                                    <h1 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight uppercase">
                                        {t.subject}
                                    </h1>
                                </div>
                                <span className="text-[10px] font-mono text-surface-400 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg">
                                    ID: #{t.id.slice(0, 12)}
                                </span>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-start gap-4 mb-8">
                                <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="bg-surface-50 dark:bg-surface-800/50 p-6 rounded-2xl border border-surface-100 dark:border-surface-800">
                                        <p className="text-base text-surface-700 dark:text-surface-200 leading-relaxed whitespace-pre-wrap">
                                            {t.description}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest px-2">
                                        Soumis le {formatDate(t.createdAt)} par {t.reporterName}
                                    </p>
                                </div>
                            </div>

                            {/* References */}
                            {(t.restaurantId || t.orderId) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                    {t.restaurantId && (
                                        <Link href={`/admin/restaurants/${t.restaurantId}`} className="group p-4 rounded-2xl border border-surface-100 dark:border-surface-800 hover:border-brand-500/20 hover:bg-brand-500/5 transition-all">
                                            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Établissement lié</p>
                                            <div className="flex items-center gap-3">
                                                <Store size={18} className="text-brand-500" />
                                                <span className="text-sm font-bold text-surface-900 dark:text-white truncate group-hover:text-brand-500">#{t.restaurantId.slice(0, 8)}</span>
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
                        </div>
                    </Card>

                    {/* Response Area */}
                    <Card className="space-y-4">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                            <MessageSquare size={20} className="text-brand-500" />
                            Répondre au rapporteur
                        </h3>
                        <div className="relative">
                            <Textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Saisissez votre réponse ici. Le rapporteur recevra une notification par email."
                                rows={6}
                                className="bg-surface-50 dark:bg-surface-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all p-4"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-surface-400 italic">
                                Une réponse officielle sera enregistrée dans l'audit.
                            </p>
                            <Button
                                disabled={!response.trim() || saving}
                                onClick={handleSendResponse}
                                leftIcon={<Send size={18} />}
                                className="px-8 shadow-lg shadow-brand-500/20"
                            >
                                Envoyer la réponse
                            </Button>
                        </div>
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
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                                <span className="text-xs font-bold text-surface-500 flex items-center gap-2"><Calendar size={14} /> Création</span>
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                                <span className="text-xs font-bold text-surface-500 flex items-center gap-2"><UserCheck size={14} /> Assigné à</span>
                                <span className="text-xs font-bold text-brand-500">{t.assigneeName || "En attente"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-xs font-bold text-surface-500 flex items-center gap-2"><Clock size={14} /> Résolu le</span>
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : "—"}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Status Management */}
                    <Card className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-surface-400">Statut du ticket</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {(["open", "in_progress", "resolved", "closed"] as const).map((s) => {
                                const active = t.status === s;
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
                                        <span className="uppercase">{statusBadge[s].label}</span>
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
