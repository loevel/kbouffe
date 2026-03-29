"use client";

/**
 * /admin/suppliers/[id] — Dossier complet d'un fournisseur
 *
 * Sections :
 *   1. En-tête identité (nom, type, statut, création)
 *   2. Dossier KYC — documents + résultats face liveness
 *   3. Actions KYC — Approuver / Rejeter / Suspendre
 *   4. Gestion profil — tier, featured, actif
 *   5. Catalogue produits (aperçu)
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Leaf,
    User,
    Users,
    MapPin,
    Phone,
    Mail,
    FileText,
    ShieldCheck,
    ScanFace,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Package,
    Star,
    Loader2,
    ExternalLink,
    LogIn,
    Crown,
    ShieldOff,
    BadgeCheck,
    ChevronRight,
    Hash,
    Building2,
    Calendar,
} from "lucide-react";
import { Button, adminFetch, toast } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface SupplierDetail {
    id: string;
    user_id: string;
    name: string;
    type: "individual_farmer" | "cooperative" | "wholesaler";
    contact_name: string;
    phone: string;
    email: string | null;
    description: string | null;
    logo_url: string | null;
    region: string;
    locality: string;
    address: string | null;
    // KYC docs
    identity_doc_url: string | null;
    rccm: string | null;
    nif: string | null;
    minader_cert_url: string | null;
    cooperative_number: string | null;
    // KYC status
    kyc_status: "pending" | "approved" | "rejected" | "suspended" | "documents_submitted";
    kyc_rejection_reason: string | null;
    kyc_verified_at: string | null;
    kyc_verified_by: string | null;
    // Face liveness
    kyc_face_verified: boolean | null;
    kyc_face_score: number | null;
    kyc_name_match: boolean | null;
    kyc_confidence: "high" | "medium" | "low" | null;
    // Profile
    listing_tier: "free" | "basic" | "premium";
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
    // Joined
    supplier_products?: { id: string; name: string; category: string; price_fcfa: number; is_active: boolean }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    individual_farmer: "Agriculteur individuel",
    cooperative: "Coopérative",
    wholesaler: "Grossiste",
};

const CONFIDENCE_LABELS: Record<string, string> = {
    high: "Haute confiance",
    medium: "Confiance moyenne",
    low: "Faible confiance",
};

function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(iso)
    );
}

// ── KYC badge (inline) ──────────────────────────────────────────────────────

function KycStatusPill({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        approved: { label: "Approuvé", cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", icon: <CheckCircle2 size={14} /> },
        rejected: { label: "Rejeté", cls: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20", icon: <XCircle size={14} /> },
        suspended: { label: "Suspendu", cls: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20", icon: <ShieldOff size={14} /> },
        documents_submitted: { label: "Docs soumis", cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20", icon: <ShieldCheck size={14} /> },
        pending: { label: "En attente", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 animate-pulse", icon: <Clock size={14} /> },
    };
    const cfg = map[status] ?? map.pending;
    return (
        <span className={cn("flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black border", cfg.cls)}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

// ── Face score bar ──────────────────────────────────────────────────────────

function FaceScoreBar({ score }: { score: number | null }) {
    if (score === null) return <span className="text-sm text-surface-400 font-medium">Non effectué</span>;
    const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
    const textColor = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
    return (
        <div className="flex items-center gap-4">
            <div className="flex-1 h-2.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                <motion.div
                    className={cn("h-full rounded-full", color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
            <span className={cn("text-2xl font-black tabular-nums w-16 text-right", textColor)}>
                {score}%
            </span>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminSupplierDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // KYC action state
    const [kycAction, setKycAction] = useState<"approve" | "reject" | "suspend" | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [kycLoading, setKycLoading] = useState(false);

    // Attribute edits
    const [attrLoading, setAttrLoading] = useState(false);

    // ── Fetch detail ─────────────────────────────────────────────────────

    const fetchSupplier = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminFetch(`/api/admin/marketplace/suppliers/${id}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
            setSupplier(json.supplier);
        } catch (err: any) {
            setError(err.message || "Impossible de charger le dossier");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchSupplier(); }, [fetchSupplier]);

    // ── KYC action ───────────────────────────────────────────────────────

    const submitKycAction = async () => {
        if (!kycAction) return;
        if ((kycAction === "reject" || kycAction === "suspend") && !rejectReason.trim()) {
            toast.error("Veuillez saisir un motif");
            return;
        }
        setKycLoading(true);
        try {
            const body: Record<string, string> = {
                kyc_status: kycAction === "approve" ? "approved" : kycAction === "reject" ? "rejected" : "suspended",
            };
            if (rejectReason.trim()) body.rejection_reason = rejectReason.trim();

            const res = await adminFetch(`/api/admin/marketplace/suppliers/${id}/kyc`, {
                method: "PATCH",
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Erreur");

            toast.success(json.message || "Statut KYC mis à jour");
            setKycAction(null);
            setRejectReason("");
            fetchSupplier();
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de l'action KYC");
        } finally {
            setKycLoading(false);
        }
    };

    // ── Attribute update ─────────────────────────────────────────────────

    const updateAttr = async (field: string, value: unknown) => {
        if (!supplier) return;
        setAttrLoading(true);
        try {
            const res = await adminFetch(`/api/admin/marketplace/suppliers/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ [field]: value }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setSupplier((prev) => prev ? { ...prev, [field]: value } : prev);
            toast.success("Mis à jour");
        } catch (err: any) {
            toast.error(err.message || "Erreur de mise à jour");
        } finally {
            setAttrLoading(false);
        }
    };

    // ── Impersonate ──────────────────────────────────────────────────────

    const impersonate = async () => {
        if (!supplier) return;
        try {
            const res = await adminFetch(`/api/admin/users/${supplier.user_id}/impersonate`, { method: "POST" });
            const json = await res.json();
            if (res.ok && json.magicLink) {
                toast.success("Ouverture du compte fournisseur…");
                window.open(json.magicLink, "_blank");
            } else {
                toast.error(json.error || "Échec");
            }
        } catch {
            toast.error("Erreur réseau");
        }
    };

    // ── Render ───────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error || !supplier) {
        return (
            <div className="flex flex-col items-center gap-6 py-32">
                <div className="w-20 h-20 rounded-[2.5rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                    <XCircle size={40} />
                </div>
                <p className="text-sm font-black text-red-500 uppercase tracking-widest">{error || "Introuvable"}</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={16} className="mr-2" /> Retour
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-16 max-w-5xl"
        >
            {/* ── Back + breadcrumb ───────────────────────────────────── */}
            <div className="flex items-center gap-3 text-xs font-bold text-surface-400 uppercase tracking-widest">
                <Link
                    href="/admin/suppliers"
                    className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Fournisseurs
                </Link>
                <ChevronRight size={12} />
                <span className="text-surface-600 dark:text-surface-300">{supplier.name}</span>
            </div>

            {/* ── Identity header ─────────────────────────────────────── */}
            <div className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
                {/* Gradient band */}
                <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }}
                    />
                </div>
                <div className="px-10 pb-8 -mt-12 flex flex-col md:flex-row md:items-end gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-surface-800 border-4 border-white dark:border-surface-900 shadow-xl flex items-center justify-center text-3xl font-black uppercase text-emerald-600 dark:text-emerald-400">
                        {supplier.name.charAt(0)}
                    </div>

                    <div className="flex-1 pb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                                {supplier.name}
                            </h1>
                            <p className="text-sm font-bold text-surface-400 mt-1">
                                {TYPE_LABELS[supplier.type]} · {supplier.region}, {supplier.locality}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <KycStatusPill status={supplier.kyc_status} />
                            <button
                                onClick={impersonate}
                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/20"
                            >
                                <LogIn size={14} /> Accéder
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Left col (2/3) ──────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Contact info */}
                    <Section title="Coordonnées" icon={<User size={18} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow icon={<User size={14} />} label="Contact" value={supplier.contact_name} />
                            <InfoRow icon={<Phone size={14} />} label="Téléphone" value={supplier.phone} />
                            <InfoRow icon={<Mail size={14} />} label="Email" value={supplier.email ?? "—"} />
                            <InfoRow icon={<MapPin size={14} />} label="Adresse" value={supplier.address ?? "—"} />
                            <InfoRow icon={<Calendar size={14} />} label="Inscrit le" value={formatDate(supplier.created_at)} />
                            <InfoRow icon={<Hash size={14} />} label="ID" value={`#${supplier.id.slice(0, 16)}`} mono />
                        </div>
                        {supplier.description && (
                            <div className="mt-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                                    {supplier.description}
                                </p>
                            </div>
                        )}
                    </Section>

                    {/* KYC documents */}
                    <Section title="Dossier KYC — Documents" icon={<FileText size={18} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DocRow
                                label="Pièce d'identité (CNI/Passeport)"
                                url={supplier.identity_doc_url}
                            />
                            <DocRow
                                label="Certificat MINADER"
                                url={supplier.minader_cert_url}
                            />
                            <InfoRow icon={<Building2 size={14} />} label="RCCM" value={supplier.rccm ?? "—"} />
                            <InfoRow icon={<Hash size={14} />} label="NIF" value={supplier.nif ?? "—"} />
                            {supplier.type === "cooperative" && (
                                <InfoRow icon={<Users size={14} />} label="N° Coopérative" value={supplier.cooperative_number ?? "—"} />
                            )}
                        </div>
                    </Section>

                    {/* Face liveness results */}
                    <Section title="Vérification Faciale (Face Liveness)" icon={<ScanFace size={18} />}>
                        {supplier.kyc_face_score === null ? (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                                <ScanFace size={20} className="text-surface-400" />
                                <p className="text-sm text-surface-400 font-medium">
                                    Vérification faciale non effectuée
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                                        Score de correspondance visage ↔ CNI
                                    </p>
                                    <FaceScoreBar score={supplier.kyc_face_score} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <BoolCard
                                        label="Visage vérifié"
                                        value={supplier.kyc_face_verified}
                                    />
                                    <BoolCard
                                        label="Nom concordant"
                                        value={supplier.kyc_name_match}
                                    />
                                    <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                                        <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                                            Confiance
                                        </p>
                                        <p className="text-sm font-black text-surface-900 dark:text-white">
                                            {supplier.kyc_confidence
                                                ? CONFIDENCE_LABELS[supplier.kyc_confidence]
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* KYC action panel */}
                    <Section title="Décision KYC" icon={<ShieldCheck size={18} />}>
                        {supplier.kyc_rejection_reason && (
                            <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
                                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                                        Motif de rejet/suspension
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                        {supplier.kyc_rejection_reason}
                                    </p>
                                </div>
                            </div>
                        )}

                        {supplier.kyc_verified_at && (
                            <p className="text-xs text-surface-400 font-medium mb-4">
                                Dernière décision le {formatDate(supplier.kyc_verified_at)}
                            </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 mb-4">
                            <button
                                onClick={() => setKycAction(kycAction === "approve" ? null : "approve")}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all",
                                    kycAction === "approve"
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                )}
                            >
                                <CheckCircle2 size={14} /> Approuver
                            </button>
                            <button
                                onClick={() => setKycAction(kycAction === "reject" ? null : "reject")}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all",
                                    kycAction === "reject"
                                        ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                                        : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20"
                                )}
                            >
                                <XCircle size={14} /> Rejeter
                            </button>
                            <button
                                onClick={() => setKycAction(kycAction === "suspend" ? null : "suspend")}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all",
                                    kycAction === "suspend"
                                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                                        : "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                                )}
                            >
                                <ShieldOff size={14} /> Suspendre
                            </button>
                        </div>

                        {/* Reason input for reject/suspend */}
                        <AnimatePresence>
                            {(kycAction === "reject" || kycAction === "suspend") && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder={
                                            kycAction === "reject"
                                                ? "Motif du rejet (obligatoire)…"
                                                : "Motif de la suspension (obligatoire)…"
                                        }
                                        rows={3}
                                        className="w-full px-5 py-4 mb-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-white font-medium placeholder:text-surface-400 focus:ring-4 focus:ring-red-500/10 outline-none resize-none transition-all"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Confirm button */}
                        <AnimatePresence>
                            {kycAction && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    className="flex gap-3"
                                >
                                    <Button
                                        onClick={submitKycAction}
                                        disabled={kycLoading}
                                        className={cn(
                                            "h-12 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg",
                                            kycAction === "approve"
                                                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                                : kycAction === "reject"
                                                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                                                : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                                        )}
                                    >
                                        {kycLoading ? (
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                        ) : null}
                                        {kycAction === "approve" ? "Confirmer l'approbation" : kycAction === "reject" ? "Confirmer le rejet" : "Confirmer la suspension"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setKycAction(null); setRejectReason(""); }}
                                        className="h-12 px-6 rounded-2xl font-black uppercase text-xs tracking-widest"
                                    >
                                        Annuler
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Section>

                    {/* Products */}
                    {supplier.supplier_products && supplier.supplier_products.length > 0 && (
                        <Section title={`Catalogue Produits (${supplier.supplier_products.length})`} icon={<Package size={18} />}>
                            <div className="space-y-2">
                                {supplier.supplier_products.slice(0, 10).map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 hover:border-emerald-500/30 transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-black text-surface-900 dark:text-white">{p.name}</p>
                                            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{p.category}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {p.price_fcfa?.toLocaleString("fr-FR")} FCFA
                                            </span>
                                            <span className={cn("w-2 h-2 rounded-full", p.is_active ? "bg-emerald-500" : "bg-surface-300")} />
                                        </div>
                                    </div>
                                ))}
                                {supplier.supplier_products.length > 10 && (
                                    <p className="text-xs text-center text-surface-400 font-medium py-2">
                                        + {supplier.supplier_products.length - 10} produits supplémentaires
                                    </p>
                                )}
                            </div>
                        </Section>
                    )}
                </div>

                {/* ── Right col (1/3) ─────────────────────────────────── */}
                <div className="space-y-6">
                    {/* Tier management */}
                    <SideCard title="Tier de mise en avant">
                        <div className="space-y-3">
                            {(["free", "basic", "premium"] as const).map((tier) => (
                                <button
                                    key={tier}
                                    onClick={() => updateAttr("listing_tier", tier)}
                                    disabled={attrLoading || supplier.listing_tier === tier}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest border transition-all",
                                        supplier.listing_tier === tier
                                            ? tier === "premium"
                                                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                                                : tier === "basic"
                                                ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                                : "bg-surface-800 text-white border-surface-800"
                                            : "bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-surface-200 dark:border-surface-700 hover:border-surface-400 dark:hover:border-surface-500"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {tier === "premium" && <Crown size={14} />}
                                        {tier}
                                    </span>
                                    {supplier.listing_tier === tier && (
                                        <CheckCircle2 size={14} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </SideCard>

                    {/* Featured toggle */}
                    <SideCard title="Mise en vedette">
                        <button
                            onClick={() => updateAttr("is_featured", !supplier.is_featured)}
                            disabled={attrLoading}
                            className={cn(
                                "w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all font-black text-sm uppercase tracking-widest",
                                supplier.is_featured
                                    ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                                    : "bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-surface-200 dark:border-surface-700 hover:border-amber-500/30"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Star size={16} fill={supplier.is_featured ? "currentColor" : "none"} />
                                {supplier.is_featured ? "En vedette" : "Pas en vedette"}
                            </span>
                            <div
                                className={cn(
                                    "w-10 h-5 rounded-full border-2 transition-all",
                                    supplier.is_featured
                                        ? "bg-white/30 border-white/40"
                                        : "bg-surface-200 dark:bg-surface-700 border-surface-200 dark:border-surface-700"
                                )}
                            >
                                <div className={cn("w-3 h-3 rounded-full bg-white mt-0.5 transition-all", supplier.is_featured ? "ml-[22px]" : "ml-0.5")} />
                            </div>
                        </button>
                    </SideCard>

                    {/* Active toggle */}
                    <SideCard title="Statut d'activité">
                        <button
                            onClick={() => updateAttr("is_active", !supplier.is_active)}
                            disabled={attrLoading}
                            className={cn(
                                "w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all font-black text-sm uppercase tracking-widest",
                                supplier.is_active
                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                    : "bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-surface-200 dark:border-surface-700 hover:border-emerald-500/30"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <BadgeCheck size={16} />
                                {supplier.is_active ? "Actif" : "Inactif"}
                            </span>
                            <div
                                className={cn(
                                    "w-10 h-5 rounded-full border-2 transition-all",
                                    supplier.is_active
                                        ? "bg-white/30 border-white/40"
                                        : "bg-surface-200 dark:bg-surface-700 border-surface-200 dark:border-surface-700"
                                )}
                            >
                                <div className={cn("w-3 h-3 rounded-full bg-white mt-0.5 transition-all", supplier.is_active ? "ml-[22px]" : "ml-0.5")} />
                            </div>
                        </button>
                    </SideCard>

                    {/* Quick info */}
                    <SideCard title="Récapitulatif">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-surface-400 font-medium">Produits</span>
                                <span className="font-black text-surface-900 dark:text-white">{supplier.supplier_products?.length ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-400 font-medium">Tier</span>
                                <span className="font-black text-surface-900 dark:text-white capitalize">{supplier.listing_tier}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-400 font-medium">Mis à jour</span>
                                <span className="font-black text-surface-900 dark:text-white">{formatDate(supplier.updated_at)}</span>
                            </div>
                        </div>
                    </SideCard>
                </div>
            </div>
        </motion.div>
    );
}

// ── Reusable layout sub-components ────────────────────────────────────────

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-8 py-5 border-b border-surface-100 dark:border-surface-800">
                {icon && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <h2 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-widest">
                    {title}
                </h2>
            </div>
            <div className="p-8">{children}</div>
        </div>
    );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                <h3 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
    mono,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                {icon}
                {label}
            </div>
            <p className={cn("text-sm font-bold text-surface-900 dark:text-white", mono && "font-mono text-xs")}>
                {value}
            </p>
        </div>
    );
}

function DocRow({ label, url }: { label: string; url: string | null }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{label}</p>
            {url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
                >
                    <ExternalLink size={13} />
                    Voir le document
                </a>
            ) : (
                <p className="text-sm font-medium text-surface-400">Non fourni</p>
            )}
        </div>
    );
}

function BoolCard({ label, value }: { label: string; value: boolean | null }) {
    return (
        <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">{label}</p>
            {value === null ? (
                <p className="text-sm font-black text-surface-400">—</p>
            ) : value ? (
                <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-black">Oui</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-red-500">
                    <XCircle size={16} />
                    <span className="text-sm font-black">Non</span>
                </div>
            )}
        </div>
    );
}

