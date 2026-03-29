"use client";

/**
 * RFQModal — Demande de devis (Request For Quotation)
 *
 * Génère un message structuré et propose :
 *  - Ouverture WhatsApp (canal principal au Cameroun)
 *  - Copie dans le presse-papier
 *
 * Pas de backend nécessaire — la communication reste directe
 * fournisseur ↔ restaurant (modèle annuaire, Art.18 Loi 2015/018).
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
    X, MessageCircle, Copy, Check, Phone, Mail,
    Package, Calendar, Hash, FileText, ExternalLink,
    Sprout, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RFQSupplier {
    id: string;
    name: string;
    contact_name: string;
    phone: string;
    email: string | null;
    locality: string;
    region: string;
    logo_url: string | null;
}

export interface RFQProduct {
    id: string;
    name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    min_order_quantity: number;
}

interface Props {
    supplier: RFQSupplier;
    product?: RFQProduct;
    onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const UNIT_LABELS: Record<string, string> = {
    kg: "kg", tonne: "tonne", litre: "L",
    caisse: "caisse", colis: "colis", sac: "sac", botte: "botte", piece: "pièce",
};

const CATEGORY_LABELS: Record<string, string> = {
    legumes: "Légumes", fruits: "Fruits", cereales: "Céréales",
    viande: "Viande", poisson: "Poisson", produits_laitiers: "Laitiers",
    epices: "Épices", huiles: "Huiles", condiments: "Condiments", autres: "Autres",
};

/** Formate un numéro Camerounais pour WhatsApp (ajoute +237 si absent) */
function toWhatsappPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("237")) return digits;
    if (digits.startsWith("6") || digits.startsWith("2")) return `237${digits}`;
    return digits;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RFQModal({ supplier, product, onClose }: Props) {
    const [form, setForm] = useState({
        quantity: product ? String(product.min_order_quantity) : "",
        delivery_date: "",
        notes: "",
    });
    const [copied, setCopied] = useState(false);

    const qty    = form.quantity.trim();
    const unit   = product ? (UNIT_LABELS[product.unit] ?? product.unit) : "";
    const cat    = product ? (CATEGORY_LABELS[product.category] ?? product.category) : "";

    /** Message structuré prêt à envoyer */
    function buildMessage(): string {
        const lines: string[] = [];
        lines.push(`Bonjour ${supplier.contact_name},`);
        lines.push(`Je vous contacte via KBouffe concernant votre offre.`);
        lines.push("");

        if (product) {
            lines.push(`📦 *Produit :* ${product.name} (${cat})`);
            if (qty) lines.push(`📊 *Quantité souhaitée :* ${qty} ${unit}`);
            lines.push(`💰 *Prix catalogue :* ${product.price_per_unit.toLocaleString("fr-FR")} FCFA/${unit}`);
        } else {
            lines.push(`Je suis intéressé(e) par vos produits.`);
        }

        if (form.delivery_date) {
            lines.push(`📅 *Livraison souhaitée :* ${new Date(form.delivery_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`);
        }

        if (form.notes.trim()) {
            lines.push(`📝 *Précisions :* ${form.notes.trim()}`);
        }

        lines.push("");
        lines.push(`Pourriez-vous me confirmer la disponibilité et vos conditions ?`);
        lines.push(`Merci.`);

        return lines.join("\n");
    }

    const message = buildMessage();
    const waPhone = toWhatsappPhone(supplier.phone);
    const waLink  = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="bg-surface-900 border border-surface-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-700/50">
                    <div>
                        <h3 className="font-semibold text-white">Demande de devis</h3>
                        <p className="text-xs text-surface-400 mt-0.5">Message envoyé directement au fournisseur</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors">
                        <X size={18} className="text-surface-400" />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Supplier recap */}
                    <div className="flex items-center gap-3 p-3 bg-surface-800 border border-surface-700 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-surface-700 flex items-center justify-center shrink-0 overflow-hidden">
                            {supplier.logo_url ? (
                                <img src={supplier.logo_url} alt={supplier.name} className="w-full h-full object-cover" />
                            ) : (
                                <Sprout size={16} className="text-green-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{supplier.name}</p>
                            <p className="text-xs text-surface-400">{supplier.contact_name} · {supplier.locality}</p>
                        </div>
                        {product && (
                            <>
                                <ChevronRight size={12} className="text-surface-600 shrink-0" />
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Package size={13} className="text-brand-400 shrink-0" />
                                    <span className="text-xs font-medium text-white truncate">{product.name}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Form fields */}
                    {product && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                                <Hash size={10} /> Quantité souhaitée
                            </label>
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={form.quantity}
                                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                                    placeholder={String(product.min_order_quantity)}
                                    className="w-full pr-16 pl-3 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-500">
                                    {UNIT_LABELS[product.unit] ?? product.unit}
                                </span>
                            </div>
                            <p className="text-xs text-surface-500">
                                Min. {product.min_order_quantity} {UNIT_LABELS[product.unit] ?? product.unit} · Catalogue : {product.price_per_unit.toLocaleString("fr-FR")} FCFA/{UNIT_LABELS[product.unit] ?? product.unit}
                            </p>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                            <Calendar size={10} /> Date de livraison souhaitée
                        </label>
                        <input
                            type="date"
                            value={form.delivery_date}
                            onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500/50 [color-scheme:dark]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-surface-400 flex items-center gap-1">
                            <FileText size={10} /> Message complémentaire
                        </label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            rows={2}
                            placeholder="Conditions particulières, qualité souhaitée, fréquence..."
                            className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:border-brand-500/50 resize-none"
                        />
                    </div>

                    {/* Message preview */}
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-surface-400">Aperçu du message</p>
                        <div className="bg-surface-800 border border-surface-700 rounded-xl p-3">
                            <pre className="text-xs text-surface-300 whitespace-pre-wrap font-sans leading-relaxed">
                                {message}
                            </pre>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                        {/* WhatsApp — primary CTA */}
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
                        >
                            <MessageCircle size={17} />
                            Envoyer via WhatsApp
                            <ExternalLink size={13} className="opacity-70" />
                        </a>

                        {/* Copy */}
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-700 hover:bg-surface-600 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            {copied
                                ? <><Check size={15} className="text-green-400" /> Copié !</>
                                : <><Copy size={15} /> Copier le message</>
                            }
                        </button>

                        {/* Direct call */}
                        <div className="grid grid-cols-2 gap-2">
                            <a
                                href={`tel:${supplier.phone}`}
                                className="flex items-center justify-center gap-2 py-2.5 border border-surface-700 hover:border-green-500/40 text-surface-300 hover:text-green-400 text-xs font-medium rounded-xl transition-colors"
                            >
                                <Phone size={13} /> {supplier.phone}
                            </a>
                            {supplier.email && (
                                <a
                                    href={`mailto:${supplier.email}?subject=Demande de devis${product ? ` — ${product.name}` : ""}&body=${encodeURIComponent(message)}`}
                                    className="flex items-center justify-center gap-2 py-2.5 border border-surface-700 hover:border-blue-500/40 text-surface-300 hover:text-blue-400 text-xs font-medium rounded-xl transition-colors"
                                >
                                    <Mail size={13} /> Email
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
