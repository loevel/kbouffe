"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Megaphone, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Card, Button, Input } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

interface Announcement {
    id: string;
    message: string;
    type: "info" | "warning" | "urgent";
    color: string | null;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
}

const TYPE_OPTIONS = [
    { value: "info", label: "Information", icon: Info, color: "text-blue-500" },
    { value: "warning", label: "Avertissement", icon: AlertTriangle, color: "text-amber-500" },
    { value: "urgent", label: "Urgent", icon: AlertCircle, color: "text-red-500" },
] as const;

export function AnnouncementsManager() {
    const { loading: dashboardLoading } = useDashboard();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [message, setMessage] = useState("");
    const [type, setType] = useState<"info" | "warning" | "urgent">("info");
    const [color, setColor] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const res = await fetch("/api/announcements");
            if (!res.ok) throw new Error("Erreur de chargement");
            const data = await res.json();
            setAnnouncements(data.announcements ?? []);
        } catch (error) {
            console.error("fetchAnnouncements error:", error);
            toast.error("Impossible de charger les annonces");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error("Le message est requis");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: message.trim(),
                    type,
                    color: color || null,
                    starts_at: startsAt || null,
                    ends_at: endsAt || null,
                }),
            });

            if (!res.ok) throw new Error("Erreur de creation");

            toast.success("Annonce creee");
            resetForm();
            fetchAnnouncements();
        } catch {
            toast.error("Impossible de creer l'annonce");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/announcements/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !isActive }),
            });
            if (!res.ok) throw new Error();

            setAnnouncements((prev) =>
                prev.map((a) => (a.id === id ? { ...a, is_active: !isActive } : a))
            );
        } catch {
            toast.error("Erreur de mise a jour");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette annonce ?")) return;

        try {
            const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();

            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
            toast.success("Annonce supprimee");
        } catch {
            toast.error("Erreur de suppression");
        }
    };

    const resetForm = () => {
        setMessage("");
        setType("info");
        setColor("");
        setStartsAt("");
        setEndsAt("");
        setShowForm(false);
    };

    if (dashboardLoading || loading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-48" />
                    <div className="h-16 bg-surface-200 dark:bg-surface-700 rounded" />
                    <div className="h-16 bg-surface-200 dark:bg-surface-700 rounded" />
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Megaphone size={20} className="text-brand-500" />
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-white">
                                Annonces & Bannieres
                            </h3>
                            <p className="text-sm text-surface-500">
                                Affichez des messages importants sur votre vitrine en temps reel.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        leftIcon={showForm ? <X size={16} /> : <Plus size={16} />}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "Annuler" : "Nouvelle annonce"}
                    </Button>
                </div>
            </Card>

            {/* Create form */}
            {showForm && (
                <Card>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ex: Fermeture exceptionnelle ce soir..."
                                className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                                rows={2}
                                maxLength={500}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Type
                                </label>
                                <div className="flex gap-2">
                                    {TYPE_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setType(opt.value)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                                    type === opt.value
                                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                                                        : "border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300"
                                                }`}
                                            >
                                                <Icon size={14} className={opt.color} />
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Couleur (optionnel)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={color || "#3b82f6"}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="h-9 w-12 rounded cursor-pointer border border-surface-200 dark:border-surface-700"
                                    />
                                    {color && (
                                        <button
                                            type="button"
                                            onClick={() => setColor("")}
                                            className="text-xs text-surface-400 hover:text-surface-600"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Date range */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Debut (optionnel)
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={startsAt}
                                    onChange={(e) => setStartsAt(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Fin (optionnel)
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={endsAt}
                                    onChange={(e) => setEndsAt(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        {message.trim() && (
                            <div className="border border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-3">
                                <p className="text-xs text-surface-400 mb-2">Apercu :</p>
                                <div
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                                        type === "info"
                                            ? "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                                            : type === "warning"
                                              ? "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                                              : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                    }`}
                                    style={color ? { backgroundColor: color + "15", color } : undefined}
                                >
                                    {type === "info" && <Info size={16} />}
                                    {type === "warning" && <AlertTriangle size={16} />}
                                    {type === "urgent" && <AlertCircle size={16} />}
                                    {message}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" isLoading={submitting} leftIcon={<Plus size={16} />}>
                                Creer l'annonce
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* List */}
            {announcements.length === 0 ? (
                <Card>
                    <div className="text-center py-8 text-surface-400">
                        <Megaphone size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Aucune annonce pour le moment</p>
                        <p className="text-xs mt-1">Creez votre premiere annonce pour informer vos clients.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-2">
                    {announcements.map((a) => {
                        const typeOpt = TYPE_OPTIONS.find((o) => o.value === a.type) ?? TYPE_OPTIONS[0];
                        const Icon = typeOpt.icon;

                        return (
                            <Card key={a.id}>
                                <div className="flex items-center gap-3">
                                    <Icon size={18} className={typeOpt.color} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-surface-900 dark:text-white truncate">
                                            {a.message}
                                        </p>
                                        <p className="text-xs text-surface-400 mt-0.5">
                                            {new Date(a.created_at).toLocaleDateString("fr-FR")}
                                            {a.ends_at && ` — Expire le ${new Date(a.ends_at).toLocaleDateString("fr-FR")}`}
                                        </p>
                                    </div>

                                    {/* Toggle active */}
                                    <button
                                        onClick={() => toggleActive(a.id, a.is_active)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            a.is_active
                                                ? "bg-brand-500"
                                                : "bg-surface-300 dark:bg-surface-600"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                a.is_active ? "translate-x-6" : "translate-x-1"
                                            }`}
                                        />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        className="p-1.5 text-surface-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
