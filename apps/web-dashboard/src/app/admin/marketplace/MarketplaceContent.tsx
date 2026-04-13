"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Package, Plus, Star, Megaphone, TrendingUp, Eye,
    BarChart3, Send, ShoppingBag, PenSquare, Trash2,
    ToggleLeft, ToggleRight, X, ChevronDown,
    ArrowUpRight, Search, Filter, Lightbulb, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────
interface MarketplaceService {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string;
    price: number;
    duration_days: number | null;
    features: string[];
    icon: string;
    is_active: boolean;
    sort_order: number;
    purchaseCount: number;
    created_at: string;
}

interface MarketplacePurchase {
    id: string;
    restaurant_id: string;
    service_id: string;
    admin_id: string;
    status: string;
    starts_at: string;
    expires_at: string | null;
    amount_paid: number;
    notes: string | null;
    created_at: string;
    service: { name: string; slug: string; category: string; icon: string } | null;
    restaurant: { name: string; slug: string } | null;
    admin: { full_name: string } | null;
}

interface Stats {
    totalServices: number;
    activeServices: number;
    totalPurchases: number;
    activePurchases: number;
    totalRevenue: number;
}

type Tab = "catalog" | "purchases";

const CATEGORIES = [
    { value: "visibility", label: "Visibilité", icon: Eye },
    { value: "advertising", label: "Publicité", icon: Megaphone },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "communication", label: "Communication", icon: Send },
];

const ICON_MAP: Record<string, any> = {
    Package, Star, Megaphone, TrendingUp, Eye, BarChart3, Send, ShoppingBag,
};

function formatFCFA(val: number) {
    return new Intl.NumberFormat("fr-FR").format(val) + " FCFA";
}

// ── Animations ──────────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// ── KPI Card ────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, iconColor }: {
    label: string; value: string; sub?: string; icon: any; iconColor: string;
}) {
    return (
        <motion.div
            variants={itemVariants}
            className="group relative bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 p-8 flex flex-col gap-6 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500"
        >
            <div className="flex items-start justify-between">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500", iconColor)}>
                    <Icon size={28} strokeWidth={1.5} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 group-hover:text-brand-500 transition-colors">{label}</p>
                    <p className="text-3xl font-black text-surface-900 dark:text-white mt-1 tabular-nums tracking-tight">{value}</p>
                </div>
            </div>
            {sub && (
                <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">{sub}</span>
                    <ArrowUpRight size={14} className="text-surface-300 group-hover:text-brand-500 transition-colors" />
                </div>
            )}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </motion.div>
    );
}

// ── Service Modal ───────────────────────────────────────────────────
function ServiceModal({ service, onClose, onSave }: {
    service: Partial<MarketplaceService> | null;
    onClose: () => void;
    onSave: (data: any) => void;
}) {
    const isEdit = !!service?.id;
    const [form, setForm] = useState({
        name: service?.name ?? "",
        slug: service?.slug ?? "",
        description: service?.description ?? "",
        category: service?.category ?? "visibility",
        price: service?.price ?? 0,
        durationDays: service?.duration_days ?? "",
        features: (service?.features ?? []).join("\n"),
        icon: service?.icon ?? "Package",
        isActive: service?.is_active ?? true,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.name || !form.slug) return;
        setSaving(true);
        const payload = {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            category: form.category,
            price: Number(form.price),
            durationDays: form.durationDays ? Number(form.durationDays) : null,
            features: form.features.split("\n").map(s => s.trim()).filter(Boolean),
            icon: form.icon,
            isActive: form.isActive,
        };
        try {
            await onSave(payload);
        } finally {
            setSaving(false);
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        const slug = isEdit ? form.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        setForm(f => ({ ...f, name, slug }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
            >
                <div className="sticky top-0 bg-white dark:bg-surface-900 z-10 flex items-center justify-between p-8 pb-4 border-b border-surface-100 dark:border-surface-800">
                    <h2 className="text-2xl font-black tracking-tight">{isEdit ? "Modifier le Service" : "Nouveau Service"}</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-surface-500">Nom *</label>
                            <input
                                value={form.name}
                                onChange={e => handleNameChange(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium"
                                placeholder="Pack Visibilité Top 3"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-surface-500">Slug *</label>
                            <input
                                value={form.slug}
                                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                                placeholder="visibility_top3"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-surface-500">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium resize-none"
                            placeholder="Description du service..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-surface-500">Catégorie</label>
                            <select
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            >
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-surface-500">Prix (FCFA)</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                                className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-bold tabular-nums"
                                min={0}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-surface-500">Durée (jours)</label>
                            <input
                                type="number"
                                value={form.durationDays}
                                onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                                className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium tabular-nums"
                                placeholder="Vide = permanent"
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-surface-500">Icône</label>
                            <select
                                value={form.icon}
                                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                                className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            >
                                {Object.keys(ICON_MAP).map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-surface-500">Statut</label>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                className={cn(
                                    "w-full h-12 px-4 rounded-xl border flex items-center justify-between font-bold transition-all",
                                    form.isActive
                                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                        : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-500"
                                )}
                            >
                                {form.isActive ? "Actif" : "Inactif"}
                                {form.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-surface-500">Fonctionnalités (une par ligne)</label>
                        <textarea
                            value={form.features}
                            onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium resize-none text-sm"
                            placeholder="Apparition dans le Top 3 pendant 7 jours&#10;Badge spécial sur la carte&#10;Notification push aux clients"
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-surface-900 z-10 flex justify-end gap-3 p-8 pt-4 border-t border-surface-100 dark:border-surface-800">
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-6 h-12">Annuler</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!form.name || !form.slug || saving}
                        className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-8 h-12 font-black shadow-lg shadow-brand-500/20 disabled:opacity-50"
                    >
                        {saving ? "Enregistrement..." : isEdit ? "Sauvegarder" : "Créer le Service"}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Purchase Modal ──────────────────────────────────────────────────
function PurchaseModal({ services, onClose, onSave }: {
    services: MarketplaceService[];
    onClose: () => void;
    onSave: (data: any) => void;
}) {
    const [form, setForm] = useState({
        restaurantId: "",
        serviceId: "",
        amountPaid: "",
        notes: "",
    });
    const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        adminFetch("/api/admin/restaurants?limit=200")
            .then(r => r.json())
            .then(d => setRestaurants(d.data || d || []))
            .catch(() => {});
    }, []);

    const selectedService = services.find(s => s.id === form.serviceId);

    const handleSubmit = async () => {
        if (!form.restaurantId || !form.serviceId) return;
        setSaving(true);
        try {
            await onSave({
                restaurantId: form.restaurantId,
                serviceId: form.serviceId,
                amountPaid: form.amountPaid ? Number(form.amountPaid) : undefined,
                notes: form.notes || undefined,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-lg"
            >
                <div className="flex items-center justify-between p-8 pb-4 border-b border-surface-100 dark:border-surface-800">
                    <h2 className="text-2xl font-black tracking-tight">Attribuer un Service</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-surface-500">Restaurant *</label>
                        <select
                            value={form.restaurantId}
                            onChange={e => setForm(f => ({ ...f, restaurantId: e.target.value }))}
                            className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                        >
                            <option value="">Sélectionner un restaurant...</option>
                            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-surface-500">Service *</label>
                        <select
                            value={form.serviceId}
                            onChange={e => setForm(f => ({ ...f, serviceId: e.target.value, amountPaid: "" }))}
                            className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                        >
                            <option value="">Sélectionner un service...</option>
                            {services.filter(s => s.is_active).map(s => (
                                <option key={s.id} value={s.id}>{s.name} — {formatFCFA(s.price)}</option>
                            ))}
                        </select>
                    </div>

                    {selectedService && (
                        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 text-sm">
                            <span className="font-bold text-brand-600">Prix de référence :</span>{" "}
                            <span className="font-black">{formatFCFA(selectedService.price)}</span>
                            {selectedService.duration_days && (
                                <span className="text-surface-500 ml-2">• {selectedService.duration_days} jours</span>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-surface-500">Montant payé (optionnel)</label>
                        <input
                            type="number"
                            value={form.amountPaid}
                            onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                            className="w-full h-12 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-bold tabular-nums"
                            placeholder={selectedService ? String(selectedService.price) : "0"}
                            min={0}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-surface-500">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium resize-none text-sm"
                            placeholder="Notes internes..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-8 pt-4 border-t border-surface-100 dark:border-surface-800">
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-6 h-12">Annuler</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!form.restaurantId || !form.serviceId || saving}
                        className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-8 h-12 font-black shadow-lg shadow-brand-500/20 disabled:opacity-50"
                    >
                        {saving ? "Attribution..." : "Attribuer"}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
//  Main Page
// ════════════════════════════════════════════════════════════════════
export default function AdminMarketplacePage() {
    const [tab, setTab] = useState<Tab>("catalog");
    const [stats, setStats] = useState<Stats | null>(null);
    const [services, setServices] = useState<MarketplaceService[]>([]);
    const [purchases, setPurchases] = useState<MarketplacePurchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [serviceModal, setServiceModal] = useState<Partial<MarketplaceService> | null | "new">(null);
    const [purchaseModal, setPurchaseModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [purchaseStatusFilter, setPurchaseStatusFilter] = useState("all");

    const loadStats = useCallback(async () => {
        try {
            const res = await adminFetch("/api/admin/marketplace/stats");
            if (res.ok) setStats(await res.json());
        } catch {}
    }, []);

    const loadServices = useCallback(async () => {
        try {
            const res = await adminFetch("/api/admin/marketplace/services");
            if (res.ok) {
                const json = await res.json();
                setServices(json.data || []);
            }
        } catch {}
    }, []);

    const loadPurchases = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (purchaseStatusFilter !== "all") params.set("status", purchaseStatusFilter);
            const res = await adminFetch(`/api/admin/marketplace/purchases?${params}`);
            if (res.ok) {
                const json = await res.json();
                setPurchases(json.data || []);
            }
        } catch {}
    }, [purchaseStatusFilter]);

    useEffect(() => {
        Promise.all([loadStats(), loadServices(), loadPurchases()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadPurchases(); }, [purchaseStatusFilter]);

    // Service CRUD
    const handleSaveService = async (data: any) => {
        const isEdit = serviceModal && typeof serviceModal === "object" && serviceModal.id;
        const url = isEdit ? `/api/admin/marketplace/services/${(serviceModal as MarketplaceService).id}` : "/api/admin/marketplace/services";
        const method = isEdit ? "PATCH" : "POST";
        const res = await adminFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (res.ok) {
            setServiceModal(null);
            await Promise.all([loadServices(), loadStats()]);
        }
    };

    const handleToggleService = async (service: MarketplaceService) => {
        await adminFetch(`/api/admin/marketplace/services/${service.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !service.is_active }),
        });
        await loadServices();
        await loadStats();
    };

    const handleDeleteService = async (service: MarketplaceService) => {
        if (!confirm(`Supprimer « ${service.name} » ? Cette action est irréversible.`)) return;
        const res = await adminFetch(`/api/admin/marketplace/services/${service.id}`, { method: "DELETE" });
        if (res.ok) {
            await Promise.all([loadServices(), loadStats()]);
        } else {
            const err = await res.json();
            alert(err.error || "Erreur lors de la suppression");
        }
    };

    // Purchase CRUD
    const handleSavePurchase = async (data: any) => {
        const res = await adminFetch("/api/admin/marketplace/purchases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setPurchaseModal(false);
            await Promise.all([loadPurchases(), loadStats()]);
        }
    };

    const handleCancelPurchase = async (purchase: MarketplacePurchase) => {
        if (!confirm("Annuler cet achat ?")) return;
        await adminFetch(`/api/admin/marketplace/purchases/${purchase.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelled" }),
        });
        await Promise.all([loadPurchases(), loadStats()]);
    };

    // Filter services by search
    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[0];
    const getIcon = (name: string) => ICON_MAP[name] || Package;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-12 pb-20"
        >
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-surface-100 dark:border-surface-800 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-500 mb-1">
                        <ShoppingBag size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">Services Hub</span>
                    </div>
                    <h1 className="text-5xl font-black text-surface-900 dark:text-white tracking-tighter">
                        Marketplace
                    </h1>
                    <p className="text-surface-500 text-lg font-medium leading-relaxed max-w-2xl">
                        Gérez les packs et services additionnels vendus aux restaurateurs. Créez des offres de visibilité, publicité, et plus.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setPurchaseModal(true)}
                        className="rounded-xl h-12 px-5 font-bold border-surface-300 hover:border-brand-500"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Attribuer
                    </Button>
                    <Button
                        onClick={() => setServiceModal("new")}
                        className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl h-12 px-6 font-black shadow-lg shadow-brand-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nouveau Service
                    </Button>
                </div>
            </div>

            {/* ── KPIs ── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 bg-surface-100 dark:bg-surface-800 rounded-[2rem]" />)}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard
                            label="Services actifs"
                            value={String(stats?.activeServices ?? 0)}
                            sub={`${stats?.totalServices ?? 0} au total`}
                            icon={Package}
                            iconColor="bg-brand-500 text-white shadow-xl shadow-brand-500/20"
                        />
                        <KpiCard
                            label="Achats actifs"
                            value={String(stats?.activePurchases ?? 0)}
                            sub={`${stats?.totalPurchases ?? 0} au total`}
                            icon={ShoppingBag}
                            iconColor="bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                        />
                        <KpiCard
                            label="Revenus générés"
                            value={formatFCFA(stats?.totalRevenue ?? 0)}
                            sub="Cumul total"
                            icon={TrendingUp}
                            iconColor="bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                        />
                    </div>

                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-[2rem] border border-blue-200 dark:border-blue-500/20 p-8"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                <Lightbulb size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-blue-900 dark:text-blue-100 mb-3">Insights Opérationnels</h3>
                                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-600">→</span>
                                        {stats && stats.activePurchases > 0
                                            ? `${((stats.activePurchases / stats.totalPurchases) * 100).toFixed(0)}% des achats sont actuellement actifs`
                                            : "Aucun achat actif détecté"
                                        }
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-600">→</span>
                                        {stats && stats.activeServices > 0
                                            ? `${((stats.activeServices / stats.totalServices) * 100).toFixed(0)}% des services sont actifs`
                                            : "Aucun service actif"
                                        }
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-600">→</span>
                                        {stats && stats.totalPurchases > 0
                                            ? `Revenu moyen par achat: ${formatFCFA(stats.totalRevenue / stats.totalPurchases)}`
                                            : "Pas de données de revenu"
                                        }
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-1 rounded-2xl inline-flex items-center gap-1 shadow-sm">
                    <button
                        onClick={() => setTab("catalog")}
                        className={cn(
                            "rounded-xl h-10 px-6 font-bold text-sm transition-all",
                            tab === "catalog" ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-surface-500 hover:text-brand-500"
                        )}
                    >
                        <Package className="w-4 h-4 inline mr-2" />Catalogue
                    </button>
                    <button
                        onClick={() => setTab("purchases")}
                        className={cn(
                            "rounded-xl h-10 px-6 font-bold text-sm transition-all",
                            tab === "purchases" ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-surface-500 hover:text-brand-500"
                        )}
                    >
                        <ShoppingBag className="w-4 h-4 inline mr-2" />Achats
                    </button>
                </div>
            </motion.div>

            {/* ── Catalog Tab ── */}
            {tab === "catalog" && (
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un service..."
                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Services List */}
                    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-[2rem] overflow-hidden">
                        {filteredServices.length === 0 ? (
                            <div className="p-16 text-center text-surface-400">
                                <Package size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-bold">Aucun service trouvé</p>
                                <p className="text-sm mt-1">Créez votre premier pack de services pour le marketplace.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-100 dark:divide-surface-800">
                                {filteredServices.map((service) => {
                                    const catInfo = getCategoryInfo(service.category);
                                    const IconComp = getIcon(service.icon);
                                    return (
                                        <motion.div
                                            key={service.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-6 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                                                    <IconComp className="w-7 h-7 text-surface-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-black text-lg truncate">{service.name}</h3>
                                                        <Badge variant={service.is_active ? "success" : "default"}>
                                                            {service.is_active ? "Actif" : "Inactif"}
                                                        </Badge>
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                                                            {catInfo.label}
                                                        </span>
                                                    </div>
                                                    {service.description && (
                                                        <p className="text-sm text-surface-500 mt-1 line-clamp-1">{service.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-surface-400">
                                                        <span>{service.purchaseCount} achat(s)</span>
                                                        {service.duration_days && <span>{service.duration_days}j de durée</span>}
                                                        {service.features?.length > 0 && <span>{service.features.length} feature(s)</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end shrink-0">
                                                <span className="font-black text-lg text-brand-500 tabular-nums">{formatFCFA(service.price)}</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleToggleService(service)}
                                                        className={cn(
                                                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                                            service.is_active ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                                                        )}
                                                        title={service.is_active ? "Désactiver" : "Activer"}
                                                    >
                                                        {service.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                    </button>
                                                    <button
                                                        onClick={() => setServiceModal(service)}
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
                                                        title="Modifier"
                                                    >
                                                        <PenSquare size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(service)}
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── Purchases Tab ── */}
            {tab === "purchases" && (
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                            <select
                                value={purchaseStatusFilter}
                                onChange={e => setPurchaseStatusFilter(e.target.value)}
                                className="h-10 pl-9 pr-8 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 font-bold text-sm appearance-none focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actif</option>
                                <option value="expired">Expiré</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400" />
                        </div>
                    </div>

                    {/* Purchases List */}
                    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-[2rem] overflow-hidden">
                        {purchases.length === 0 ? (
                            <div className="p-16 text-center text-surface-400">
                                <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-bold">Aucun achat</p>
                                <p className="text-sm mt-1">Les achats de services apparaîtront ici.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-100 dark:divide-surface-800">
                                {purchases.map((purchase) => {
                                    const statusColors: Record<string, string> = {
                                        active: "success",
                                        expired: "warning",
                                        cancelled: "destructive",
                                    };
                                    const statusLabels: Record<string, string> = {
                                        active: "Actif",
                                        expired: "Expiré",
                                        cancelled: "Annulé",
                                    };
                                    return (
                                        <motion.div
                                            key={purchase.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-black">{purchase.restaurant?.name ?? "Restaurant inconnu"}</h3>
                                                    <span className="text-surface-400">→</span>
                                                    <span className="font-bold text-brand-500">{purchase.service?.name ?? "Service inconnu"}</span>
                                                    <Badge variant={(statusColors[purchase.status] ?? "default") as any}>
                                                        {statusLabels[purchase.status] ?? purchase.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs font-bold text-surface-400">
                                                    <span>Payé : {formatFCFA(purchase.amount_paid)}</span>
                                                    <span>Début : {new Date(purchase.starts_at).toLocaleDateString("fr-FR")}</span>
                                                    {purchase.expires_at && (
                                                        <span>Expiration : {new Date(purchase.expires_at).toLocaleDateString("fr-FR")}</span>
                                                    )}
                                                    {purchase.admin?.full_name && (
                                                        <span>Par : {purchase.admin.full_name}</span>
                                                    )}
                                                </div>
                                                {purchase.notes && (
                                                    <p className="text-xs text-surface-400 mt-1 italic">« {purchase.notes} »</p>
                                                )}
                                            </div>
                                            {purchase.status === "active" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCancelPurchase(purchase)}
                                                    className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 shrink-0"
                                                >
                                                    Annuler
                                                </Button>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── Modals ── */}
            <AnimatePresence>
                {serviceModal && (
                    <ServiceModal
                        service={serviceModal === "new" ? {} : serviceModal}
                        onClose={() => setServiceModal(null)}
                        onSave={handleSaveService}
                    />
                )}
                {purchaseModal && (
                    <PurchaseModal
                        services={services}
                        onClose={() => setPurchaseModal(false)}
                        onSave={handleSavePurchase}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
