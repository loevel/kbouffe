"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Leaf,
    Award,
    Star,
    Package,
    Sprout,
    Copy,
    Check,
    ShoppingCart,
    Calendar,
    Scale,
    Info,
    ChevronDown,
    ChevronUp,
    Loader2,
    AlertCircle,
    ClipboardList,
    MessageCircle,
    Receipt,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { TraceModal, type TraceSupplier, type TraceProduct } from "@/components/dashboard/approvisionnement/TraceModal";
import { RFQModal, type RFQSupplier, type RFQProduct } from "@/components/dashboard/approvisionnement/RFQModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SupplierProduct {
    id: string;
    supplier_id: string;
    name: string;
    category: string;
    description: string | null;
    photos: string[];
    price_per_unit: number;
    unit: string;
    min_order_quantity: number;
    available_quantity: number | null;
    origin_region: string | null;
    harvest_date: string | null;
    allergens: string[];
    is_organic: boolean;
    is_certified_minader: boolean;
    phytosanitary_note: string | null;
    is_active: boolean;
    created_at: string;
}

interface Supplier {
    id: string;
    name: string;
    type: "individual_farmer" | "cooperative" | "wholesaler";
    contact_name: string;
    phone: string;
    email: string | null;
    region: string;
    locality: string;
    address: string | null;
    description: string | null;
    logo_url: string | null;
    minader_cert_url: string | null;
    rccm: string | null;
    nif: string | null;
    cooperative_number: string | null;
    is_featured: boolean;
    listing_tier: "free" | "basic" | "premium";
    created_at: string;
    supplier_products?: SupplierProduct[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    individual_farmer: "Agriculteur individuel",
    cooperative: "Coopérative agricole",
    wholesaler: "Grossiste",
};
const TYPE_COLORS: Record<string, string> = {
    individual_farmer: "bg-green-500/10 text-green-400 border-green-500/20",
    cooperative: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    wholesaler: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};
const CATEGORY_LABELS: Record<string, string> = {
    legumes: "Légumes", fruits: "Fruits", cereales: "Céréales",
    viande: "Viande", poisson: "Poisson", produits_laitiers: "Produits laitiers",
    epices: "Épices", huiles: "Huiles", condiments: "Condiments", autres: "Autres",
};
const UNIT_LABELS: Record<string, string> = {
    kg: "kg", tonne: "tonne", litre: "L",
    caisse: "caisse", colis: "colis", sac: "sac", botte: "botte", piece: "pièce",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toTraceSupplier(s: Supplier): TraceSupplier {
    return {
        id: s.id, name: s.name, type: s.type, phone: s.phone,
        region: s.region, locality: s.locality, logo_url: s.logo_url,
        supplier_products: (s.supplier_products ?? []).filter(p => p.is_active).map(p => ({
            id: p.id, name: p.name, category: p.category,
            price_per_unit: p.price_per_unit, unit: p.unit, is_active: p.is_active,
        })),
    };
}

function toTraceProduct(p: SupplierProduct): TraceProduct {
    return { id: p.id, name: p.name, category: p.category, price_per_unit: p.price_per_unit, unit: p.unit, is_active: p.is_active };
}

function toRFQSupplier(s: Supplier): RFQSupplier {
    return { id: s.id, name: s.name, contact_name: s.contact_name, phone: s.phone, email: s.email, locality: s.locality, region: s.region, logo_url: s.logo_url };
}

function toRFQProduct(p: SupplierProduct): RFQProduct {
    return { id: p.id, name: p.name, category: p.category, price_per_unit: p.price_per_unit, unit: p.unit, min_order_quantity: p.min_order_quantity };
}

// ── ProductCard ────────────────────────────────────────────────────────────────

interface ProductCardProps {
    product: SupplierProduct;
    onOrder: (product: SupplierProduct) => void;
    onRFQ: (product: SupplierProduct) => void;
}

function ProductCard({ product, onOrder, onRFQ }: ProductCardProps) {
    const [expanded, setExpanded] = useState(false);
    const mainPhoto = product.photos?.[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden hover:border-surface-600 transition-colors flex flex-col"
        >
            {/* Photo */}
            <div className="relative h-40 bg-surface-750 overflow-hidden shrink-0">
                {mainPhoto ? (
                    <img src={mainPhoto} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={32} className="text-surface-600" />
                    </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_organic && (
                        <span className="flex items-center gap-1 text-xs font-medium bg-green-900/80 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30 backdrop-blur-sm">
                            <Leaf size={9} /> Bio
                        </span>
                    )}
                    {product.is_certified_minader && (
                        <span className="flex items-center gap-1 text-xs font-medium bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 backdrop-blur-sm">
                            <Award size={9} /> MINADER
                        </span>
                    )}
                </div>
                {product.photos.length > 1 && (
                    <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        +{product.photos.length - 1} photos
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-2 flex-1 flex flex-col">
                <div className="flex-1 space-y-2">
                    <div>
                        <h3 className="font-semibold text-white text-sm leading-tight">{product.name}</h3>
                        <span className="text-xs text-surface-400 mt-0.5 inline-block">
                            {CATEGORY_LABELS[product.category] ?? product.category}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-brand-400">
                            {product.price_per_unit.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-xs text-surface-400">FCFA / {UNIT_LABELS[product.unit] ?? product.unit}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-surface-400">
                        <span className="flex items-center gap-1">
                            <Scale size={10} /> Min. {product.min_order_quantity} {UNIT_LABELS[product.unit] ?? product.unit}
                        </span>
                        {product.available_quantity !== null && (
                            <span className="flex items-center gap-1">
                                <Package size={10} /> {product.available_quantity} dispo
                            </span>
                        )}
                    </div>

                    {(product.origin_region || product.harvest_date) && (
                        <div className="flex items-center gap-3 text-xs text-surface-400">
                            {product.origin_region && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={10} /> {product.origin_region}
                                </span>
                            )}
                            {product.harvest_date && (
                                <span className="flex items-center gap-1">
                                    <Calendar size={10} /> {new Date(product.harvest_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                                </span>
                            )}
                        </div>
                    )}

                    {(product.description || product.phytosanitary_note || product.allergens?.length > 0) && (
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
                        >
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {expanded ? "Moins" : "Détails"}
                        </button>
                    )}

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-2 border-t border-surface-700/50 space-y-2">
                                    {product.description && (
                                        <p className="text-xs text-surface-400 leading-relaxed">{product.description}</p>
                                    )}
                                    {product.phytosanitary_note && (
                                        <div className="flex items-start gap-1.5 text-xs text-surface-400 bg-surface-750 rounded-lg p-2">
                                            <Info size={11} className="shrink-0 mt-0.5 text-blue-400" />
                                            <span>{product.phytosanitary_note}</span>
                                        </div>
                                    )}
                                    {product.allergens?.length > 0 && (
                                        <p className="text-xs text-orange-400">⚠️ {product.allergens.join(", ")}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Action buttons ── */}
                <div className="flex gap-2 pt-2 border-t border-surface-700/50">
                    <button
                        onClick={() => onRFQ(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-surface-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors"
                    >
                        <MessageCircle size={12} /> Devis
                    </button>
                    <button
                        onClick={() => onOrder(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
                    >
                        <ShoppingCart size={12} /> Commander
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ── ContactModal ───────────────────────────────────────────────────────────────

function ContactModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
    const [copied, setCopied] = useState<"phone" | "email" | null>(null);

    const copy = async (text: string, type: "phone" | "email") => {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Sprout size={20} className="text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{supplier.name}</h3>
                        <p className="text-sm text-surface-400">{TYPE_LABELS[supplier.type]}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="p-3 bg-surface-800 rounded-xl border border-surface-700">
                        <p className="text-xs text-surface-400 mb-0.5">Contact</p>
                        <p className="text-sm font-medium text-white">{supplier.contact_name}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-800 rounded-xl border border-surface-700">
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-green-400" />
                            <span className="text-sm text-white">{supplier.phone}</span>
                        </div>
                        <button onClick={() => copy(supplier.phone, "phone")} className="p-1.5 hover:bg-surface-700 rounded-lg transition-colors">
                            {copied === "phone" ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-surface-400" />}
                        </button>
                    </div>
                    {supplier.email && (
                        <div className="flex items-center justify-between p-3 bg-surface-800 rounded-xl border border-surface-700">
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-blue-400" />
                                <span className="text-sm text-white">{supplier.email}</span>
                            </div>
                            <button onClick={() => copy(supplier.email!, "email")} className="p-1.5 hover:bg-surface-700 rounded-lg transition-colors">
                                {copied === "email" ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-surface-400" />}
                            </button>
                        </div>
                    )}
                    {supplier.address && (
                        <div className="flex items-start gap-2 p-3 bg-surface-800 rounded-xl border border-surface-700">
                            <MapPin size={16} className="text-orange-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-white">{supplier.address}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <a href={`tel:${supplier.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors">
                        <Phone size={15} /> Appeler
                    </a>
                    <button onClick={onClose} className="flex-1 py-2.5 bg-surface-700 hover:bg-surface-600 text-white text-sm font-medium rounded-xl transition-colors">
                        Fermer
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supplierId = params.id as string;

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState("");

    // ── Modal state ──
    const [showContact,  setShowContact]  = useState(false);
    /** null = supplier pré-rempli seulement, SupplierProduct = produit aussi pré-rempli */
    const [traceProduct, setTraceProduct] = useState<SupplierProduct | null | "none">("none");
    const [rfqProduct,   setRFQProduct]   = useState<SupplierProduct | null>(null);
    const [showRFQ,      setShowRFQ]      = useState(false);

    const showTrace = traceProduct !== "none";

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/marketplace/suppliers/${supplierId}`);
                if (!res.ok) throw new Error("Introuvable");
                const data: { success: boolean; supplier: Supplier } = await res.json();
                setSupplier(data.supplier);
            } catch {
                setError("Fournisseur introuvable ou non disponible.");
            } finally {
                setLoading(false);
            }
        })();
    }, [supplierId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={28} className="animate-spin text-brand-400" />
            </div>
        );
    }

    if (error || !supplier) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-surface-300">{error ?? "Fournisseur introuvable."}</p>
                <button onClick={() => router.back()} className="text-sm text-brand-400 hover:underline">← Retour</button>
            </div>
        );
    }

    const activeProducts   = (supplier.supplier_products ?? []).filter(p => p.is_active);
    const categories       = [...new Set(activeProducts.map(p => p.category))];
    const filteredProducts = filterCategory ? activeProducts.filter(p => p.category === filterCategory) : activeProducts;
    const hasOrganic       = activeProducts.some(p => p.is_organic);
    const hasCertMinader   = !!supplier.minader_cert_url;

    const traceSupplier = toTraceSupplier(supplier);
    const rfqSupplier   = toRFQSupplier(supplier);

    return (
        <>
            {/* ── Modals ── */}
            <AnimatePresence>
                {showContact && (
                    <ContactModal supplier={supplier} onClose={() => setShowContact(false)} />
                )}
                {showTrace && (
                    <TraceModal
                        key="trace"
                        initialSupplier={traceSupplier}
                        initialProduct={traceProduct !== null && traceProduct !== "none" ? toTraceProduct(traceProduct) : undefined}
                        onClose={() => setTraceProduct("none")}
                        onCreated={() => {
                            setTraceProduct("none");
                        }}
                    />
                )}
                {showRFQ && rfqProduct !== null && (
                    <RFQModal
                        key="rfq-product"
                        supplier={rfqSupplier}
                        product={toRFQProduct(rfqProduct)}
                        onClose={() => { setShowRFQ(false); setRFQProduct(null); }}
                    />
                )}
                {showRFQ && rfqProduct === null && (
                    <RFQModal
                        key="rfq-supplier"
                        supplier={rfqSupplier}
                        onClose={() => { setShowRFQ(false); }}
                    />
                )}
            </AnimatePresence>

            <div className="space-y-6 max-w-5xl">
                {/* ── Back ── */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> Retour à l'annuaire
                </button>

                {/* ── Hero card ── */}
                <div className="bg-surface-900 border border-surface-700 rounded-2xl overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-green-900/40 via-surface-800 to-surface-900 relative">
                        {supplier.is_featured && (
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-sm font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
                                <Star size={14} className="fill-yellow-400" /> En vedette
                            </div>
                        )}
                        {supplier.listing_tier !== "free" && (
                            <div className={`absolute top-4 left-4 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                supplier.listing_tier === "premium"
                                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                    : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}>
                                {supplier.listing_tier === "premium" ? "Premium" : "Basic"}
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-10 mb-5 flex-wrap">
                            <div className="w-20 h-20 rounded-2xl bg-surface-800 border-4 border-surface-900 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                                {supplier.logo_url ? (
                                    <img src={supplier.logo_url} alt={supplier.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Sprout size={32} className="text-green-400" />
                                )}
                            </div>
                            <div className="pb-1 flex-1 min-w-0">
                                <h1 className="text-xl font-bold text-white truncate">{supplier.name}</h1>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border mt-1 ${TYPE_COLORS[supplier.type]}`}>
                                    {TYPE_LABELS[supplier.type]}
                                </span>
                            </div>

                            {/* ── Hero action buttons ── */}
                            <div className="flex items-center gap-2 pb-1 flex-wrap">
                                <button
                                    onClick={() => { setShowRFQ(true); setRFQProduct(null); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-300 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition-colors"
                                >
                                    <MessageCircle size={14} /> Demander un devis
                                </button>
                                <button
                                    onClick={() => setTraceProduct(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-300 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition-colors"
                                >
                                    <Receipt size={14} /> Enregistrer un achat
                                </button>
                                <button
                                    onClick={() => setShowContact(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-xl transition-colors shadow-md"
                                >
                                    <Phone size={14} /> Contacter
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-2 text-sm text-surface-300">
                                    <MapPin size={15} className="text-orange-400 shrink-0 mt-0.5" />
                                    <span>{supplier.locality}, {supplier.region}{supplier.address ? ` — ${supplier.address}` : ""}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-surface-300">
                                    <Phone size={15} className="text-green-400 shrink-0" />
                                    <span>{supplier.phone}</span>
                                </div>
                                {supplier.email && (
                                    <div className="flex items-center gap-2 text-sm text-surface-300">
                                        <Mail size={15} className="text-blue-400 shrink-0" />
                                        <span>{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.description && (
                                    <p className="text-sm text-surface-400 leading-relaxed mt-2 pt-2 border-t border-surface-700/50">
                                        {supplier.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2">Certifications</p>
                                    <div className="flex flex-wrap gap-2">
                                        {hasOrganic && (
                                            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                                                <Leaf size={11} /> Agriculture biologique
                                            </span>
                                        )}
                                        {hasCertMinader && (
                                            <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                                                <Award size={11} /> Certifié MINADER
                                            </span>
                                        )}
                                        {supplier.rccm && (
                                            <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">RCCM</span>
                                        )}
                                        {supplier.nif && (
                                            <span className="text-xs text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">NIF</span>
                                        )}
                                        {supplier.cooperative_number && (
                                            <span className="text-xs text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">N° Coopérative</span>
                                        )}
                                        {!hasOrganic && !hasCertMinader && !supplier.rccm && !supplier.nif && (
                                            <span className="text-xs text-surface-500 italic">Aucune certification renseignée</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    <div className="bg-surface-800 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold text-white">{activeProducts.length}</p>
                                        <p className="text-xs text-surface-400">Produits</p>
                                    </div>
                                    <div className="bg-surface-800 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold text-white">{categories.length}</p>
                                        <p className="text-xs text-surface-400">Catégories</p>
                                    </div>
                                    <div className="bg-surface-800 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold text-white">{activeProducts.filter(p => p.is_organic).length}</p>
                                        <p className="text-xs text-surface-400">Bio</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Products catalogue ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Package size={18} className="text-brand-400" />
                            Catalogue produits
                            {activeProducts.length > 0 && (
                                <span className="text-sm font-normal text-surface-400">({activeProducts.length})</span>
                            )}
                        </h2>

                        {categories.length > 1 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setFilterCategory("")}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                        !filterCategory ? "bg-brand-500/10 text-brand-400 border-brand-500/30" : "text-surface-400 border-surface-700 hover:border-surface-600"
                                    }`}
                                >
                                    Tous
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat === filterCategory ? "" : cat)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                            filterCategory === cat ? "bg-brand-500/10 text-brand-400 border-brand-500/30" : "text-surface-400 border-surface-700 hover:border-surface-600"
                                        }`}
                                    >
                                        {CATEGORY_LABELS[cat] ?? cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {activeProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-surface-900 border border-surface-700 rounded-2xl text-center">
                            <Package size={28} className="text-surface-600 mb-3" />
                            <p className="text-surface-400 text-sm">Ce fournisseur n'a pas encore de produits disponibles.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onOrder={p => setTraceProduct(p)}
                                    onRFQ={p => { setRFQProduct(p); setShowRFQ(true); }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Traçabilité CTA ── */}
                <div className="bg-gradient-to-br from-green-900/20 to-surface-900 border border-green-500/20 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <ClipboardList size={20} className="text-green-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">Registre de traçabilité</h3>
                        <p className="text-sm text-surface-400 mb-3">
                            Consultez l'historique complet de vos achats auprès de tous vos fournisseurs.
                        </p>
                        <button
                            onClick={() => setTraceProduct(null)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-medium rounded-xl border border-green-500/20 transition-colors"
                        >
                            <Receipt size={14} /> Enregistrer un achat ici
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
