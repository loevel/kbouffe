"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList,
    Plus,
    RefreshCw,
    ChevronDown,
    CheckCircle2,
    Clock,
    Truck,
    AlertTriangle,
    XCircle,
    ArrowLeft,
    ArrowRight,
    Loader2,
    TrendingUp,
    Users,
    Info,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { TraceModal } from "@/components/dashboard/approvisionnement/TraceModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Supplier {
    id: string;
    name: string;
    type: string;
    phone: string;
    region: string;
    locality: string;
    logo_url: string | null;
    supplier_products?: SupplierProduct[];
}

interface SupplierProduct {
    id: string;
    name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    is_active: boolean;
}

interface TraceSupplier { id: string; name: string; phone: string; region: string; }
interface TraceProduct  { id: string; name: string; category: string; unit: string; }

interface Trace {
    id: string;
    supplier_id: string;
    product_id: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    lot_number: string | null;
    harvest_date: string | null;
    platform_fee: number;
    platform_fee_tva: number;
    expected_delivery_date: string | null;
    actual_delivery_date: string | null;
    delivery_status: "pending" | "confirmed" | "delivered" | "disputed" | "cancelled";
    dispute_reason: string | null;
    notes: string | null;
    created_at: string;
    supplier?: TraceSupplier;
    product?: TraceProduct;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:   { label: "En attente",  color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
    confirmed: { label: "Confirmée",   color: "bg-blue-500/10 text-blue-400 border-blue-500/20",       icon: CheckCircle2 },
    delivered: { label: "Livrée",      color: "bg-green-500/10 text-green-400 border-green-500/20",    icon: Truck },
    disputed:  { label: "Litige",      color: "bg-red-500/10 text-red-400 border-red-500/20",          icon: AlertTriangle },
    cancelled: { label: "Annulée",     color: "bg-surface-500/10 text-surface-400 border-surface-500/20", icon: XCircle },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending:   ["confirmed", "cancelled"],
    confirmed: ["delivered", "disputed"],
    delivered: [],
    disputed:  ["delivered", "cancelled"],
    cancelled: [],
};

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return n.toLocaleString("fr-FR");
}
function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
            <Icon size={11} /> {cfg.label}
        </span>
    );
}

// ── StatusUpdateMenu ──────────────────────────────────────────────────────────

function StatusUpdateMenu({
    trace,
    onUpdate,
}: {
    trace: Trace;
    onUpdate: (id: string, status: string, extra?: { dispute_reason?: string; actual_delivery_date?: string }) => Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);

    const nexts = STATUS_TRANSITIONS[trace.delivery_status] ?? [];
    if (nexts.length === 0) return <StatusBadge status={trace.delivery_status} />;

    const handleClick = (status: string) => {
        if (status === "disputed") {
            setPendingStatus(status);
            setOpen(false);
        } else {
            setOpen(false);
            doUpdate(status);
        }
    };

    const doUpdate = async (status: string, extra?: object) => {
        setLoading(true);
        try {
            await onUpdate(trace.id, status, {
                ...extra,
                ...(status === "delivered" ? { actual_delivery_date: new Date().toISOString().split("T")[0] } : {}),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Dispute modal */}
            <AnimatePresence>
                {pendingStatus === "disputed" && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface-900 border border-surface-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                        >
                            <h4 className="font-semibold text-white mb-1">Déclarer un litige</h4>
                            <p className="text-xs text-surface-400 mb-3">Décrivez le problème rencontré avec cette livraison.</p>
                            <textarea
                                value={disputeReason}
                                onChange={e => setDisputeReason(e.target.value)}
                                placeholder="Ex: Produits endommagés, quantité incomplète..."
                                rows={3}
                                className="w-full bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-500 p-3 focus:outline-none focus:border-red-500/50 resize-none mb-4"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setPendingStatus(null); setDisputeReason(""); }}
                                    className="flex-1 py-2 text-sm text-surface-400 border border-surface-700 rounded-xl hover:border-surface-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    disabled={!disputeReason.trim() || loading}
                                    onClick={() => {
                                        setPendingStatus(null);
                                        doUpdate("disputed", { dispute_reason: disputeReason });
                                    }}
                                    className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Confirmer le litige
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="relative">
                <button
                    onClick={() => setOpen(v => !v)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5"
                >
                    {loading ? (
                        <Loader2 size={14} className="animate-spin text-surface-400" />
                    ) : (
                        <>
                            <StatusBadge status={trace.delivery_status} />
                            <ChevronDown size={12} className="text-surface-500" />
                        </>
                    )}
                </button>

                <AnimatePresence>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="absolute left-0 top-full mt-1 z-20 bg-surface-800 border border-surface-700 rounded-xl shadow-xl min-w-40 overflow-hidden"
                            >
                                {nexts.map(status => {
                                    const cfg = STATUS_CONFIG[status];
                                    const Icon = cfg.icon;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleClick(status)}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-700 transition-colors text-left"
                                        >
                                            <Icon size={14} className={cfg.color.split(" ")[1]} />
                                            <span className="text-white">{cfg.label}</span>
                                        </button>
                                    );
                                })}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

// NewTraceModal is now the shared TraceModal component — imported above

// ── Trace Row ─────────────────────────────────────────────────────────────────

function TraceRow({ trace, onUpdate }: { trace: Trace; onUpdate: (id: string, status: string, extra?: object) => Promise<void> }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className="border-b border-surface-800 hover:bg-surface-800/30 transition-colors cursor-pointer"
                onClick={() => setExpanded(v => !v)}
            >
                <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{trace.supplier?.name ?? "—"}</div>
                    <div className="text-xs text-surface-400 mt-0.5">{trace.supplier?.region ?? ""}</div>
                </td>
                <td className="px-4 py-3">
                    <div className="text-sm text-white">{trace.product?.name ?? "—"}</div>
                    <div className="text-xs text-surface-400 mt-0.5">{CATEGORY_LABELS[trace.product?.category ?? ""] ?? trace.product?.category ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-sm text-white">
                    {fmt(trace.quantity)} {UNIT_LABELS[trace.unit] ?? trace.unit}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-white">
                    {fmt(trace.total_price)} FCFA
                </td>
                <td className="px-4 py-3 text-sm text-surface-400">
                    {fmtDate(trace.created_at)}
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <StatusUpdateMenu trace={trace} onUpdate={onUpdate} />
                </td>
                <td className="px-4 py-3 text-right">
                    <ChevronDown
                        size={14}
                        className={`text-surface-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                </td>
            </tr>

            {/* Expanded detail row */}
            <AnimatePresence>
                {expanded && (
                    <tr>
                        <td colSpan={7} className="px-0 py-0">
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 py-3 bg-surface-800/40 border-b border-surface-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <p className="text-surface-500 mb-0.5">Prix unitaire</p>
                                        <p className="text-white">{fmt(trace.unit_price)} FCFA / {UNIT_LABELS[trace.unit] ?? trace.unit}</p>
                                    </div>
                                    <div>
                                        <p className="text-surface-500 mb-0.5">Frais plateforme</p>
                                        <p className="text-white">{fmt(trace.platform_fee)} FCFA <span className="text-surface-500">(+{fmt(trace.platform_fee_tva)} TVA)</span></p>
                                    </div>
                                    <div>
                                        <p className="text-surface-500 mb-0.5">N° de lot</p>
                                        <p className="text-white">{trace.lot_number ?? "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-surface-500 mb-0.5">Date de récolte</p>
                                        <p className="text-white">{fmtDate(trace.harvest_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-surface-500 mb-0.5">Livraison attendue</p>
                                        <p className="text-white">{fmtDate(trace.expected_delivery_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-surface-500 mb-0.5">Livraison effective</p>
                                        <p className="text-white">{fmtDate(trace.actual_delivery_date)}</p>
                                    </div>
                                    {trace.dispute_reason && (
                                        <div className="col-span-2">
                                            <p className="text-surface-500 mb-0.5">Motif du litige</p>
                                            <p className="text-red-400">{trace.dispute_reason}</p>
                                        </div>
                                    )}
                                    {trace.notes && (
                                        <div className="col-span-2 md:col-span-4">
                                            <p className="text-surface-500 mb-0.5">Notes</p>
                                            <p className="text-white">{trace.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </td>
                    </tr>
                )}
            </AnimatePresence>
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
    { value: "", label: "Toutes" },
    { value: "pending",   label: "En attente" },
    { value: "confirmed", label: "Confirmées" },
    { value: "delivered", label: "Livrées" },
    { value: "disputed",  label: "Litiges" },
    { value: "cancelled", label: "Annulées" },
];

export default function TracePage() {
    const [traces, setTraces] = useState<Trace[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const loadTraces = useCallback(async (reset = false) => {
        setLoading(true);
        const p = reset ? 1 : page;
        if (reset) setPage(1);
        try {
            const params = new URLSearchParams({ page: String(p) });
            if (statusFilter) params.set("delivery_status", statusFilter);
            const res = await authFetch(`/api/marketplace/trace?${params}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setTraces(data.traces ?? []);
        } catch {
            setTraces([]);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { loadTraces(); }, [page, statusFilter]);

    const updateStatus = async (id: string, status: string, extra?: object) => {
        const res = await authFetch(`/api/marketplace/trace/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ delivery_status: status, ...extra }),
        });
        if (!res.ok) throw new Error();
        await loadTraces();
    };

    // ── Stats from current data ──
    const totalSpent    = traces.filter(t => t.delivery_status !== "cancelled").reduce((s, t) => s + t.total_price, 0);
    const delivered     = traces.filter(t => t.delivery_status === "delivered").length;
    const uniqueSuppliers = new Set(traces.map(t => t.supplier_id)).size;
    const pending       = traces.filter(t => t.delivery_status === "pending").length;

    return (
        <>
            <AnimatePresence>
                {showModal && (
                    <TraceModal
                        onClose={() => setShowModal(false)}
                        onCreated={() => { setShowModal(false); loadTraces(true); }}
                    />
                )}
            </AnimatePresence>

            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                                <ClipboardList size={18} className="text-brand-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Traçabilité fournisseurs</h1>
                        </div>
                        <p className="text-surface-400 text-sm">
                            Historique de vos achats agricoles — Art.18 Loi 2015/018
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => loadTraces(true)}
                            className="p-2 text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition-colors"
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
                        >
                            <Plus size={15} /> Enregistrer un achat
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total dépenses", value: `${fmt(totalSpent)} FCFA`, icon: TrendingUp, color: "text-brand-400" },
                        { label: "Livraisons reçues", value: String(delivered), icon: Truck, color: "text-green-400" },
                        { label: "Fournisseurs actifs", value: String(uniqueSuppliers), icon: Users, color: "text-blue-400" },
                        { label: "En attente", value: String(pending), icon: Clock, color: "text-yellow-400" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-surface-900 border border-surface-700 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-surface-400">{stat.label}</p>
                                <stat.icon size={15} className={stat.color} />
                            </div>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Legal note ── */}
                <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl text-xs text-blue-300">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>
                        <strong>Conformité légale :</strong> Ce registre de traçabilité est conforme à la Loi 2015/018 (Art.18) et
                        à la Loi 2011/012 (Art.15). Les produits agricoles bruts sont exonérés de TVA (CGI Art.131).
                        Seuls les frais de plateforme KBouffe (3%) sont soumis à TVA (19,25% — CGI Art.128).
                    </span>
                </div>

                {/* ── Filters ── */}
                <div className="flex items-center gap-2 flex-wrap">
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => { setStatusFilter(f.value); setPage(1); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                statusFilter === f.value
                                    ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                                    : "text-surface-400 border-surface-700 hover:border-surface-600"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* ── Table ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-surface-500" />
                    </div>
                ) : traces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-surface-900 border border-surface-700 rounded-2xl text-center">
                        <ClipboardList size={32} className="text-surface-600 mb-3" />
                        <h3 className="text-base font-semibold text-white mb-1">Aucune transaction</h3>
                        <p className="text-sm text-surface-400 mb-4">
                            {statusFilter
                                ? "Aucune transaction avec ce statut."
                                : "Enregistrez votre premier achat auprès d'un fournisseur."}
                        </p>
                        {!statusFilter && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                <Plus size={14} /> Enregistrer un achat
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-surface-900 border border-surface-700 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-surface-700">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-surface-400">Fournisseur</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-surface-400">Produit</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-surface-400">Quantité</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-surface-400">Montant</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-surface-400">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-surface-400">Statut</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {traces.map(trace => (
                                        <TraceRow key={trace.id} trace={trace} onUpdate={updateStatus} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Pagination ── */}
                {traces.length >= 20 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft size={14} /> Précédent
                        </button>
                        <span className="text-sm text-surface-500 px-2">Page {page}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 rounded-xl transition"
                        >
                            Suivant <ArrowRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
