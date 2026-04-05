"use client";

/**
 * Gestion des Produits Fournisseur — KBouffe
 *
 * Fonctionnalités :
 *   - Grille/tableau des produits avec statut, prix, stock
 *   - Modal "Ajouter un produit" et "Modifier un produit"
 *   - Toggle actif/inactif par produit
 *   - Suppression de produit avec confirmation
 *   - Désactivé si kyc_status !== 'approved'
 */

import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadImage } from "@/hooks/use-upload-image";
import {
    Plus,
    X,
    Package,
    AlertTriangle,
    Loader2,
    ToggleLeft,
    ToggleRight,
    Leaf,
    Search,
    ChevronDown,
    Pencil,
    Trash2,
    Save,
    ImagePlus,
    Camera,
    BarChart3,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { CAMEROON_REGIONS } from "@kbouffe/module-marketplace/lib";
import { useSupplier } from "../SupplierContext";
import { ProductFilters, DEFAULT_FILTERS, type ProductFilterState } from "./components/ProductFilters";
import { ProductAnalytics } from "./components/ProductAnalytics";
import { StockAlertBadge } from "./components/StockAlertBadge";

// ── Types ──────────────────────────────────────────────────────────────────

interface Product {
    id: string;
    name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    min_order_quantity: number;
    available_quantity: number | null;
    origin_region: string | null;
    description: string | null;
    photos: string[];
    is_organic: boolean;
    is_active: boolean;
    created_at: string;
}

interface ProductFormData {
    name: string;
    category: string;
    price_per_unit: string;
    unit: string;
    min_order_quantity: string;
    available_quantity: string;
    origin_region: string;
    description: string;
    is_organic: boolean;
    photos: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
    { value: "legumes", label: "Légumes" },
    { value: "fruits", label: "Fruits" },
    { value: "cereales", label: "Céréales" },
    { value: "viande", label: "Viandes" },
    { value: "poisson", label: "Poissons" },
    { value: "epices", label: "Épices" },
    { value: "produits_laitiers", label: "Produits laitiers" },
    { value: "huiles", label: "Huiles" },
    { value: "condiments", label: "Condiments" },
    { value: "autres", label: "Autres" },
] as const;

const UNITS = [
    { value: "kg", label: "Kilogramme (kg)" },
    { value: "tonne", label: "Tonne" },
    { value: "litre", label: "Litre" },
    { value: "piece", label: "Pièce / Unité" },
    { value: "botte", label: "Botte" },
    { value: "sac", label: "Sac" },
    { value: "colis", label: "Colis / Carton" },
    { value: "caisse", label: "Caisse" },
] as const;

const EMPTY_FORM: ProductFormData = {
    name: "",
    category: "",
    price_per_unit: "",
    unit: "kg",
    min_order_quantity: "1",
    available_quantity: "",
    origin_region: "",
    description: "",
    is_organic: false,
    photos: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function getCategoryLabel(value: string): string {
    return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function productToFormData(product: Product): ProductFormData {
    return {
        name: product.name,
        category: product.category,
        price_per_unit: String(product.price_per_unit),
        unit: product.unit,
        min_order_quantity: String(product.min_order_quantity),
        available_quantity: product.available_quantity != null ? String(product.available_quantity) : "",
        origin_region: product.origin_region ?? "",
        description: product.description ?? "",
        is_organic: product.is_organic,
        photos: product.photos ?? [],
    };
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                active
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                    : "bg-surface-800 text-surface-500 border border-white/8"
            }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-surface-500"}`}
            />
            {active ? "Actif" : "Inactif"}
        </span>
    );
}

// ── Form field ─────────────────────────────────────────────────────────────

function FormField({
    label,
    required,
    children,
    hint,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    hint?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-xs text-surface-500">{hint}</p>}
        </div>
    );
}

const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all";

const selectClass =
    "w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-white/8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all appearance-none cursor-pointer";

// ── Product modal (Create + Edit) ──────────────────────────────────────────

// ── Photo upload section ────────────────────────────────────────────────────

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 1;

function PhotoUploadSection({
    photos,
    onChange,
    disabled,
}: {
    photos: string[];
    onChange: (photos: string[]) => void;
    disabled?: boolean;
}) {
    const { upload, uploading, error: uploadError } = useUploadImage();
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const remaining = MAX_PHOTOS - photos.length;
        if (remaining <= 0) return;

        const toUpload = Array.from(files).slice(0, remaining);
        const newUrls: string[] = [];

        for (const file of toUpload) {
            const result = await upload(file);
            if (!result) break; // upload() sets the error internally
            newUrls.push(result.url);
        }

        if (newUrls.length > 0) {
            onChange([...photos, ...newUrls]);
        }
        // Reset input so the same file can be re-selected after remove
        if (inputRef.current) inputRef.current.value = "";
    }

    function removePhoto(idx: number) {
        onChange(photos.filter((_, i) => i !== idx));
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-300">
                    Photos du produit
                    <span className="text-red-400 ml-1">*</span>
                </label>
                <span className={`text-xs font-semibold tabular-nums ${photos.length >= MAX_PHOTOS ? "text-amber-400" : "text-surface-500"}`}>
                    {photos.length} / {MAX_PHOTOS}
                </span>
            </div>

            {/* Thumbnails grid */}
            <div className="grid grid-cols-5 gap-2 mb-3">
                {photos.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square">
                        <img
                            src={url}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-white/10"
                        />
                        <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            disabled={disabled}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            aria-label="Supprimer la photo"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                    </div>
                ))}

                {/* Add slot */}
                {photos.length < MAX_PHOTOS && (
                    <label className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer ${uploading || disabled ? "opacity-50 cursor-not-allowed border-white/10" : "border-white/20 hover:border-brand-500/60 hover:bg-brand-500/5"}`}>
                        {uploading ? (
                            <Loader2 size={16} className="animate-spin text-surface-400" />
                        ) : (
                            <>
                                <ImagePlus size={16} className="text-surface-500 mb-1" />
                                <span className="text-[9px] text-surface-500 font-medium">Ajouter</span>
                            </>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            multiple
                            disabled={uploading || disabled}
                            className="sr-only"
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                    </label>
                )}

                {/* Empty placeholder slots */}
                {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length - (photos.length < MAX_PHOTOS ? 1 : 0)) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-lg border border-dashed border-white/8 bg-surface-800/30" />
                ))}
            </div>

            {/* Hint */}
            <p className="text-xs text-surface-500">
                {photos.length === 0
                    ? "Au moins 1 photo obligatoire · max 5 · jpeg/png/webp"
                    : photos.length < MIN_PHOTOS
                    ? "1 photo minimum requise"
                    : `${MAX_PHOTOS - photos.length} emplacement${MAX_PHOTOS - photos.length > 1 ? "s" : ""} restant${MAX_PHOTOS - photos.length > 1 ? "s" : ""}`}
            </p>

            {uploadError && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={11} /> {uploadError}
                </p>
            )}
        </div>
    );
}

// ── Product modal ───────────────────────────────────────────────────────────

function ProductModal({
    product,
    onClose,
    onCreated,
    onUpdated,
}: {
    product?: Product;          // undefined = create mode, defined = edit mode
    onClose: () => void;
    onCreated?: (product: Product) => void;
    onUpdated?: (product: Product) => void;
}) {
    const isEdit = !!product;
    const [form, setForm] = useState<ProductFormData>(
        isEdit ? productToFormData(product) : EMPTY_FORM
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function update(field: keyof ProductFormData, value: string | boolean | string[]) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.name.trim()) return setError("Le nom du produit est requis.");
        if (!form.category) return setError("La catégorie est requise.");
        if (!form.price_per_unit || isNaN(Number(form.price_per_unit)))
            return setError("Le prix unitaire est invalide.");
        if (!form.unit) return setError("L'unité est requise.");
        if (form.photos.length < MIN_PHOTOS)
            return setError(`Au moins ${MIN_PHOTOS} photo est requise.`);
        if (form.photos.length > MAX_PHOTOS)
            return setError(`Maximum ${MAX_PHOTOS} photos autorisées.`);

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                category: form.category,
                price_per_unit: Math.round(Number(form.price_per_unit)),
                unit: form.unit,
                min_order_quantity: form.min_order_quantity ? Number(form.min_order_quantity) : 1,
                available_quantity: form.available_quantity ? Number(form.available_quantity) : null,
                origin_region: form.origin_region || undefined,
                description: form.description.trim() || undefined,
                is_organic: form.is_organic,
                photos: form.photos,
            };

            let res: Response;
            if (isEdit) {
                res = await authFetch(`/api/marketplace/suppliers/supplier-products/${product.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await authFetch("/api/marketplace/suppliers/me/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
                throw new Error(body?.error ?? body?.message ?? `Erreur ${res.status}`);
            }

            const data = (await res.json()) as { product?: Product } | Product;
            const saved =
                "product" in data ? (data as { product: Product }).product : (data as Product);

            if (isEdit) {
                onUpdated?.(saved);
            } else {
                onCreated?.(saved);
            }
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Erreur lors de l'enregistrement du produit.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal panel */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="relative w-full max-w-2xl bg-surface-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
                    <h2
                        id="modal-title"
                        className="text-base font-bold text-white"
                    >
                        {isEdit ? "Modifier le produit" : "Ajouter un produit"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-white/8 transition-colors"
                        aria-label="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
                >
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Name */}
                    <FormField label="Nom du produit" required>
                        <input
                            type="text"
                            placeholder="Ex : Tomates fraîches, Maïs jaune..."
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            className={inputClass}
                        />
                    </FormField>

                    {/* Category + Unit side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Catégorie" required>
                            <div className="relative">
                                <select
                                    value={form.category}
                                    onChange={(e) => update("category", e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Choisir…</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                            </div>
                        </FormField>
                        <FormField label="Unité" required>
                            <div className="relative">
                                <select
                                    value={form.unit}
                                    onChange={(e) => update("unit", e.target.value)}
                                    className={selectClass}
                                >
                                    {UNITS.map((u) => (
                                        <option key={u.value} value={u.value}>
                                            {u.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                            </div>
                        </FormField>
                    </div>

                    {/* Price + Min qty side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Prix / unité (FCFA)" required>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Ex : 1500"
                                value={form.price_per_unit}
                                onChange={(e) => update("price_per_unit", e.target.value)}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Qté min. commande" hint="Par défaut : 1">
                            <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="1"
                                value={form.min_order_quantity}
                                onChange={(e) => update("min_order_quantity", e.target.value)}
                                className={inputClass}
                            />
                        </FormField>
                    </div>

                    {/* Stock + Region */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Stock disponible" hint="Optionnel">
                            <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Illimité si vide"
                                value={form.available_quantity}
                                onChange={(e) => update("available_quantity", e.target.value)}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Région d'origine" hint="Optionnel">
                            <div className="relative">
                                <select
                                    value={form.origin_region}
                                    onChange={(e) => update("origin_region", e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Non précisée</option>
                                    {CAMEROON_REGIONS.map((r: string) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                            </div>
                        </FormField>
                    </div>

                    {/* Description */}
                    <FormField label="Description" hint="Variété, qualité, traçabilité…">
                        <textarea
                            rows={3}
                            placeholder="Décrivez votre produit, son origine, ses caractéristiques..."
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            className={`${inputClass} resize-none`}
                        />
                    </FormField>

                    {/* Photos */}
                    <PhotoUploadSection
                        photos={form.photos}
                        onChange={(photos) => update("photos", photos)}
                        disabled={submitting}
                    />

                    {/* Organic toggle */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800 border border-white/8">
                        <Leaf size={17} className="text-emerald-400 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">Produit biologique</p>
                            <p className="text-xs text-surface-500">
                                Sans pesticides chimiques de synthèse
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => update("is_organic", !form.is_organic)}
                            className="text-surface-400 hover:text-emerald-400 transition-colors"
                            aria-pressed={form.is_organic}
                            aria-label="Produit biologique"
                        >
                            {form.is_organic ? (
                                <ToggleRight size={28} className="text-emerald-400" />
                            ) : (
                                <ToggleLeft size={28} />
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-white hover:bg-white/8 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Enregistrement…
                            </>
                        ) : isEdit ? (
                            <>
                                <Save size={16} />
                                Enregistrer
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Ajouter le produit
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Delete confirmation modal ──────────────────────────────────────────────

function DeleteConfirmModal({
    product,
    onClose,
    onDeleted,
}: {
    product: Product;
    onClose: () => void;
    onDeleted: (id: string) => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setDeleting(true);
        try {
            const res = await authFetch(
                `/api/marketplace/suppliers/supplier-products/${product.id}`,
                { method: "DELETE" }
            );
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body?.error ?? `Erreur ${res.status}`);
            }
            onDeleted(product.id);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Erreur lors de la suppression.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="relative w-full max-w-sm bg-surface-900 rounded-2xl border border-white/10 shadow-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                        <Trash2 size={18} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Supprimer ce produit ?</h3>
                        <p className="text-xs text-surface-500 mt-0.5 truncate max-w-[220px]">{product.name}</p>
                    </div>
                </div>
                <p className="text-sm text-surface-400 mb-5">
                    Cette action est irréversible. Le produit sera retiré de votre catalogue.
                </p>
                {error && (
                    <p className="text-xs text-red-400 mb-3">{error}</p>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 transition-all border border-white/8"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/25 disabled:opacity-50 transition-all"
                    >
                        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        Supprimer
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Product row ────────────────────────────────────────────────────────────

function ProductRow({
    product,
    onToggle,
    onEdit,
    onDelete,
}: {
    product: Product;
    onToggle: (id: string, active: boolean) => void;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
}) {
    const [toggling, setToggling] = useState(false);

    async function handleToggle() {
        setToggling(true);
        try {
            const res = await authFetch(
                `/api/marketplace/suppliers/supplier-products/${product.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_active: !product.is_active }),
                }
            );
            if (res.ok) {
                onToggle(product.id, !product.is_active);
            }
        } catch (err) {
            console.error("Toggle error:", err);
        } finally {
            setToggling(false);
        }
    }

    return (
        <tr className="border-b border-white/5 hover:bg-white/3 transition-colors group">
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-800 border border-white/8 flex items-center justify-center shrink-0 overflow-hidden">
                        {product.photos?.[0] ? (
                            <img
                                src={product.photos[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Camera size={16} className="text-surface-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">
                            {product.name}
                            {product.is_organic && (
                                <Leaf
                                    size={12}
                                    className="inline ml-1.5 text-emerald-400"
                                    aria-label="Biologique"
                                />
                            )}
                        </p>
                        {product.description && (
                            <p className="text-xs text-surface-500 truncate max-w-xs">
                                {product.description}
                            </p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3.5 hidden sm:table-cell">
                <span className="px-2 py-0.5 rounded-lg bg-surface-800 text-xs text-surface-400 border border-white/5">
                    {getCategoryLabel(product.category)}
                </span>
            </td>
            <td className="px-4 py-3.5 text-sm text-white font-semibold tabular-nums">
                {formatFCFA(product.price_per_unit)}
                <span className="text-surface-500 font-normal ml-0.5">/{product.unit}</span>
            </td>
            <td className="px-4 py-3.5 hidden md:table-cell">
                <StockAlertBadge
                    availableQty={product.available_quantity}
                    minOrderQty={product.min_order_quantity}
                    unit={product.unit}
                />
            </td>
            <td className="px-4 py-3.5">
                <StatusBadge active={product.is_active} />
            </td>
            <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                    {/* Edit */}
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                        aria-label="Modifier le produit"
                        title="Modifier"
                    >
                        <Pencil size={15} />
                    </button>
                    {/* Toggle */}
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-white hover:bg-white/8 transition-all disabled:opacity-50"
                        aria-label={product.is_active ? "Désactiver le produit" : "Activer le produit"}
                        title={product.is_active ? "Désactiver" : "Activer"}
                    >
                        {toggling ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : product.is_active ? (
                            <ToggleRight size={22} className="text-emerald-400" />
                        ) : (
                            <ToggleLeft size={22} />
                        )}
                    </button>
                    {/* Delete */}
                    <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        aria-label="Supprimer le produit"
                        title="Supprimer"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

// ── Tab type ──────────────────────────────────────────────────────────────

type ProductTab = "list" | "analytics";

// ── Stock-level helper for filtering ──────────────────────────────────────

function getStockLevel(available: number | null, minOrder: number): "low" | "good" | "excess" | "unknown" {
    if (available == null) return "unknown";
    if (available < minOrder) return "low";
    if (available > minOrder * 5) return "excess";
    return "good";
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ProduitsPage() {
    const { supplier } = useSupplier();
    const isApproved = supplier?.kyc_status === "approved";

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState<ProductTab>("list");
    const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/marketplace/suppliers/me/products");
            if (res.ok) {
                const data = (await res.json()) as any;
                const list = Array.isArray(data) ? data : (data?.products ?? []);
                setProducts(list as Product[]);
            }
        } catch (err) {
            console.error("Products fetch:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    function handleToggle(id: string, active: boolean) {
        setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, is_active: active } : p))
        );
    }

    function handleCreated(product: Product) {
        setProducts((prev) => [product, ...prev]);
    }

    function handleUpdated(updated: Product) {
        setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
        );
    }

    function handleDeleted(id: string) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
    }

    // Apply all filters
    const filtered = useMemo(() => {
        return products.filter((p) => {
            // Search
            if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            // Category
            if (filters.category && p.category !== filters.category) {
                return false;
            }
            // Region
            if (filters.region && p.origin_region !== filters.region) {
                return false;
            }
            // Type (bio / conventional)
            if (filters.type === "bio" && !p.is_organic) return false;
            if (filters.type === "conventional" && p.is_organic) return false;
            // Status (active / inactive)
            if (filters.status === "active" && !p.is_active) return false;
            if (filters.status === "inactive" && p.is_active) return false;
            // Stock level
            if (filters.stock !== "all") {
                const level = getStockLevel(p.available_quantity, p.min_order_quantity);
                if (filters.stock === "low" && level !== "low") return false;
                if (filters.stock === "good" && level !== "good") return false;
                if (filters.stock === "excess" && level !== "excess") return false;
            }
            return true;
        });
    }, [products, filters]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Mes produits
                    </h1>
                    <p className="text-surface-400 text-sm mt-1">
                        {products.length} produit{products.length !== 1 ? "s" : ""} au catalogue
                    </p>
                </div>

                <div className="relative group">
                    <button
                        onClick={() => isApproved && setModalOpen(true)}
                        disabled={!isApproved}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
                        aria-label="Ajouter un produit"
                    >
                        <Plus size={17} />
                        Ajouter un produit
                    </button>
                    {!isApproved && (
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-surface-800 text-white text-xs rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                            Validez votre KYC d&apos;abord
                        </div>
                    )}
                </div>
            </div>

            {/* KYC warning */}
            {!isApproved && supplier && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm"
                    role="alert"
                >
                    <AlertTriangle size={17} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Catalogue desactive</p>
                        <p className="text-amber-400/80 text-xs mt-0.5">
                            Votre KYC doit etre approuve avant de pouvoir ajouter ou modifier des
                            produits. Statut actuel :{" "}
                            <strong className="text-amber-300">{supplier.kyc_status}</strong>
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Tabs: Tous les produits | Analytics */}
            <div className="flex items-center gap-1 border-b border-white/8" role="tablist" aria-label="Onglets produits">
                <button
                    role="tab"
                    aria-selected={activeTab === "list"}
                    aria-controls="panel-list"
                    onClick={() => setActiveTab("list")}
                    className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                        activeTab === "list"
                            ? "border-brand-500 text-brand-300"
                            : "border-transparent text-surface-500 hover:text-white"
                    }`}
                >
                    <span className="inline-flex items-center gap-1.5">
                        <Package size={15} />
                        Tous les produits
                    </span>
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === "analytics"}
                    aria-controls="panel-analytics"
                    onClick={() => setActiveTab("analytics")}
                    className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                        activeTab === "analytics"
                            ? "border-brand-500 text-brand-300"
                            : "border-transparent text-surface-500 hover:text-white"
                    }`}
                >
                    <span className="inline-flex items-center gap-1.5">
                        <BarChart3 size={15} />
                        Analytics
                    </span>
                </button>
            </div>

            {/* Tab panels */}
            {activeTab === "list" && (
                <div id="panel-list" role="tabpanel" className="space-y-4">
                    {/* Advanced filters */}
                    {products.length > 0 && (
                        <ProductFilters
                            filters={filters}
                            onChange={setFilters}
                            resultCount={filtered.length}
                            totalCount={products.length}
                        />
                    )}

                    {/* Products table */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="bg-surface-900 rounded-2xl border border-white/8 overflow-hidden"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 size={24} className="text-brand-400 animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-white/8 flex items-center justify-center mb-4">
                                    <Package size={24} className="text-surface-500" />
                                </div>
                                <p className="text-white font-semibold mb-1">
                                    {filters.search || filters.category || filters.region || filters.type !== "all" || filters.status !== "all" || filters.stock !== "all"
                                        ? "Aucun resultat"
                                        : "Aucun produit"}
                                </p>
                                <p className="text-sm text-surface-500 max-w-xs">
                                    {filters.search
                                        ? `Aucun produit ne correspond aux filtres appliques.`
                                        : isApproved
                                        ? "Commencez par ajouter votre premier produit au catalogue."
                                        : "Votre catalogue sera active une fois votre KYC approuve."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px]">
                                    <thead>
                                        <tr className="border-b border-white/8">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                                Produit
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden sm:table-cell">
                                                Categorie
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                                Prix
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">
                                                Stock
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((product) => (
                                            <ProductRow
                                                key={product.id}
                                                product={product}
                                                onToggle={handleToggle}
                                                onEdit={setEditProduct}
                                                onDelete={setDeleteProduct}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {activeTab === "analytics" && (
                <div id="panel-analytics" role="tabpanel">
                    <ProductAnalytics products={products} />
                </div>
            )}

            {/* Add product modal */}
            <AnimatePresence>
                {modalOpen && (
                    <ProductModal
                        onClose={() => setModalOpen(false)}
                        onCreated={handleCreated}
                    />
                )}
            </AnimatePresence>

            {/* Edit product modal */}
            <AnimatePresence>
                {editProduct && (
                    <ProductModal
                        product={editProduct}
                        onClose={() => setEditProduct(null)}
                        onUpdated={handleUpdated}
                    />
                )}
            </AnimatePresence>

            {/* Delete confirmation modal */}
            <AnimatePresence>
                {deleteProduct && (
                    <DeleteConfirmModal
                        product={deleteProduct}
                        onClose={() => setDeleteProduct(null)}
                        onDeleted={handleDeleted}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
