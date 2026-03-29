"use client";

/**
 * TraceModal — modal partagé d'enregistrement d'achat fournisseur
 *
 * Utilisé depuis :
 *  - /dashboard/marketplace/trace          → sans pré-remplissage (3 étapes)
 *  - /dashboard/approvisionnement/[id]     → fournisseur pré-rempli (saute l'étape 1)
 *  - ProductCard dans la fiche fournisseur → fournisseur + produit pré-remplis (saute les étapes 1+2)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Search, ArrowLeft, ChevronRight, Sprout, Package,
    Loader2, Receipt, AlertTriangle, Calendar, Hash,
    FileText, MapPin,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TraceSupplier {
    id: string;
    name: string;
    type: string;
    phone: string;
    region: string;
    locality: string;
    logo_url: string | null;
    supplier_products?: TraceProduct[];
}

export interface TraceProduct {
    id: string;
    name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    is_active: boolean;
}

interface Props {
    onClose: () => void;
    onCreated: () => void;
    /** Pré-rempli — saute l'étape 1 */
    initialSupplier?: TraceSupplier;
    /** Pré-rempli — saute les étapes 1 et 2 */
    initialProduct?: TraceProduct;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_FEE_RATE = 0.03;
const TVA_RATE = 0.1925;

const UNIT_LABELS: Record<string, string> = {
    kg: "kg", tonne: "tonne", litre: "L",
    caisse: "caisse", colis: "colis", sac: "sac", botte: "botte", piece: "pièce",
};

const CATEGORY_LABELS: Record<string, string> = {
    legumes: "Légumes", fruits: "Fruits", cereales: "Céréales",
    viande: "Viande", poisson: "Poisson", produits_laitiers: "Laitiers",
    epices: "Épices", huiles: "Huiles", condiments: "Condiments", autres: "Autres",
};

const TYPE_LABELS: Record<string, string> = {
    individual_farmer: "Agriculteur",
    cooperative: "Coopérative",
    wholesaler: "Grossiste",
};

function fmt(n: number) {
    return n.toLocaleString("fr-FR");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TraceModal({ onClose, onCreated, initialSupplier, initialProduct }: Props) {
    // Determine starting step based on what's pre-filled
    const startStep = initialProduct ? 3 : initialSupplier ? 2 : 1;
    const [step, setStep] = useState<1 | 2 | 3>(startStep as 1 | 2 | 3);

    // Step 1
    const [suppliers, setSuppliers] = useState<TraceSupplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(!initialSupplier);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState<TraceSupplier | null>(initialSupplier ?? null);

    // Step 2
    const [selectedProduct, setSelectedProduct] = useState<TraceProduct | null>(initialProduct ?? null);

    // Step 3
    const [form, setForm] = useState({
        quantity: "",
        unit_price: initialProduct ? String(initialProduct.price_per_unit) : "",
        lot_number: "",
        harvest_date: "",
        expected_delivery_date: "",
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load suppliers if no initial supplier
    useEffect(() => {
        if (initialSupplier) return;
        (async () => {
            setLoadingSuppliers(true);
            try {
                const res = await fetch("/api/marketplace/suppliers?page=1");
                const data = await res.json();
                setSuppliers(data.suppliers ?? []);
            } catch {
                setSuppliers([]);
            } finally {
                setLoadingSuppliers(false);
            }
        })();
    }, [initialSupplier]);

    // If initialSupplier but no products loaded yet, fetch them
    useEffect(() => {
        if (!initialSupplier || initialProduct) return;
        if (initialSupplier.supplier_products?.length) return;
        (async () => {
            try {
                const res = await fetch(`/api/marketplace/suppliers/${initialSupplier.id}`);
                const data = await res.json();
                if (data.supplier) {
                    setSelectedSupplier(data.supplier);
                }
            } catch { /* ignore */ }
        })();
    }, [initialSupplier, initialProduct]);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.locality.toLowerCase().includes(supplierSearch.toLowerCase())
    );

    const activeProducts = (selectedSupplier?.supplier_products ?? []).filter(p => p.is_active);

    const qty   = parseFloat(form.quantity)   || 0;
    const price = parseFloat(form.unit_price) || 0;
    const total = qty * price;
    const fee   = Math.floor(total * PLATFORM_FEE_RATE);
    const tva   = Math.floor(fee * TVA_RATE);

    const handleSubmit = async () => {
        if (!selectedSupplier || !selectedProduct) return;
        if (qty <= 0) { setError("La quantité doit être supérieure à 0"); return; }
        if (price <= 0) { setError("Le prix doit être supérieur à 0"); return; }
        setError(null);
        setSubmitting(true);
        try {
            const res = await authFetch("/api/marketplace/trace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplier_id: selectedSupplier.id,
                    product_id: selectedProduct.id,
                    quantity: qty,
                    unit: selectedProduct.unit,
                    unit_price: price,
                    lot_number: form.lot_number.trim() || undefined,
                    harvest_date: form.harvest_date || undefined,
                    expected_delivery_date: form.expected_delivery_date || undefined,
                    notes: form.notes.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Erreur lors de l'enregistrement"); return; }
            onCreated();
        } catch {
            setError("Erreur réseau");
        } finally {
            setSubmitting(false);
        }
    };

    const totalSteps = startStep === 3 ? 1 : startStep === 2 ? 2 : 3;
    const currentStepLabel = step === 1 ? "Choisir le fournisseur" : step === 2 ? "Choisir le produit" : "Détails de la commande";
    const stepIndex = step - startStep + 1;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="bg-surface-900 border border-surface-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-700/50">
                    <div>
                        <h3 className="font-semibold text-white">Enregistrer un achat</h3>
                        <p className="text-xs text-surface-400 mt-0.5">
                            Étape {stepIndex} sur {totalSteps} — {currentStepLabel}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors">
                        <X size={18} className="text-surface-400" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="flex px-5 pt-4 gap-1.5">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 h-1 rounded-full transition-colors ${i < stepIndex ? "bg-brand-500" : "bg-surface-700"}`}
                        />
                    ))}
                </div>

                {/* ── Step 1: Supplier ── */}
                {step === 1 && (
                    <div className="p-5 space-y-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                            <input
                                autoFocus
                                type="text"
                                value={supplierSearch}
                                onChange={e => setSupplierSearch(e.target.value)}
                                placeholder="Rechercher un fournisseur..."
                                className="w-full pl-9 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:border-brand-500/50"
                            />
                        </div>
                        <div className="max-h-72 overflow-y-auto space-y-1.5 custom-scrollbar">
                            {loadingSuppliers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-surface-500" />
                                </div>
                            ) : filteredSuppliers.length === 0 ? (
                                <p className="text-center text-sm text-surface-500 py-8">Aucun fournisseur trouvé</p>
                            ) : filteredSuppliers.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { setSelectedSupplier(s); setStep(2); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-800 hover:bg-surface-750 border border-surface-700 hover:border-brand-500/30 transition-all text-left"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-surface-700 flex items-center justify-center shrink-0 overflow-hidden">
                                        {s.logo_url ? (
                                            <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Sprout size={16} className="text-green-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{s.name}</p>
                                        <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                                            <MapPin size={9} /> {s.locality}, {s.region}
                                            <span className="mx-1 text-surface-600">·</span>
                                            {TYPE_LABELS[s.type] ?? s.type}
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className="text-surface-600 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 2: Product ── */}
                {step === 2 && selectedSupplier && (
                    <div className="p-5 space-y-3">
                        {!initialSupplier && (
                            <button
                                onClick={() => { setStep(1); setSelectedProduct(null); }}
                                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={12} /> Changer de fournisseur
                            </button>
                        )}
                        <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
                            <Sprout size={14} className="text-green-400 shrink-0" />
                            <span className="text-sm font-medium text-white">{selectedSupplier.name}</span>
                            <span className="text-xs text-surface-400 ml-auto">{selectedSupplier.locality}</span>
                        </div>
                        {activeProducts.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <Package size={20} className="text-surface-600" />
                                <p className="text-sm text-surface-500">Ce fournisseur n'a pas de produits actifs.</p>
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar">
                                {activeProducts.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedProduct(p);
                                            setForm(f => ({ ...f, unit_price: String(p.price_per_unit) }));
                                            setStep(3);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-800 hover:bg-surface-750 border border-surface-700 hover:border-brand-500/30 transition-all text-left"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-surface-700 flex items-center justify-center shrink-0">
                                            <Package size={15} className="text-brand-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                            <p className="text-xs text-surface-400 mt-0.5">
                                                {CATEGORY_LABELS[p.category] ?? p.category} · {fmt(p.price_per_unit)} FCFA/{UNIT_LABELS[p.unit] ?? p.unit}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className="text-surface-600 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 3: Details ── */}
                {step === 3 && selectedSupplier && selectedProduct && (
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Back if not fully pre-filled */}
                        {startStep < 3 && (
                            <button
                                onClick={() => setStep(initialSupplier ? 2 : 2)}
                                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={12} /> {initialProduct ? "Retour" : "Changer de produit"}
                            </button>
                        )}

                        {/* Breadcrumb recap */}
                        <div className="flex items-center gap-2 p-3 bg-surface-800 border border-surface-700 rounded-xl text-xs">
                            <Sprout size={13} className="text-green-400 shrink-0" />
                            <span className="text-surface-300 truncate">{selectedSupplier.name}</span>
                            <ChevronRight size={11} className="text-surface-600 shrink-0" />
                            <Package size={13} className="text-brand-400 shrink-0" />
                            <span className="font-medium text-white truncate">{selectedProduct.name}</span>
                        </div>

                        {/* Quantity + price */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400">Quantité *</label>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={form.quantity}
                                        onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                                        placeholder="0"
                                        className="w-full pr-12 pl-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-500">
                                        {UNIT_LABELS[selectedProduct.unit] ?? selectedProduct.unit}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400">
                                    Prix réel * <span className="text-surface-600">(FCFA)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.unit_price}
                                    onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                                    placeholder={String(selectedProduct.price_per_unit)}
                                    className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
                                />
                            </div>
                        </div>

                        {/* Price summary */}
                        {qty > 0 && price > 0 && (
                            <div className="bg-surface-800/60 border border-surface-700/50 rounded-xl p-3 space-y-1.5 text-xs">
                                <div className="flex justify-between text-surface-400">
                                    <span>Montant HT (exonéré TVA)</span>
                                    <span className="font-medium text-white">{fmt(total)} FCFA</span>
                                </div>
                                <div className="flex justify-between text-surface-500">
                                    <span>Frais plateforme KBouffe (3%)</span>
                                    <span>{fmt(fee)} FCFA</span>
                                </div>
                                <div className="flex justify-between text-surface-500">
                                    <span>TVA frais (19,25%)</span>
                                    <span>{fmt(tva)} FCFA</span>
                                </div>
                                <div className="flex justify-between border-t border-surface-700 pt-1.5 font-semibold">
                                    <span className="text-surface-300">À payer au fournisseur</span>
                                    <span className="text-white">{fmt(total)} FCFA</span>
                                </div>
                                <p className="text-surface-600 text-[10px]">
                                    Facture directe {selectedSupplier.name} → vous. CGI Art.131.
                                </p>
                            </div>
                        )}

                        {/* Optional fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                    <Hash size={10} /> N° de lot
                                </label>
                                <input
                                    type="text"
                                    value={form.lot_number}
                                    onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))}
                                    placeholder="LOT-2026-001"
                                    className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                    <Calendar size={10} /> Date de récolte
                                </label>
                                <input
                                    type="date"
                                    value={form.harvest_date}
                                    onChange={e => setForm(f => ({ ...f, harvest_date: e.target.value }))}
                                    className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500/50 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                <Calendar size={10} /> Livraison attendue
                            </label>
                            <input
                                type="date"
                                value={form.expected_delivery_date}
                                onChange={e => setForm(f => ({ ...f, expected_delivery_date: e.target.value }))}
                                className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500/50 [color-scheme:dark]"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                <FileText size={10} /> Notes
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                placeholder="Conditions particulières, instructions de livraison..."
                                className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:border-brand-500/50 resize-none"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                                <AlertTriangle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || qty <= 0 || price <= 0}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
                                : <><Receipt size={16} /> Enregistrer la transaction</>
                            }
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
