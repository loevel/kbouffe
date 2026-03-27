"use client";

/**
 * Page Profil & KYC — Dashboard Fournisseur KBouffe
 *
 * Deux sections :
 *   1. Profil éditable : description, localité, adresse
 *      → PATCH /api/marketplace/suppliers/me
 *   2. Dossier KYC (lecture seule) : documents soumis, statut coloré
 *      → Message de contact si rejeté ou mise à jour nécessaire
 */

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
    User,
    FileText,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Info,
    Loader2,
    Save,
    ExternalLink,
    Building2,
    MapPin,
    Phone,
    Mail,
    Shield,
    Clock,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { useSupplier, type SupplierProfile } from "../SupplierContext";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(dateStr));
}

// ── KYC status badge ───────────────────────────────────────────────────────

const KYC_CONFIG = {
    pending: {
        label: "En attente de vérification",
        bg: "bg-amber-500/15 border-amber-500/25",
        text: "text-amber-300",
        icon: <Clock size={16} />,
    },
    documents_submitted: {
        label: "Documents soumis — en attente d'approbation",
        bg: "bg-blue-500/15 border-blue-500/25",
        text: "text-blue-300",
        icon: <Info size={16} />,
    },
    approved: {
        label: "Compte validé ✅",
        bg: "bg-emerald-500/15 border-emerald-500/25",
        text: "text-emerald-300",
        icon: <CheckCircle2 size={16} />,
    },
    rejected: {
        label: "Dossier refusé",
        bg: "bg-red-500/15 border-red-500/25",
        text: "text-red-300",
        icon: <XCircle size={16} />,
    },
    suspended: {
        label: "Compte suspendu",
        bg: "bg-red-500/15 border-red-500/25",
        text: "text-red-300",
        icon: <XCircle size={16} />,
    },
} as const;

function KycStatusBadge({ status }: { status: string }) {
    const cfg =
        KYC_CONFIG[status as keyof typeof KYC_CONFIG] ?? KYC_CONFIG.pending;
    return (
        <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border ${cfg.bg} ${cfg.text}`}
        >
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

// ── Section card ───────────────────────────────────────────────────────────

function SectionCard({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-900 rounded-2xl border border-white/8 overflow-hidden"
        >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
                    <Icon size={16} className="text-brand-400" />
                </div>
                <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </motion.div>
    );
}

// ── Info row (read-only) ───────────────────────────────────────────────────

function InfoRow({
    label,
    value,
    isLink,
}: {
    label: string;
    value: string | null;
    isLink?: boolean;
}) {
    if (!value) {
        return (
            <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <span className="text-sm text-surface-500">{label}</span>
                <span className="text-sm text-surface-600 italic">Non renseigné</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4">
            <span className="text-sm text-surface-500 shrink-0">{label}</span>
            {isLink ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors truncate max-w-[200px]"
                >
                    <span className="truncate">Voir le document</span>
                    <ExternalLink size={13} className="shrink-0" />
                </a>
            ) : (
                <span className="text-sm font-medium text-white text-right">{value}</span>
            )}
        </div>
    );
}

// ── Profile form ───────────────────────────────────────────────────────────

interface ProfileFormState {
    description: string;
    locality: string;
    address: string;
}

function ProfileForm({ supplier }: { supplier: SupplierProfile }) {
    const { refresh } = useSupplier();

    const [form, setForm] = useState<ProfileFormState>({
        description: supplier.description ?? "",
        locality: supplier.locality ?? "",
        address: supplier.address ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync if supplier updates
    useEffect(() => {
        setForm({
            description: supplier.description ?? "",
            locality: supplier.locality ?? "",
            address: supplier.address ?? "",
        });
    }, [supplier]);

    function update(field: keyof ProfileFormState, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSuccess(false);
        setError(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await authFetch("/api/marketplace/suppliers/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: form.description.trim() || undefined,
                    locality: form.locality.trim() || undefined,
                    address: form.address.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { message?: string };
                throw new Error(body?.message ?? `Erreur ${res.status}`);
            }

            setSuccess(true);
            await refresh();
            setTimeout(() => setSuccess(false), 4000);
        } catch (err: any) {
            setError(err?.message ?? "Erreur lors de la mise à jour.");
        } finally {
            setSaving(false);
        }
    }

    const inputClass =
        "w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Read-only header fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-800/60 border border-white/8">
                <div className="flex items-center gap-2 text-sm">
                    <Building2 size={15} className="text-surface-500 shrink-0" />
                    <span className="text-surface-500">Nom :</span>
                    <span className="text-white font-medium">{supplier.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <User size={15} className="text-surface-500 shrink-0" />
                    <span className="text-surface-500">Contact :</span>
                    <span className="text-white font-medium">{supplier.contact_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Phone size={15} className="text-surface-500 shrink-0" />
                    <span className="text-surface-500">Tél :</span>
                    <span className="text-white font-medium">{supplier.phone}</span>
                </div>
                {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                        <Mail size={15} className="text-surface-500 shrink-0" />
                        <span className="text-surface-500">Email :</span>
                        <span className="text-white font-medium">{supplier.email}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                    <MapPin size={15} className="text-surface-500 shrink-0" />
                    <span className="text-surface-500">Région :</span>
                    <span className="text-white font-medium">{supplier.region}</span>
                </div>
            </div>

            <p className="text-xs text-surface-500">
                Pour modifier le nom, le téléphone ou la région, contactez{" "}
                <a
                    href="mailto:support@kbouffe.com"
                    className="text-brand-400 hover:underline"
                >
                    support@kbouffe.com
                </a>
                .
            </p>

            {/* Editable fields */}
            <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Description de l'activité
                </label>
                <textarea
                    rows={4}
                    placeholder="Décrivez vos produits, votre méthode de culture, vos certifications…"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    className={`${inputClass} resize-none`}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Localité / Ville
                </label>
                <input
                    type="text"
                    placeholder="Ex : Bafoussam, Ngaoundéré…"
                    value={form.locality}
                    onChange={(e) => update("locality", e.target.value)}
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Adresse complète
                </label>
                <input
                    type="text"
                    placeholder="Quartier, rue, numéro…"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className={inputClass}
                />
            </div>

            {/* Success / error feedback */}
            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm"
                    role="status"
                >
                    <CheckCircle2 size={16} />
                    Profil mis à jour avec succès.
                </motion.div>
            )}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                    role="alert"
                >
                    <AlertTriangle size={16} />
                    {error}
                </motion.div>
            )}

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
                >
                    {saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Enregistrement…
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Enregistrer
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

// ── KYC section ────────────────────────────────────────────────────────────

function KycSection({ supplier }: { supplier: SupplierProfile }) {
    return (
        <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-surface-400 font-medium">Statut :</span>
                <KycStatusBadge status={supplier.kyc_status} />
            </div>

            {/* Rejection reason */}
            {supplier.kyc_status === "rejected" && supplier.kyc_rejection_reason && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                    role="alert"
                >
                    <XCircle size={17} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-0.5">Motif de refus</p>
                        <p className="text-red-400/80">{supplier.kyc_rejection_reason}</p>
                    </div>
                </motion.div>
            )}

            {/* Documents submitted */}
            <div className="rounded-xl border border-white/8 divide-y divide-white/5">
                <InfoRow
                    label="Pièce d'identité"
                    value={supplier.identity_doc_url}
                    isLink
                />
                <InfoRow label="RCCM" value={supplier.rccm} />
                <InfoRow label="NIF" value={supplier.nif} />
                <InfoRow label="N° agrément coopérative" value={supplier.cooperative_number} />
                <InfoRow
                    label="Certificat MINADER"
                    value={supplier.minader_cert_url}
                    isLink
                />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-surface-500">
                    <Clock size={14} />
                    <span>Inscrit le</span>
                    <span className="text-white font-medium">
                        {formatDate(supplier.created_at)}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-surface-500">
                    <Shield size={14} />
                    <span>Tier</span>
                    <span
                        className={`font-semibold capitalize ${
                            supplier.listing_tier === "premium"
                                ? "text-amber-400"
                                : supplier.listing_tier === "basic"
                                ? "text-blue-400"
                                : "text-surface-400"
                        }`}
                    >
                        {supplier.listing_tier}
                    </span>
                </div>
            </div>

            {/* Contact support notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-800 border border-white/8 text-sm text-surface-400">
                <Info size={16} className="text-surface-500 shrink-0 mt-0.5" />
                <p>
                    Pour mettre à jour vos documents KYC ou contester un refus, contactez{" "}
                    <a
                        href="mailto:support@kbouffe.com"
                        className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                    >
                        support@kbouffe.com
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ProfilPage() {
    const { supplier, loading } = useSupplier();

    if (loading) return null;

    if (!supplier) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-surface-400">
                    Impossible de charger votre profil. Actualisez la page.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Mon profil & KYC
                </h1>
                <p className="text-surface-400 text-sm mt-1">
                    Gérez vos informations et suivez l'état de votre vérification
                </p>
            </div>

            {/* Profile section */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <SectionCard title="Informations du profil" icon={User}>
                    <ProfileForm supplier={supplier} />
                </SectionCard>
            </motion.div>

            {/* KYC section */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
            >
                <SectionCard title="Dossier KYC" icon={FileText}>
                    <KycSection supplier={supplier} />
                </SectionCard>
            </motion.div>
        </div>
    );
}
