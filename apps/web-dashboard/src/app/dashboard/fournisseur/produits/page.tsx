"use client";

/**
 * Gestion des Produits Fournisseur — KBouffe
 *
 * Fonctionnalités :
 *   - Grille/tableau des produits avec statut, prix, stock
 *   - Modal "Ajouter un produit" (inline, sans dépendance externe)
 *   - Toggle actif/inactif par produit
 *   - Désactivé si kyc_status !== 'approved'
 */

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { CAMEROON_REGIONS } from "@kbouffe/module-marketplace/lib";
import { useSupplier } from "../SupplierContext";

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
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function getCategoryLabel(value: string): string {
    return CATEGORIES.find((c) => c.value === value)?.label ?? value;
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

// ── Product modal ──────────────────────────────────────────────────────────

function ProductModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (product: Product) => void;
}) {
    const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function update(field: keyof ProductFormData, value: string | boolean) {
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

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                category: form.category,
                price_per_unit: Math.round(Number(form.price_per_unit)),
                unit: form.unit,
                min_order_quantity: form.min_order_quantity
                    ? Number(form.min_order_quantity)
                    : 1,
                available_quantity: form.available_quantity
                    ? Number(form.available_quantity)
                    : undefined,
                origin_region: form.origin_region || undefined,
                description: form.description.trim() || undefined,
                is_organic: form.is_organic,
            };

            const res = await authFetch("/api/marketplace/suppliers/me/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { message?: string };
                throw new Error(body?.message ?? `Erreur ${res.status}`);
            }

            const data = (await res.json()) as { product?: Product } | Product;
            const product =
                "product" in data ? (data as { product: Product }).product : (data as Product);

            onCreated(product);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Erreur lors de la création du produit.");
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
                className="relative w-full max-w-xl bg-surface-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
                    <h2
                        id="modal-title"
                        className="text-base font-bold text-white"
                    >
                        Ajouter un produit
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
                        form="product-form"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Enregistrement…
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

// ── Product row ────────────────────────────────────────────────────────────

function ProductRow({
    product,
    onToggle,
}: {
    product: Product;
    onToggle: (id: string, active: boolean) => void;
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
                    <div className="w-9 h-9 rounded-xl bg-surface-800 border border-white/8 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-surface-400" />
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
                <span className="text-sm text-surface-400">
                    {product.available_quantity != null
                        ? `${product.available_quantity} ${product.unit}`
                        : "—"}
                </span>
            </td>
            <td className="px-4 py-3.5">
                <StatusBadge active={product.is_active} />
            </td>
            <td className="px-4 py-3.5 text-right">
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
            </td>
        </tr>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ProduitsPage() {
    const { supplier } = useSupplier();
    const isApproved = supplier?.kyc_status === "approved";

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/marketplace/suppliers/me/products");
            if (res.ok) {
                const data = (await res.json()) as any;
                const list = Array.isArray(data)
                    ? data
                    : (data?.products ?? []);
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

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

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
                            Validez votre KYC d'abord
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
                        <p className="font-semibold">Catalogue désactivé</p>
                        <p className="text-amber-400/80 text-xs mt-0.5">
                            Votre KYC doit être approuvé avant de pouvoir ajouter ou modifier des
                            produits. Statut actuel :{" "}
                            <strong className="text-amber-300">{supplier.kyc_status}</strong>
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Search */}
            {products.length > 0 && (
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
                    />
                    <input
                        type="search"
                        placeholder="Rechercher un produit…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-xs pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    />
                </div>
            )}

            {/* Table */}
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
                            {search ? "Aucun résultat" : "Aucun produit"}
                        </p>
                        <p className="text-sm text-surface-500 max-w-xs">
                            {search
                                ? `Aucun produit ne correspond à "${search}".`
                                : isApproved
                                ? "Commencez par ajouter votre premier produit au catalogue."
                                : "Votre catalogue sera activé une fois votre KYC approuvé."}
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
                                        Catégorie
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
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((product) => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        onToggle={handleToggle}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Add product modal */}
            <AnimatePresence>
                {modalOpen && (
                    <ProductModal
                        onClose={() => setModalOpen(false)}
                        onCreated={handleCreated}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
