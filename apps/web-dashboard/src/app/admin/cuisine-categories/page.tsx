"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UtensilsCrossed,
    Plus,
    Pencil,
    Trash2,
    GripVertical,
    Check,
    X,
    Eye,
    EyeOff,
} from "lucide-react";
import { Button, toast, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

interface CuisineCategory {
    id: string;
    label: string;
    value: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

type FormData = {
    label: string;
    value: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
};

const emptyForm: FormData = {
    label: "",
    value: "",
    icon: "",
    sort_order: 0,
    is_active: true,
};

export default function AdminCuisineCategoriesPage() {
    const [categories, setCategories] = useState<CuisineCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await adminFetch("/api/admin/catalog/cuisine-categories");
            const json = await res.json();
            setCategories(json.data ?? []);
        } catch {
            toast.error("Erreur lors du chargement des catégories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleCreate = async () => {
        if (!form.label || !form.value || !form.icon) {
            toast.error("Label, valeur et icône sont requis");
            return;
        }
        setSaving(true);
        try {
            const res = await adminFetch("/api/admin/catalog/cuisine-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    sort_order: form.sort_order || categories.length + 1,
                }),
            });
            if (!res.ok) {
                const json = await res.json();
                toast.error(json.error ?? "Erreur lors de la création");
                return;
            }
            toast.success("Catégorie créée avec succès");
            setShowCreate(false);
            setForm(emptyForm);
            fetchCategories();
        } catch {
            toast.error("Erreur réseau");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            const res = await adminFetch(`/api/admin/catalog/cuisine-categories/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const json = await res.json();
                toast.error(json.error ?? "Erreur lors de la mise à jour");
                return;
            }
            toast.success("Catégorie mise à jour");
            setEditingId(null);
            setForm(emptyForm);
            fetchCategories();
        } catch {
            toast.error("Erreur réseau");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, label: string) => {
        if (!confirm(`Supprimer la catégorie « ${label} » ?`)) return;
        try {
            const res = await adminFetch(`/api/admin/catalog/cuisine-categories/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const json = await res.json();
                toast.error(json.error ?? "Erreur lors de la suppression");
                return;
            }
            toast.success("Catégorie supprimée");
            fetchCategories();
        } catch {
            toast.error("Erreur réseau");
        }
    };

    const handleToggleActive = async (cat: CuisineCategory) => {
        try {
            await adminFetch(`/api/admin/catalog/cuisine-categories/${cat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !cat.is_active }),
            });
            fetchCategories();
        } catch {
            toast.error("Erreur réseau");
        }
    };

    const startEdit = (cat: CuisineCategory) => {
        setEditingId(cat.id);
        setShowCreate(false);
        setForm({
            label: cat.label,
            value: cat.value,
            icon: cat.icon,
            sort_order: cat.sort_order,
            is_active: cat.is_active,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setShowCreate(false);
        setForm(emptyForm);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <UtensilsCrossed className="text-brand-500" size={28} />
                        Catégories de cuisine
                    </h1>
                    <p className="text-surface-500 mt-1">
                        Gérez les filtres de cuisine affichés sur la page de découverte client.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setShowCreate(true);
                        setEditingId(null);
                        setForm({ ...emptyForm, sort_order: categories.length + 1 });
                    }}
                    className="gap-2"
                >
                    <Plus size={18} />
                    Ajouter une catégorie
                </Button>
            </div>

            {/* Preview */}
            <div className="bg-surface-50 dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                <p className="text-xs uppercase tracking-widest text-surface-400 font-bold mb-4">Aperçu client</p>
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
                    <div className="shrink-0 flex flex-col items-center justify-center gap-2.5 w-24 h-24 rounded-2xl border-2 bg-brand-500 border-brand-500 text-white font-bold text-[10px] uppercase tracking-wider">
                        <div className="text-2xl">🥙</div>
                        Tout
                    </div>
                    {categories.filter(c => c.is_active).map((c) => (
                        <div
                            key={c.id}
                            className="shrink-0 flex flex-col items-center justify-center gap-2.5 w-24 h-24 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-500 font-bold text-[10px] uppercase tracking-wider"
                        >
                            <div className="text-2xl">{c.icon}</div>
                            {c.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-brand-200 dark:border-brand-500/30 p-6 space-y-4">
                            <h3 className="font-semibold text-surface-900 dark:text-white">Nouvelle catégorie</h3>
                            <CategoryForm form={form} setForm={setForm} />
                            <div className="flex items-center gap-3 pt-2">
                                <Button onClick={handleCreate} disabled={saving} className="gap-2">
                                    <Check size={16} />
                                    {saving ? "Création..." : "Créer"}
                                </Button>
                                <Button variant="ghost" onClick={cancelEdit}>
                                    <X size={16} />
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Categories List */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-surface-400">Chargement...</div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center text-surface-400">
                        Aucune catégorie. Cliquez sur « Ajouter » pour commencer.
                    </div>
                ) : (
                    <div className="divide-y divide-surface-100 dark:divide-surface-800">
                        {categories.map((cat) => (
                            <div key={cat.id}>
                                {editingId === cat.id ? (
                                    <div className="p-6 bg-brand-50/50 dark:bg-brand-500/5 space-y-4">
                                        <h3 className="font-semibold text-surface-900 dark:text-white">
                                            Modifier « {cat.label} »
                                        </h3>
                                        <CategoryForm form={form} setForm={setForm} />
                                        <div className="flex items-center gap-3 pt-2">
                                            <Button onClick={handleUpdate} disabled={saving} className="gap-2">
                                                <Check size={16} />
                                                {saving ? "Enregistrement..." : "Enregistrer"}
                                            </Button>
                                            <Button variant="ghost" onClick={cancelEdit}>
                                                <X size={16} />
                                                Annuler
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 px-6 py-4 group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                        <GripVertical size={16} className="text-surface-300 shrink-0" />
                                        <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-2xl shrink-0">
                                            {cat.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-surface-900 dark:text-white">
                                                    {cat.label}
                                                </span>
                                                <span className="text-xs text-surface-400 font-mono">
                                                    {cat.value}
                                                </span>
                                                {!cat.is_active && (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                                        Masqué
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-surface-400">
                                                Ordre : {cat.sort_order}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleToggleActive(cat)}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    cat.is_active
                                                        ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                        : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                                                )}
                                                title={cat.is_active ? "Masquer" : "Afficher"}
                                            >
                                                {cat.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => startEdit(cat)}
                                                className="p-2 rounded-lg text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                                                title="Modifier"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id, cat.label)}
                                                className="p-2 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CategoryForm({
    form,
    setForm,
}: {
    form: FormData;
    setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                    Icône (émoji)
                </label>
                <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="🍔"
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-center text-2xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                    Label (affiché au client)
                </label>
                <input
                    type="text"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Burgers"
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                    Valeur (filtre technique)
                </label>
                <input
                    type="text"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder="fast-food"
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 font-mono text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                    Ordre d'affichage
                </label>
                <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
            </div>
        </div>
    );
}
