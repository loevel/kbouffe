"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    SlidersHorizontal,
    MapPin,
    Leaf,
    Star,
    Phone,
    ChevronRight,
    Package,
    RefreshCw,
    X,
    Sprout,
    Award,
    ShoppingBasket,
    Users,
} from "lucide-react";
import Link from "next/link";
import { CAMEROON_REGIONS } from "@kbouffe/module-marketplace/lib";
import { useLocale, type TranslationKeys } from "@kbouffe/module-core/ui";

// ── Types ────────────────────────────────────────────────────────────────────

interface SupplierProduct {
    id: string;
    name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    is_active: boolean;
    is_organic: boolean;
    photos: string[];
}

interface Supplier {
    id: string;
    name: string;
    type: "individual_farmer" | "cooperative" | "wholesaler";
    contact_name: string;
    phone: string;
    region: string;
    locality: string;
    description: string | null;
    logo_url: string | null;
    minader_cert_url: string | null;
    is_featured: boolean;
    listing_tier: "free" | "basic" | "premium";
    created_at: string;
    supplier_products?: SupplierProduct[];
}

interface SuppliersResponse {
    success: boolean;
    suppliers: Supplier[];
    pagination: { page: number; limit: number; total: number };
}

// ── Constants ─────────────────────────────────────────────────────────────────

function getProductCategories(t: TranslationKeys) {
    return [
        { value: "", label: t.sourcing.catAll },
        { value: "legumes", label: `🥦 ${t.sourcing.catVegetables}` },
        { value: "fruits", label: `🍊 ${t.sourcing.catFruits}` },
        { value: "cereales", label: `🌾 ${t.sourcing.catCereals}` },
        { value: "viande", label: `🥩 ${t.sourcing.catMeat}` },
        { value: "poisson", label: `🐟 ${t.sourcing.catFish}` },
        { value: "produits_laitiers", label: `🥛 ${t.sourcing.catDairy}` },
        { value: "epices", label: `🌶 ${t.sourcing.catSpices}` },
        { value: "huiles", label: `🫙 ${t.sourcing.catOils}` },
        { value: "condiments", label: `🧄 ${t.sourcing.catCondiments}` },
        { value: "autres", label: `📦 ${t.sourcing.catOther}` },
    ];
}

function getSupplierTypes(t: TranslationKeys) {
    return [
        { value: "", label: t.sourcing.typeAllTypes },
        { value: "individual_farmer", label: `👨‍🌾 ${t.sourcing.typeFarmer}` },
        { value: "cooperative", label: `🤝 ${t.sourcing.typeCooperative}` },
        { value: "wholesaler", label: `🏭 ${t.sourcing.typeWholesaler}` },
    ];
}

const TIER_ORDER = { premium: 3, basic: 2, free: 1 };

function getCategoryLabels(t: TranslationKeys): Record<string, string> {
    return {
        legumes: t.sourcing.catVegetables, fruits: t.sourcing.catFruits, cereales: t.sourcing.catCereals,
        viande: t.sourcing.catMeat, poisson: t.sourcing.catFish, produits_laitiers: t.sourcing.catDairy,
        epices: t.sourcing.catSpices, huiles: t.sourcing.catOils, condiments: t.sourcing.catCondiments, autres: t.sourcing.catOther,
    };
}

function getTypeLabels(t: TranslationKeys): Record<string, string> {
    return {
        individual_farmer: t.sourcing.typeFarmer,
        cooperative: t.sourcing.typeCooperative,
        wholesaler: t.sourcing.typeWholesaler,
    };
}

const TYPE_COLORS: Record<string, string> = {
    individual_farmer: "bg-green-500/10 text-green-400 border-green-500/20",
    cooperative: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    wholesaler: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function getTierBadge(t: TranslationKeys): Record<string, { label: string; color: string }> {
    return {
        premium: { label: t.sourcing.premium, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
        basic: { label: t.sourcing.basic, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
        free: { label: "", color: "" },
    };
}

// ── Motion variants ───────────────────────────────────────────────────────────

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── SupplierCard ─────────────────────────────────────────────────────────────

function SupplierCard({ supplier, t }: { supplier: Supplier; t: TranslationKeys }) {
    const activeProducts = (supplier.supplier_products ?? []).filter(p => p.is_active);
    const hasOrganic = activeProducts.some(p => p.is_organic);
    const hasMinader = !!supplier.minader_cert_url;
    const tier = getTierBadge(t)[supplier.listing_tier];
    const typeLabels = getTypeLabels(t);
    const preview = activeProducts.slice(0, 3);

    return (
        <motion.div variants={cardVariants}>
            <Link href={`/dashboard/approvisionnement/${supplier.id}`}>
                <div className="group bg-surface-900 border border-surface-700 rounded-2xl overflow-hidden hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200 cursor-pointer">
                    {/* Header band */}
                    <div className="relative h-24 bg-gradient-to-br from-surface-800 to-surface-750 flex items-center justify-between px-4">
                        {/* Tier badge top-right */}
                        {tier.label && (
                            <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border ${tier.color}`}>
                                {tier.label}
                            </span>
                        )}

                        {/* Featured star */}
                        {supplier.is_featured && (
                            <span className="absolute top-3 left-3 flex items-center gap-1 text-xs font-semibold text-yellow-400">
                                <Star size={12} className="fill-yellow-400" /> {t.sourcing.featured}
                            </span>
                        )}

                        {/* Logo / avatar */}
                        <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl border-2 border-surface-700 bg-surface-800 flex items-center justify-center overflow-hidden shadow-md">
                            {supplier.logo_url ? (
                                <img src={supplier.logo_url} alt={supplier.name} className="w-full h-full object-cover" />
                            ) : (
                                <Sprout size={22} className="text-brand-400" />
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="pt-8 px-4 pb-4 space-y-3">
                        {/* Name + type */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-brand-400 transition-colors">
                                    {supplier.name}
                                </h3>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border mt-1 ${TYPE_COLORS[supplier.type]}`}>
                                    {typeLabels[supplier.type]}
                                </span>
                            </div>
                            <ChevronRight size={16} className="text-surface-500 group-hover:text-brand-400 transition-colors mt-1 shrink-0" />
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-surface-400">
                            <MapPin size={12} className="shrink-0" />
                            <span>{supplier.locality}, {supplier.region}</span>
                        </div>

                        {/* Certifications */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {hasOrganic && (
                                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                    <Leaf size={10} /> {t.sourcing.bio}
                                </span>
                            )}
                            {hasMinader && (
                                <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                    <Award size={10} /> MINADER
                                </span>
                            )}
                        </div>

                        {/* Product preview */}
                        {preview.length > 0 ? (
                            <div className="space-y-1.5">
                                <p className="text-xs text-surface-500 font-medium">
                                    {activeProducts.length} {activeProducts.length > 1 ? t.sourcing.productsAvailable : t.sourcing.productAvailable}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {preview.map(p => (
                                        <span key={p.id} className="text-xs bg-surface-800 text-surface-300 px-2 py-0.5 rounded-lg border border-surface-700">
                                            {p.name}
                                        </span>
                                    ))}
                                    {activeProducts.length > 3 && (
                                        <span className="text-xs text-surface-500 px-1 py-0.5">
                                            +{activeProducts.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-surface-500 italic">{t.sourcing.noProductYet}</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-surface-700/50">
                            <div className="flex items-center gap-1.5 text-xs text-surface-400">
                                <Phone size={11} />
                                <span>{supplier.phone}</span>
                            </div>
                            <span className="text-xs font-medium text-brand-400 group-hover:underline">
                                {t.sourcing.viewCatalog}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ApprovisionnementPage() {
    const { t } = useLocale();

    // Filters state
    const [q, setQ] = useState("");
    const [product, setProduct] = useState("");
    const [region, setRegion] = useState("");
    const [locality, setLocality] = useState("");
    const [type, setType] = useState("");
    const [category, setCategory] = useState("");
    const [organic, setOrganic] = useState(false);
    const [featured, setFeatured] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);

    // Data state
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const activeFiltersCount = [
        region, locality, type, category,
        organic ? "1" : "",
        featured ? "1" : "",
    ].filter(Boolean).length;

    // `overrides` permet aux appelants (ex: bouton "effacer") de fournir la
    // valeur qu'ils viennent tout juste de définir via setState, plutôt que de
    // compter sur `q`/`product`/`locality` capturés dans cette fermeture — qui
    // reflètent encore l'ancien état au moment de l'appel.
    const fetchSuppliers = useCallback(async (
        pageToFetch: number,
        overrides?: { q?: string; product?: string; locality?: string }
    ) => {
        setLoading(true);

        try {
            const params = new URLSearchParams();
            const qVal = (overrides?.q ?? q).trim();
            const productVal = (overrides?.product ?? product).trim();
            const localityVal = (overrides?.locality ?? locality).trim();
            if (qVal) params.set("q", qVal);
            if (productVal) params.set("product", productVal);
            if (region) params.set("region", region);
            if (localityVal) params.set("locality", localityVal);
            if (type) params.set("type", type);
            if (category) params.set("category", category);
            if (organic) params.set("organic", "1");
            if (featured) params.set("featured", "1");
            params.set("page", String(pageToFetch));

            const res = await fetch(`/api/marketplace/suppliers?${params.toString()}`);
            if (!res.ok) throw new Error("Erreur serveur");
            const data: SuppliersResponse = await res.json();
            setSuppliers(data.suppliers ?? []);
            setTotal(data.pagination?.total ?? 0);
        } catch {
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    }, [q, product, region, locality, type, category, organic, featured]);

    // Un seul point de vérité pour le fetch : on réagit aux changements d'état
    // au lieu d'appeler fetchSuppliers() juste après un setState (qui capturait
    // encore l'ancienne valeur à cause de la fermeture React — les filtres
    // "Bio uniquement", région, type, catégorie et "en vedette" n'avaient donc
    // jamais d'effet sur le premier clic).
    useEffect(() => {
        fetchSuppliers(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    useEffect(() => {
        setPage(1);
        fetchSuppliers(1);
        // Note: `locality` est volontairement exclu — recherche sur Entrée
        // seulement (voir son onKeyDown), pas à chaque frappe.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [region, type, category, organic, featured]);

    // Search on Enter / blur (nom du fournisseur / produit — pas de fetch auto)
    const handleSearch = () => { setPage(1); fetchSuppliers(1); };

    const clearFilters = () => {
        setRegion(""); setLocality(""); setType(""); setCategory("");
        setOrganic(false); setFeatured(false);
    };

    const LIMIT = 20;
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Sprout size={18} className="text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">{t.sourcing.title}</h1>
                    </div>
                    <p className="text-surface-400 text-sm">
                        {t.sourcing.subtitle}
                    </p>
                </div>
                <button
                    onClick={() => fetchSuppliers(page)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition-colors"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    {t.sourcing.refresh}
                </button>
            </div>

            {/* ── Search bar ── */}
            <div className="flex gap-3">
                {/* Supplier name search */}
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                    <input
                        type="text"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        placeholder={t.sourcing.searchSupplierPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition"
                    />
                    {q && (
                        <button onClick={() => { setQ(""); setPage(1); fetchSuppliers(1, { q: "" }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Product name search */}
                <div className="flex-1 relative">
                    <ShoppingBasket size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                    <input
                        type="text"
                        value={product}
                        onChange={e => setProduct(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        placeholder={t.sourcing.searchProductPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition"
                    />
                    {product && (
                        <button onClick={() => { setProduct(""); setPage(1); fetchSuppliers(1, { product: "" }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Search button */}
                <button
                    onClick={handleSearch}
                    className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                    {t.sourcing.search}
                </button>

                {/* Filters toggle */}
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                        showFilters || activeFiltersCount > 0
                            ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                            : "bg-surface-800 text-surface-300 border-surface-700 hover:border-surface-600"
                    }`}
                >
                    <SlidersHorizontal size={15} />
                    {t.sourcing.filters}
                    {activeFiltersCount > 0 && (
                        <span className="bg-brand-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Advanced filters panel ── */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-surface-800/50 border border-surface-700 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Region */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                    <MapPin size={11} /> {t.sourcing.region}
                                </label>
                                <select
                                    value={region}
                                    onChange={e => setRegion(e.target.value)}
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-brand-500/50"
                                >
                                    <option value="">{t.sourcing.allRegions}</option>
                                    {CAMEROON_REGIONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Locality */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                    <MapPin size={11} /> {t.sourcing.locality}
                                </label>
                                <input
                                    type="text"
                                    value={locality}
                                    onChange={e => setLocality(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") { setPage(1); fetchSuppliers(1); } }}
                                    placeholder={t.sourcing.localityPlaceholder}
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 placeholder-surface-500 focus:outline-none focus:border-brand-500/50"
                                />
                            </div>

                            {/* Type */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                    <Users size={11} /> {t.sourcing.supplierType}
                                </label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-brand-500/50"
                                >
                                    {getSupplierTypes(t).map(st => (
                                        <option key={st.value} value={st.value}>{st.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                    <Package size={11} /> {t.sourcing.productCategory}
                                </label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-brand-500/50"
                                >
                                    {getProductCategories(t).map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Toggle filters */}
                            <div className="col-span-2 md:col-span-4 flex items-center gap-4 pt-2 border-t border-surface-700/50">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div
                                        onClick={() => setOrganic(v => !v)}
                                        className={`w-9 h-5 rounded-full transition-colors flex items-center ${organic ? "bg-green-500" : "bg-surface-600"}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${organic ? "translate-x-4" : "translate-x-0"}`} />
                                    </div>
                                    <span className="text-sm text-surface-300 flex items-center gap-1">
                                        <Leaf size={13} className="text-green-400" /> {t.sourcing.organicOnly}
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div
                                        onClick={() => setFeatured(v => !v)}
                                        className={`w-9 h-5 rounded-full transition-colors flex items-center ${featured ? "bg-yellow-500" : "bg-surface-600"}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${featured ? "translate-x-4" : "translate-x-0"}`} />
                                    </div>
                                    <span className="text-sm text-surface-300 flex items-center gap-1">
                                        <Star size={13} className="text-yellow-400" /> {t.sourcing.featuredOnly}
                                    </span>
                                </label>

                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="ml-auto flex items-center gap-1 text-xs text-surface-400 hover:text-red-400 transition-colors"
                                    >
                                        <X size={12} /> {t.sourcing.resetFilters}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Results count + active filter tags ── */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-surface-400">
                    {loading ? t.common.loading : (
                        <>
                            <span className="font-semibold text-white">{suppliers.length}</span>
                            {" "}{suppliers.length !== 1 ? t.sourcing.suppliersFound : t.sourcing.supplierFound}
                        </>
                    )}
                </p>
                {/* Active filter tags */}
                <div className="flex items-center gap-2 flex-wrap">
                    {region && (
                        <span className="flex items-center gap-1 text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-full">
                            <MapPin size={10} /> {region}
                            <button onClick={() => setRegion("")}><X size={10} /></button>
                        </span>
                    )}
                    {type && (
                        <span className="flex items-center gap-1 text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-full">
                            {getTypeLabels(t)[type]}
                            <button onClick={() => setType("")}><X size={10} /></button>
                        </span>
                    )}
                    {category && (
                        <span className="flex items-center gap-1 text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-full">
                            {getCategoryLabels(t)[category] ?? category}
                            <button onClick={() => setCategory("")}><X size={10} /></button>
                        </span>
                    )}
                    {organic && (
                        <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
                            <Leaf size={10} /> {t.sourcing.bio}
                            <button onClick={() => setOrganic(false)}><X size={10} /></button>
                        </span>
                    )}
                </div>
            </div>

            {/* ── Grid ── */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden animate-pulse">
                            <div className="h-24 bg-surface-800" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-surface-800 rounded w-3/4" />
                                <div className="h-3 bg-surface-800 rounded w-1/2" />
                                <div className="h-3 bg-surface-800 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : suppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
                        <Sprout size={28} className="text-surface-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t.sourcing.noSupplierFound}</h3>
                    <p className="text-surface-400 text-sm max-w-sm">
                        {t.sourcing.noSupplierFoundDesc}
                    </p>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-sm text-brand-400 hover:underline"
                        >
                            {t.sourcing.resetAllFilters}
                        </button>
                    )}
                </div>
            ) : (
                <motion.div
                    key={`${q}-${product}-${region}-${type}-${category}-${page}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {suppliers.map(supplier => (
                        <SupplierCard key={supplier.id} supplier={supplier} t={t} />
                    ))}
                </motion.div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-4 py-2 text-sm text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {t.sourcing.previous}
                    </button>
                    <span className="text-sm text-surface-400 px-3">
                        {t.sourcing.page} {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-4 py-2 text-sm text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {t.sourcing.next}
                    </button>
                </div>
            )}
        </div>
    );
}
