"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { Card, Button, Input, Textarea, Modal, ModalFooter, Toggle, EmptyState } from "@/components/ui";
import { toast } from "@/components/ui";
import { useLocale } from "@/contexts/locale-context";
import { useCategories, useProducts, createCategory as apiCreateCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory, importCategoryPack } from "@/hooks/use-data";
import { useDashboard } from "@/contexts/dashboard-context";
import type { Category } from "@/lib/supabase/types";

export function CategoryList() {
    const { t } = useLocale();
    const { restaurant } = useDashboard();
    const { categories, mutate: mutateCategories } = useCategories();
    const { products } = useProducts();
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedPack, setSelectedPack] = useState("boissons");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: "", description: "", isActive: true });
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);

    const openCreate = () => {
        setEditingCategory(null);
        setForm({ name: "", description: "", isActive: true });
        setShowModal(true);
    };

    const openImport = () => {
        setSelectedPack("boissons");
        setShowImportModal(true);
    };

    const openEdit = (cat: Category) => {
        setEditingCategory(cat);
        setForm({ name: cat.name, description: cat.description ?? "", isActive: cat.is_active });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error(t.menu.nameRequired); return; }
        setSaving(true);

        if (editingCategory) {
            const { error } = await apiUpdateCategory(editingCategory.id, {
                name: form.name,
                description: form.description || null,
                is_active: form.isActive,
            });
            if (error) { toast.error(error); setSaving(false); return; }
            mutateCategories();
            toast.success(t.menu.categoryUpdated);
        } else {
            const { error } = await apiCreateCategory({
                name: form.name,
                description: form.description || null,
                is_active: form.isActive,
            });
            if (error) { toast.error(error); setSaving(false); return; }
            mutateCategories();
            toast.success(t.menu.categoryCreated);
        }
        setSaving(false);
        setShowModal(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await apiDeleteCategory(id);
        if (error) { toast.error(error); return; }
        mutateCategories();
        toast.success(t.menu.categoryDeleted);
    };

    const getProductCount = (categoryId: string) => {
        return products.filter(p => p.category_id === categoryId).length;
    };

    const handleImport = async () => {
        if (!restaurant) return;
        setImporting(true);
        const { error } = await importCategoryPack(selectedPack, restaurant.id);
        
        if (error) {
            toast.error(error);
        } else {
            toast.success("Pack importé avec succès !");
            mutateCategories();
            setShowImportModal(false);
        }
        setImporting(false);
    };

    return (
        <>
            <Card padding="none">
                <div className="p-4 flex items-center justify-between border-b border-surface-100 dark:border-surface-800">
                    <h3 className="font-semibold text-surface-900 dark:text-white">{t.menu.categories}</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={openImport}>
                            Importer un pack
                        </Button>
                        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
                            {t.menu.newCategory}
                        </Button>
                    </div>
                </div>

                {categories.length === 0 ? (
                    <EmptyState
                        icon={<FolderOpen size={32} />}
                        title={t.menu.noCategories}
                        description={t.menu.noCategoriesHint}
                    />
                ) : (
                    <div className="divide-y divide-surface-100 dark:divide-surface-800">
                        {categories.map((cat) => (
                            <div key={cat.id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${cat.is_active ? "bg-green-500" : "bg-surface-300"}`} />
                                    <div>
                                        <p className="font-medium text-surface-900 dark:text-white">{cat.name}</p>
                                        <p className="text-xs text-surface-500">{getProductCount(cat.id)} {t.menu.productsCountLabel}{cat.description ? ` \u00B7 ${cat.description}` : ""}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEdit(cat)}
                                        className="p-2 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-surface-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? t.menu.editCategory : t.menu.newCategory}
            >
                <div className="space-y-4">
                    <Input
                        label={t.menu.categoryName}
                        placeholder={t.menu.categoryNamePlaceholder}
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textarea
                        label={t.menu.categoryDescription}
                        placeholder={t.menu.categoryDescPlaceholder}
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                    />
                    <Toggle
                        checked={form.isActive}
                        onChange={(val) => setForm(prev => ({ ...prev, isActive: val }))}
                        label={t.menu.categoryActive}
                        description={t.menu.categoryActiveHint}
                    />
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
                    <Button onClick={handleSave}>{editingCategory ? t.common.save : t.common.create}</Button>
                </ModalFooter>
            </Modal>

            <Modal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                title="Importer un pack de catégories"
            >
                <div className="space-y-4">
                    <p className="text-sm text-surface-500">
                        Gagnez du temps en important un pack de catégories et de produits préconfigurés. 
                        Les produits seront importés en mode &quot;indisponible&quot; afin que vous puissiez ajuster leurs prix.
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Sélectionner un pack</label>
                        <select 
                            className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50"
                            value={selectedPack}
                            onChange={(e) => setSelectedPack(e.target.value)}
                        >
                            <option value="boissons">Pack Boissons (Bières, Eaux, Jus, Sodas)</option>
                        </select>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowImportModal(false)}>Annuler</Button>
                    <Button 
                        onClick={handleImport} 
                        isLoading={importing}
                        disabled={importing}
                    >
                        Importer
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}
