"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Plus, Edit2, Trash2, Eye, Copy, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmailTemplate {
    id: string;
    name: string;
    category: "restaurant" | "supplier" | "client";
    subject: string;
    body: string;
    variables: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    version: number;
}

const categoryConfig = {
    restaurant: { label: "Restaurants", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    supplier: { label: "Fournisseurs", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    client: { label: "Clients", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

const variableSuggestions = {
    restaurant: ["{{restaurant_name}}", "{{owner_name}}", "{{phone}}", "{{email}}", "{{city}}", "{{order_count}}"],
    supplier: ["{{supplier_name}}", "{{contact_name}}", "{{phone}}", "{{email}}", "{{city}}", "{{balance}}"],
    client: ["{{client_name}}", "{{email}}", "{{phone}}", "{{order_id}}", "{{order_date}}", "{{total_amount}}"],
};

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<"all" | "restaurant" | "supplier" | "client">("all");
    
    // Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

    // Fetch templates
    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const query = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
            const res = await adminFetch(`/api/email-templates${query}`);
            if (!res.ok) {
                console.error("Failed to fetch templates");
                setTemplates([]);
            } else {
                const data = await res.json();
                setTemplates(data.templates ?? []);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Filter templates
    const filteredTemplates = templates.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle?")) return;

        try {
            const res = await adminFetch(`/api/email-templates/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTemplates((prev) => prev.filter((t) => t.id !== id));
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Erreur lors de la suppression");
        }
    };

    // Handle duplicate
    const handleDuplicate = async (template: EmailTemplate) => {
        const newName = `${template.name} (Copie)`;
        try {
            const res = await adminFetch("/api/email-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    category: template.category,
                    subject: template.subject,
                    body: template.body,
                    variables: template.variables,
                    is_active: false, // Duplicates start as draft
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setTemplates((prev) => [data.template, ...prev]);
                alert("Modèle dupliqué avec succès!");
            } else {
                alert("Erreur lors de la duplication");
            }
        } catch (error) {
            console.error("Duplicate error:", error);
            alert("Erreur lors de la duplication");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <Mail size={28} className="text-brand-500" />
                        Modèles de Courriel
                    </h1>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        Gérez les modèles d'email pour les restaurants, fournisseurs et clients
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingTemplate(null);
                        setShowEditModal(true);
                    }}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white"
                >
                    <Plus size={18} />
                    Nouveau modèle
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                    <input
                        type="text"
                        placeholder="Chercher par nom ou sujet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-500"
                    />
                </div>
                <div className="flex gap-2">
                    {["all", "restaurant", "supplier", "client"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat as any)}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                                selectedCategory === cat
                                    ? "bg-brand-500 text-white"
                                    : "bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700"
                            )}
                        >
                            {cat === "all" ? "Tous" : categoryConfig[cat as keyof typeof categoryConfig].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Templates List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-brand-500" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-surface-50 dark:bg-surface-900/50 rounded-lg border border-surface-200 dark:border-surface-700">
                        <Mail size={48} className="mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                        <p className="text-surface-600 dark:text-surface-400">Aucun modèle trouvé</p>
                        <p className="text-sm text-surface-500 dark:text-surface-500 mt-1">
                            Créez votre premier modèle de courriel pour commencer
                        </p>
                    </div>
                ) : (
                    <motion.div className="grid gap-3">
                        <AnimatePresence>
                            {filteredTemplates.map((template) => (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-surface-900 dark:text-white truncate">{template.name}</h3>
                                                <Badge
                                                    className={cn(
                                                        "text-xs font-medium",
                                                        categoryConfig[template.category].color
                                                    )}
                                                >
                                                    {categoryConfig[template.category].label}
                                                </Badge>
                                                {!template.is_active && (
                                                    <Badge className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                        Brouillon
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-surface-600 dark:text-surface-400 truncate mb-2">
                                                {template.subject}
                                            </p>
                                            {template.variables.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {template.variables.slice(0, 3).map((v) => (
                                                        <span
                                                            key={v}
                                                            className="text-xs px-2 py-1 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded"
                                                        >
                                                            {v}
                                                        </span>
                                                    ))}
                                                    {template.variables.length > 3 && (
                                                        <span className="text-xs px-2 py-1 text-surface-500">
                                                            +{template.variables.length - 3} plus
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => {
                                                    setPreviewTemplate(template);
                                                    setShowPreviewModal(true);
                                                }}
                                                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                                                title="Aperçu"
                                            >
                                                <Eye size={18} className="text-surface-600 dark:text-surface-400" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingTemplate(template);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 size={18} className="text-blue-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicate(template)}
                                                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                                                title="Dupliquer"
                                            >
                                                <Copy size={18} className="text-purple-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={18} className="text-rose-500" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-500 dark:text-surface-400">
                                        <span>V{template.version} • {new Date(template.updated_at).toLocaleDateString("fr-FR")}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditTemplateModal
                    template={editingTemplate}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingTemplate(null);
                    }}
                    onSave={() => {
                        setShowEditModal(false);
                        setEditingTemplate(null);
                        fetchTemplates();
                    }}
                />
            )}

            {showPreviewModal && previewTemplate && (
                <PreviewTemplateModal
                    template={previewTemplate}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setPreviewTemplate(null);
                    }}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Edit Template Modal ────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface EditTemplateModalProps {
    template: EmailTemplate | null;
    onClose: () => void;
    onSave: () => void;
}

function EditTemplateModal({ template, onClose, onSave }: EditTemplateModalProps) {
    const [formData, setFormData] = useState<Partial<EmailTemplate>>({
        name: template?.name ?? "",
        category: template?.category ?? "restaurant",
        subject: template?.subject ?? "",
        body: template?.body ?? "",
        variables: template?.variables ?? [],
        is_active: template?.is_active ?? false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newVariable, setNewVariable] = useState("");

    const isCreateMode = !template;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            const url = isCreateMode ? "/api/email-templates" : `/api/email-templates/${template?.id}`;
            const method = isCreateMode ? "POST" : "PUT";

            const res = await adminFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Erreur lors de la sauvegarde");
                return;
            }

            onSave();
        } catch (err) {
            console.error("Save error:", err);
            setError("Erreur lors de la sauvegarde");
        } finally {
            setIsSaving(false);
        }
    };

    const categorySelected = formData.category as keyof typeof variableSuggestions;
    const suggestions = variableSuggestions[categorySelected] ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                        {isCreateMode ? "Créer un modèle" : "Modifier le modèle"}
                    </h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3">
                            <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Nom du modèle
                        </label>
                        <input
                            type="text"
                            value={formData.name ?? ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                            placeholder="Ex: Bienvenue restaurant"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Catégorie
                        </label>
                        <select
                            value={formData.category ?? "restaurant"}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                            className="w-full px-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                        >
                            <option value="restaurant">Restaurants</option>
                            <option value="supplier">Fournisseurs</option>
                            <option value="client">Clients</option>
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Objet du courriel
                        </label>
                        <input
                            type="text"
                            value={formData.subject ?? ""}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                            placeholder="Ex: Bienvenue sur KBouffe!"
                            required
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Corps du courriel (HTML)
                        </label>
                        <textarea
                            value={formData.body ?? ""}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            className="w-full px-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white font-mono text-sm"
                            placeholder="Entrez le contenu HTML..."
                            rows={12}
                            required
                        />
                    </div>

                    {/* Variables */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Variables
                        </label>
                        <div className="space-y-3">
                            {/* Quick insert buttons */}
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, variables: [...(formData.variables ?? []), v] })}
                                        className="text-xs px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded transition-colors"
                                    >
                                        + {v}
                                    </button>
                                ))}
                            </div>

                            {/* Variable list */}
                            <div className="flex flex-wrap gap-2">
                                {(formData.variables ?? []).map((v) => (
                                    <div
                                        key={v}
                                        className="flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg text-sm text-surface-700 dark:text-surface-300"
                                    >
                                        {v}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    variables: (formData.variables ?? []).filter((x) => x !== v),
                                                })
                                            }
                                            className="text-surface-500 hover:text-rose-500 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={formData.is_active ?? false}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-surface-300 dark:border-surface-600"
                        />
                        <label className="text-sm text-surface-700 dark:text-surface-300">
                            Rendre ce modèle actif (prêt à l'emploi)
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-surface-200 dark:border-surface-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {isSaving && <Loader2 size={16} className="animate-spin" />}
                            {isCreateMode ? "Créer" : "Mettre à jour"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Preview Template Modal ──────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface PreviewTemplateModalProps {
    template: EmailTemplate;
    onClose: () => void;
}

function PreviewTemplateModal({ template, onClose }: PreviewTemplateModalProps) {
    const [testVariables, setTestVariables] = useState<Record<string, string>>({});

    // Initialize test variables
    useEffect(() => {
        const vars: Record<string, string> = {};
        (template.variables ?? []).forEach((v) => {
            const clean = v.replace(/[{}]/g, "");
            vars[clean] = `[${clean}]`;
        });
        setTestVariables(vars);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template.id]);

    // Replace variables in text
    const replaceVariables = (text: string) => {
        let result = text;
        template.variables.forEach((v) => {
            const clean = v.replace(/[{}]/g, "");
            result = result.replace(new RegExp(v, "g"), testVariables[clean] ?? v);
        });
        return result;
    };

    const previewSubject = replaceVariables(template.subject);
    const previewBody = replaceVariables(template.body);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                        Aperçu: {template.name}
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Test Variables */}
                    {template.variables.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-surface-900 dark:text-white">Test avec des valeurs</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {template.variables.map((v) => {
                                    const clean = v.replace(/[{}]/g, "");
                                    return (
                                        <div key={v}>
                                            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                                                {v}
                                            </label>
                                            <input
                                                type="text"
                                                value={testVariables[clean] ?? ""}
                                                onChange={(e) =>
                                                    setTestVariables({ ...testVariables, [clean]: e.target.value })
                                                }
                                                className="w-full px-3 py-1 text-sm border border-surface-200 dark:border-surface-700 rounded bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                                                placeholder={`[${clean}]`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="space-y-3 border-t border-surface-200 dark:border-surface-700 pt-6">
                        <h3 className="font-bold text-surface-900 dark:text-white">Aperçu</h3>
                        <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 space-y-3">
                            <div>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Objet:</p>
                                <p className="font-bold text-surface-900 dark:text-white">{previewSubject}</p>
                            </div>
                            <div>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mb-2">Corps:</p>
                                <div
                                    className="prose dark:prose-invert max-w-none text-sm text-surface-900 dark:text-surface-100"
                                    dangerouslySetInnerHTML={{ __html: previewBody }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-surface-200 dark:border-surface-700">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
