"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Sparkles,
    ToggleLeft,
    ToggleRight,
    Flame,
    ShoppingCart,
    Tag,
    Layers,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";

// ── Types ────────────────────────────────────────────────────────────────────

interface UpsellRule {
    id: string;
    trigger_type: "global" | "product" | "category" | "cart_value";
    trigger_product_id: string | null;
    trigger_category_id: string | null;
    trigger_min_cart: number;
    suggested_product_id: string;
    discount_percent: number;
    custom_message: string | null;
    position: string;
    priority: number;
    max_suggestions: number;
    is_active: boolean;
    created_at: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category_id: string | null;
}

interface Category {
    id: string;
    name: string;
}

// ── Trigger labels ──────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
    global:     { label: "Global",          icon: <Sparkles size={14} />,     desc: "Montrer à tous les clients" },
    product:    { label: "Produit lié",     icon: <ShoppingCart size={14} />, desc: "Quand un produit spécifique est dans le panier" },
    category:   { label: "Catégorie",       icon: <Layers size={14} />,       desc: "Quand une catégorie est dans le panier" },
    cart_value: { label: "Montant panier",  icon: <Tag size={14} />,          desc: "Quand le panier dépasse un montant" },
};

// ── Main page ───────────────────────────────────────────────────────────────

export default function UpsellsPage() {
    const [rules, setRules] = useState<UpsellRule[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formTriggerType, setFormTriggerType] = useState<string>("global");
    const [formTriggerProductId, setFormTriggerProductId] = useState<string>("");
    const [formTriggerCategoryId, setFormTriggerCategoryId] = useState<string>("");
    const [formTriggerMinCart, setFormTriggerMinCart] = useState<number>(0);
    const [formSuggestedProductId, setFormSuggestedProductId] = useState<string>("");
    const [formDiscountPercent, setFormDiscountPercent] = useState<number>(0);
    const [formCustomMessage, setFormCustomMessage] = useState<string>("");
    const [formPriority, setFormPriority] = useState<number>(0);

    // ── Fetch data ──────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rulesRes, productsRes, categoriesRes] = await Promise.all([
                fetch("/api/upsell-rules"),
                fetch("/api/products"),
                fetch("/api/categories"),
            ]);

            const rulesData = await rulesRes.json();
            const productsData = await productsRes.json();
            const categoriesData = await categoriesRes.json();

            setRules(rulesData.rules ?? []);
            setProducts(productsData.products ?? productsData ?? []);
            setCategories(categoriesData.categories ?? categoriesData ?? []);
        } catch {
            setError("Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!formSuggestedProductId) {
            setError("Veuillez sélectionner un produit à suggérer");
            return;
        }
        setSaving(true);
        setError(null);

        try {
            const body: Record<string, unknown> = {
                trigger_type: formTriggerType,
                suggested_product_id: formSuggestedProductId,
                discount_percent: formDiscountPercent,
                custom_message: formCustomMessage || null,
                priority: formPriority,
                position: "pre_checkout",
                max_suggestions: 3,
            };

            if (formTriggerType === "product" && formTriggerProductId) {
                body.trigger_product_id = formTriggerProductId;
            }
            if (formTriggerType === "category" && formTriggerCategoryId) {
                body.trigger_category_id = formTriggerCategoryId;
            }
            if (formTriggerType === "cart_value") {
                body.trigger_min_cart = formTriggerMinCart;
            }

            const res = await fetch("/api/upsell-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Erreur lors de la création");
                return;
            }

            // Reset form and refresh
            setShowForm(false);
            resetForm();
            fetchData();
        } catch {
            setError("Erreur réseau");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (rule: UpsellRule) => {
        try {
            await fetch(`/api/upsell-rules/${rule.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !rule.is_active }),
            });
            setRules((prev) =>
                prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)),
            );
        } catch {
            setError("Erreur lors de la mise à jour");
        }
    };

    const handleDelete = async (ruleId: string) => {
        if (!confirm("Supprimer cette règle d'upsell ?")) return;
        try {
            await fetch(`/api/upsell-rules/${ruleId}`, { method: "DELETE" });
            setRules((prev) => prev.filter((r) => r.id !== ruleId));
        } catch {
            setError("Erreur lors de la suppression");
        }
    };

    const resetForm = () => {
        setFormTriggerType("global");
        setFormTriggerProductId("");
        setFormTriggerCategoryId("");
        setFormTriggerMinCart(0);
        setFormSuggestedProductId("");
        setFormDiscountPercent(0);
        setFormCustomMessage("");
        setFormPriority(0);
    };

    // ── Helpers ─────────────────────────────────────────────────────────────

    const getProductName = (id: string | null) =>
        products.find((p) => p.id === id)?.name ?? "—";

    const getCategoryName = (id: string | null) =>
        categories.find((c) => c.id === id)?.name ?? "—";

    const getProductPrice = (id: string) =>
        products.find((p) => p.id === id)?.price ?? 0;

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/marketing"
                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                            <Sparkles size={24} className="text-amber-500" />
                            Upsells & Extras
                        </h1>
                        <p className="text-surface-500 dark:text-surface-400 mt-0.5 text-sm">
                            Suggérez des produits avant le paiement pour augmenter le panier moyen de 15-25%
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-colors"
                >
                    <Plus size={16} />
                    Nouvelle règle
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        &times;
                    </button>
                </div>
            )}

            {/* Create form */}
            {showForm && (
                <div className="mb-6 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <h2 className="font-bold text-surface-900 dark:text-white mb-4">Nouvelle règle d&apos;upsell</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Trigger type */}
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                Déclencheur
                            </label>
                            <select
                                value={formTriggerType}
                                onChange={(e) => setFormTriggerType(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                            >
                                {Object.entries(TRIGGER_LABELS).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label} — {val.desc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Conditional: product trigger */}
                        {formTriggerType === "product" && (
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                    Quand ce produit est dans le panier
                                </label>
                                <select
                                    value={formTriggerProductId}
                                    onChange={(e) => setFormTriggerProductId(e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                >
                                    <option value="">— Choisir un produit —</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({formatCFA(p.price)})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Conditional: category trigger */}
                        {formTriggerType === "category" && (
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                    Quand cette catégorie est dans le panier
                                </label>
                                <select
                                    value={formTriggerCategoryId}
                                    onChange={(e) => setFormTriggerCategoryId(e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                >
                                    <option value="">— Choisir une catégorie —</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Conditional: cart value trigger */}
                        {formTriggerType === "cart_value" && (
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                    Montant minimum du panier (FCFA)
                                </label>
                                <input
                                    type="number"
                                    value={formTriggerMinCart}
                                    onChange={(e) => setFormTriggerMinCart(parseInt(e.target.value) || 0)}
                                    placeholder="Ex: 5000"
                                    className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                />
                            </div>
                        )}

                        {/* Suggested product */}
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                Produit à suggérer *
                            </label>
                            <select
                                value={formSuggestedProductId}
                                onChange={(e) => setFormSuggestedProductId(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                            >
                                <option value="">— Choisir un produit —</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} ({formatCFA(p.price)})</option>
                                ))}
                            </select>
                        </div>

                        {/* Discount */}
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                Réduction (%) — 0 = pas de remise
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={formDiscountPercent}
                                onChange={(e) => setFormDiscountPercent(parseInt(e.target.value) || 0)}
                                className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                            />
                            {formSuggestedProductId && formDiscountPercent > 0 && (
                                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                    Prix réduit : {formatCFA(Math.round(getProductPrice(formSuggestedProductId) * (1 - formDiscountPercent / 100)))}
                                    {" "}au lieu de {formatCFA(getProductPrice(formSuggestedProductId))}
                                </p>
                            )}
                        </div>

                        {/* Custom message */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                Message personnalisé (optionnel)
                            </label>
                            <input
                                value={formCustomMessage}
                                onChange={(e) => setFormCustomMessage(e.target.value)}
                                placeholder="Ex: Pour seulement 500 FCFA de plus, ajoutez des frites !"
                                className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                            />
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                Priorité (plus élevé = affiché en premier)
                            </label>
                            <input
                                type="number"
                                value={formPriority}
                                onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
                                className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Créer la règle
                        </button>
                        <button
                            onClick={() => { setShowForm(false); resetForm(); }}
                            className="px-5 py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium text-sm rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Rules list */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-brand-500" />
                </div>
            ) : rules.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
                    <Sparkles size={48} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                        Aucune règle d&apos;upsell
                    </h3>
                    <p className="text-surface-500 dark:text-surface-400 text-sm max-w-md mx-auto mb-6">
                        Créez votre première règle pour suggérer des extras à vos clients juste avant le paiement.
                        Les upsells augmentent le panier moyen de 15 à 25%.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl transition-colors"
                    >
                        <Plus size={16} />
                        Créer ma première règle
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {rules.map((rule) => {
                        const trigger = TRIGGER_LABELS[rule.trigger_type];
                        const suggestedName = getProductName(rule.suggested_product_id);
                        const suggestedPrice = getProductPrice(rule.suggested_product_id);
                        const hasDiscount = rule.discount_percent > 0;
                        const discountedPrice = hasDiscount
                            ? Math.round(suggestedPrice * (1 - rule.discount_percent / 100))
                            : suggestedPrice;

                        return (
                            <div
                                key={rule.id}
                                className={`bg-white dark:bg-surface-900 rounded-2xl border p-5 transition-all ${
                                    rule.is_active
                                        ? "border-surface-200 dark:border-surface-800"
                                        : "border-surface-200 dark:border-surface-800 opacity-50"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Trigger badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-xs font-semibold rounded-lg">
                                                {trigger?.icon}
                                                {trigger?.label}
                                            </span>
                                            {rule.trigger_type === "product" && (
                                                <span className="text-xs text-surface-400">
                                                    quand &quot;{getProductName(rule.trigger_product_id)}&quot; est commandé
                                                </span>
                                            )}
                                            {rule.trigger_type === "category" && (
                                                <span className="text-xs text-surface-400">
                                                    quand catégorie &quot;{getCategoryName(rule.trigger_category_id)}&quot;
                                                </span>
                                            )}
                                            {rule.trigger_type === "cart_value" && (
                                                <span className="text-xs text-surface-400">
                                                    panier &ge; {formatCFA(rule.trigger_min_cart)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Suggested product */}
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-surface-900 dark:text-white">
                                                Suggérer : {suggestedName}
                                            </p>
                                            {hasDiscount && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                                                    <Flame size={10} />
                                                    -{rule.discount_percent}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Pricing */}
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                            {hasDiscount ? (
                                                <>
                                                    <span className="line-through">{formatCFA(suggestedPrice)}</span>
                                                    {" → "}
                                                    <span className="font-bold text-green-600 dark:text-green-400">{formatCFA(discountedPrice)}</span>
                                                </>
                                            ) : (
                                                <span>{formatCFA(suggestedPrice)}</span>
                                            )}
                                        </p>

                                        {/* Custom message */}
                                        {rule.custom_message && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                                                &quot;{rule.custom_message}&quot;
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggle(rule)}
                                            className={`p-2 rounded-xl transition-colors ${
                                                rule.is_active
                                                    ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"
                                                    : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                                            }`}
                                            title={rule.is_active ? "Désactiver" : "Activer"}
                                        >
                                            {rule.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-2 rounded-xl text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tip card */}
            {rules.length > 0 && (
                <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                    <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                        <Flame size={16} />
                        Astuce : Maximisez vos upsells
                    </h3>
                    <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1.5">
                        <li>• Suggérez des produits à <strong>faible coût</strong> (boissons, sauces, desserts) — le client hésite moins</li>
                        <li>• Une réduction de <strong>10-20%</strong> sur l&apos;extra crée un sentiment d&apos;opportunité</li>
                        <li>• Le message personnalisé fait la différence : &quot;Pour seulement 500 FCFA de plus...&quot;</li>
                        <li>• Les règles liées à un produit convertissent <strong>2x mieux</strong> que les règles globales</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
