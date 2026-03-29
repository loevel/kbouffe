"use client";

/**
 * ProfileEditor — Éditeur complet du profil fournisseur
 *
 * 5 sections indépendantes, chacune avec son propre bouton Save :
 *  1. Identité visuelle   (logo + couverture)
 *  2. Description & spécialités
 *  3. Coordonnées & livraison
 *  4. Présence en ligne / réseaux sociaux
 *  5. Galerie de l'exploitation
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ImageIcon,
    FileText,
    MapPin,
    Globe,
    Images,
    Save,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    X,
    Plus,
    Camera,
    Upload,
    MessageCircle,
    Link,
    Facebook,
    Instagram,
    Trash2,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { useSupplier, type SupplierProfile } from "../SupplierContext";
import { useUploadImage } from "@/hooks/use-upload-image";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAMEROON_REGIONS = [
    "Adamaoua", "Centre", "Est", "Extrême-Nord", "Littoral",
    "Nord", "Nord-Ouest", "Ouest", "Sud", "Sud-Ouest",
];

const PAYMENT_OPTIONS = [
    { id: "mtn_money",    label: "MTN Money",   emoji: "📱" },
    { id: "orange_money", label: "Orange Money", emoji: "🟠" },
    { id: "cash",         label: "Espèces",      emoji: "💵" },
    { id: "virement",     label: "Virement",     emoji: "🏦" },
    { id: "cheque",       label: "Chèque",       emoji: "📋" },
];

const MAX_GALLERY = 10;
const MAX_SPECIALTIES = 15;

// ── Shared styles ─────────────────────────────────────────────────────────────

const INPUT = "w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all";

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionCard({
    title, icon: Icon, children,
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
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-brand-400" />
                </div>
                <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </motion.div>
    );
}

function Feedback({ success, error }: { success: boolean; error: string | null }) {
    return (
        <AnimatePresence mode="wait">
            {success && (
                <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm"
                >
                    <CheckCircle2 size={15} /> Enregistré avec succès.
                </motion.div>
            )}
            {error && (
                <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                >
                    <AlertTriangle size={15} /> {error}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function SaveButton({
    saving, dirty, onClick,
}: {
    saving: boolean;
    dirty: boolean;
    onClick: () => void;
}) {
    return (
        <div className="flex justify-end pt-2">
            <button
                type="button"
                onClick={onClick}
                disabled={saving || !dirty}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
        </div>
    );
}

// ── Section 1 : Identité visuelle ─────────────────────────────────────────────

function VisualSection({ supplier }: { supplier: SupplierProfile }) {
    const { refresh } = useSupplier();
    const { upload, uploading } = useUploadImage();
    const [logoUrl, setLogoUrl]   = useState(supplier.logo_url ?? "");
    const [coverUrl, setCoverUrl] = useState(supplier.cover_url ?? "");
    const [saving, setSaving]     = useState(false);
    const [success, setSuccess]   = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const logoRef  = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    const dirty =
        logoUrl  !== (supplier.logo_url  ?? "") ||
        coverUrl !== (supplier.cover_url ?? "");

    async function handleUpload(file: File, target: "logo" | "cover") {
        setError(null);
        const result = await upload(file);
        if (!result) { setError("Échec de l'upload."); return; }
        if (target === "logo")  setLogoUrl(result.url);
        if (target === "cover") setCoverUrl(result.url);
    }

    async function handleSave() {
        setSaving(true); setError(null); setSuccess(false);
        try {
            const res = await authFetch("/api/marketplace/suppliers/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    logo_url:  logoUrl  || null,
                    cover_url: coverUrl || null,
                }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erreur ${res.status}`);
            setSuccess(true);
            await refresh();
            setTimeout(() => setSuccess(false), 4000);
        } catch (e: any) {
            setError(e.message ?? "Erreur lors de la mise à jour.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <SectionCard title="Identité visuelle" icon={ImageIcon}>
            <div className="space-y-5">
                {/* Cover photo */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-300">Photo de couverture</label>
                    <div className="relative rounded-2xl overflow-hidden bg-surface-800 border border-white/8" style={{ paddingBottom: "28%" }}>
                        {coverUrl ? (
                            <img
                                src={coverUrl}
                                alt="Couverture"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-surface-600">
                                <ImageIcon size={24} />
                                <span className="text-xs">Bannière de votre exploitation</span>
                            </div>
                        )}

                        {/* Overlay buttons */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => coverRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-surface-900 text-xs font-semibold rounded-lg"
                            >
                                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {uploading ? "Upload…" : "Changer"}
                            </button>
                            {coverUrl && (
                                <button
                                    type="button"
                                    onClick={() => setCoverUrl("")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/80 text-white text-xs font-medium rounded-lg"
                                >
                                    <Trash2 size={11} /> Supprimer
                                </button>
                            )}
                        </div>
                        <input
                            ref={coverRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "cover")}
                        />
                    </div>
                    <p className="text-xs text-surface-500">Format recommandé : 1200 × 340 px (16:4.5). Max 8 Mo.</p>
                </div>

                {/* Logo / avatar */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-300">Photo de profil (logo)</label>
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-2xl bg-surface-800 border-2 border-white/10 overflow-hidden shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-surface-600">
                                    <Camera size={24} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => logoRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                {uploading ? "Upload en cours…" : "Changer la photo"}
                            </button>
                            {logoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setLogoUrl("")}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <X size={12} /> Supprimer
                                </button>
                            )}
                            <p className="text-xs text-surface-500">Format carré recommandé. Max 8 Mo.</p>
                        </div>
                        <input
                            ref={logoRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")}
                        />
                    </div>
                </div>

                <Feedback success={success} error={error} />
                <SaveButton saving={saving} dirty={dirty} onClick={handleSave} />
            </div>
        </SectionCard>
    );
}

// ── Section 2 : Description & spécialités ────────────────────────────────────

function DescriptionSection({ supplier }: { supplier: SupplierProfile }) {
    const { refresh } = useSupplier();
    const [description, setDescription]           = useState(supplier.description ?? "");
    const [specialties,  setSpecialties]           = useState<string[]>(supplier.specialties ?? []);
    const [processingDays, setProcessingDays]      = useState(supplier.processing_delay_days ?? "");
    const [tagInput, setTagInput]                  = useState("");
    const [saving, setSaving]   = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const dirty =
        description    !== (supplier.description ?? "")                    ||
        processingDays !== (supplier.processing_delay_days ?? "")          ||
        JSON.stringify(specialties) !== JSON.stringify(supplier.specialties ?? []);

    function addTag(raw: string) {
        const tag = raw.trim().replace(/,$/, "").trim();
        if (!tag || specialties.includes(tag) || specialties.length >= MAX_SPECIALTIES) return;
        setSpecialties(prev => [...prev, tag]);
        setTagInput("");
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(tagInput);
        }
        if (e.key === "Backspace" && tagInput === "" && specialties.length > 0) {
            setSpecialties(prev => prev.slice(0, -1));
        }
    }

    async function handleSave() {
        setSaving(true); setError(null); setSuccess(false);
        try {
            const res = await authFetch("/api/marketplace/suppliers/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim() || null,
                    specialties,
                    processing_delay_days: processingDays !== "" ? Number(processingDays) : null,
                }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erreur ${res.status}`);
            setSuccess(true);
            await refresh();
            setTimeout(() => setSuccess(false), 4000);
        } catch (e: any) {
            setError(e.message ?? "Erreur lors de la mise à jour.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <SectionCard title="Description & spécialités" icon={FileText}>
            <div className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-surface-300">Description de l'activité</label>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Décrivez vos produits, votre méthode de culture, vos certifications, votre histoire…"
                        className={`${INPUT} resize-none`}
                    />
                    <p className="text-xs text-surface-500">{description.length}/500 caractères</p>
                </div>

                {/* Specialties tag input */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-surface-300">
                        Spécialités <span className="text-surface-500 font-normal">(produits phares, méthodes)</span>
                    </label>
                    <div className="min-h-[48px] flex flex-wrap gap-2 p-2.5 bg-surface-800 border border-white/8 rounded-xl focus-within:border-brand-500/40 focus-within:ring-2 focus-within:ring-brand-500/50 transition-all">
                        {specialties.map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 bg-brand-500/15 text-brand-400 border border-brand-500/25 px-2.5 py-1 rounded-full text-xs font-medium"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => setSpecialties(prev => prev.filter(t => t !== tag))}
                                    className="hover:text-red-400 transition-colors ml-0.5"
                                >
                                    <X size={11} />
                                </button>
                            </span>
                        ))}
                        {specialties.length < MAX_SPECIALTIES && (
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={() => tagInput.trim() && addTag(tagInput)}
                                placeholder={specialties.length === 0 ? "Maïs jaune, Tomates bio, Agriculture raisonnée…" : "Ajouter…"}
                                className="flex-1 min-w-[160px] bg-transparent text-white text-sm placeholder:text-surface-600 outline-none"
                            />
                        )}
                    </div>
                    <p className="text-xs text-surface-500">Appuyez sur Entrée ou virgule pour ajouter. Max {MAX_SPECIALTIES} tags.</p>
                </div>

                {/* Processing delay */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-surface-300">Délai de traitement des commandes</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min={0}
                            max={14}
                            value={processingDays}
                            onChange={e => setProcessingDays(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="2"
                            className={`${INPUT} w-28`}
                        />
                        <span className="text-sm text-surface-400">jours ouvrables avant expédition</span>
                    </div>
                </div>

                <Feedback success={success} error={error} />
                <SaveButton saving={saving} dirty={dirty} onClick={handleSave} />
            </div>
        </SectionCard>
    );
}

// ── Section 3 : Coordonnées & livraison ──────────────────────────────────────

function DeliverySection({ supplier }: { supplier: SupplierProfile }) {
    const { refresh } = useSupplier();
    const [locality,      setLocality]      = useState(supplier.locality ?? "");
    const [address,       setAddress]       = useState(supplier.address ?? "");
    const [deliveryDays,  setDeliveryDays]  = useState(supplier.delivery_delay_days ?? "");
    const [zones,         setZones]         = useState<string[]>(supplier.delivery_zones ?? []);
    const [payments,      setPayments]      = useState<string[]>(supplier.payment_methods ?? []);
    const [saving,  setSaving]  = useState(false);
    const [success, setSuccess] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    const dirty =
        locality     !== (supplier.locality ?? "")                              ||
        address      !== (supplier.address ?? "")                               ||
        deliveryDays !== (supplier.delivery_delay_days ?? "")                   ||
        JSON.stringify(zones)    !== JSON.stringify(supplier.delivery_zones ?? [])   ||
        JSON.stringify(payments) !== JSON.stringify(supplier.payment_methods ?? []);

    function toggleZone(z: string) {
        setZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]);
    }

    function togglePayment(id: string) {
        setPayments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    async function handleSave() {
        setSaving(true); setError(null); setSuccess(false);
        try {
            const res = await authFetch("/api/marketplace/suppliers/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locality: locality.trim() || null,
                    address: address.trim() || null,
                    delivery_delay_days: deliveryDays !== "" ? Number(deliveryDays) : null,
                    delivery_zones: zones,
                    payment_methods: payments,
                }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erreur ${res.status}`);
            setSuccess(true);
            await refresh();
            setTimeout(() => setSuccess(false), 4000);
        } catch (e: any) {
            setError(e.message ?? "Erreur lors de la mise à jour.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <SectionCard title="Coordonnées & livraison" icon={MapPin}>
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-surface-300">Localité / Ville</label>
                        <input
                            type="text"
                            value={locality}
                            onChange={e => setLocality(e.target.value)}
                            placeholder="Ex : Bafoussam, Ngaoundéré…"
                            className={INPUT}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-surface-300">Délai de livraison moyen</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={deliveryDays}
                                onChange={e => setDeliveryDays(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="3"
                                className={`${INPUT} w-24`}
                            />
                            <span className="text-sm text-surface-400 shrink-0">jours ouvrables</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-surface-300">Adresse complète</label>
                    <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Quartier, rue, numéro…"
                        className={INPUT}
                    />
                </div>

                {/* Delivery zones */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-300">Zones de livraison</label>
                    <p className="text-xs text-surface-500">Sélectionnez les régions où vous livrez ou pouvez expédier.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CAMEROON_REGIONS.map(region => {
                            const checked = zones.includes(region);
                            return (
                                <button
                                    key={region}
                                    type="button"
                                    onClick={() => toggleZone(region)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                                        checked
                                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                                            : "bg-surface-800 border-white/8 text-surface-400 hover:border-surface-600"
                                    }`}
                                >
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${checked ? "bg-green-500 border-green-500" : "border-surface-600"}`}>
                                        {checked && <span className="block w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    {region}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Payment methods */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-300">Modes de paiement acceptés</label>
                    <div className="flex flex-wrap gap-2">
                        {PAYMENT_OPTIONS.map(opt => {
                            const checked = payments.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => togglePayment(opt.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                                        checked
                                            ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                                            : "bg-surface-800 border-white/8 text-surface-400 hover:border-surface-600"
                                    }`}
                                >
                                    <span>{opt.emoji}</span>
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <Feedback success={success} error={error} />
                <SaveButton saving={saving} dirty={dirty} onClick={handleSave} />
            </div>
        </SectionCard>
    );
}

// ── Section 4 : Présence en ligne ─────────────────────────────────────────────

function SocialSection({ supplier }: { supplier: SupplierProfile }) {
    const { refresh } = useSupplier();
    const init = supplier.social_links ?? {};
    const [form, setForm] = useState({
        whatsapp:  init.whatsapp  ?? "",
        facebook:  init.facebook  ?? "",
        instagram: init.instagram ?? "",
        website:   init.website   ?? "",
    });
    const [saving,  setSaving]  = useState(false);
    const [success, setSuccess] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    const dirty =
        form.whatsapp  !== (init.whatsapp  ?? "") ||
        form.facebook  !== (init.facebook  ?? "") ||
        form.instagram !== (init.instagram ?? "") ||
        form.website   !== (init.website   ?? "");

    function set(k: keyof typeof form, v: string) {
        setForm(f => ({ ...f, [k]: v }));
    }

    async function handleSave() {
        setSaving(true); setError(null); setSuccess(false);
        try {
            const social: Record<string, string> = {};
            if (form.whatsapp.trim())  social.whatsapp  = form.whatsapp.trim();
            if (form.facebook.trim())  social.facebook  = form.facebook.trim();
            if (form.instagram.trim()) social.instagram = form.instagram.trim();
            if (form.website.trim())   social.website   = form.website.trim();

            const res = await authFetch("/api/marketplace/suppliers/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ social_links: social }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erreur ${res.status}`);
            setSuccess(true);
            await refresh();
            setTimeout(() => setSuccess(false), 4000);
        } catch (e: any) {
            setError(e.message ?? "Erreur lors de la mise à jour.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <SectionCard title="Présence en ligne" icon={Globe}>
            <div className="space-y-4">
                <p className="text-sm text-surface-400">
                    Ces informations sont affichées sur votre fiche publique pour faciliter le contact direct avec les restaurants.
                </p>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-surface-300">
                        <MessageCircle size={14} className="text-[#25D366]" /> WhatsApp Business
                    </label>
                    <div className="flex items-center">
                        <span className="px-3.5 py-2.5 bg-surface-700 border border-r-0 border-white/8 rounded-l-xl text-sm text-surface-400">+237</span>
                        <input
                            type="tel"
                            value={form.whatsapp}
                            onChange={e => set("whatsapp", e.target.value)}
                            placeholder="6XXXXXXXX"
                            className={`${INPUT} rounded-l-none border-l-0 flex-1`}
                        />
                    </div>
                    {form.whatsapp && (
                        <a href={`https://wa.me/237${form.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#25D366] hover:underline">
                            <Link size={10} /> Tester le lien WhatsApp
                        </a>
                    )}
                </div>

                {/* Facebook */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-surface-300">
                        <Facebook size={14} className="text-blue-400" /> Page Facebook
                    </label>
                    <input
                        type="url"
                        value={form.facebook}
                        onChange={e => set("facebook", e.target.value)}
                        placeholder="https://facebook.com/ma-page"
                        className={INPUT}
                    />
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-surface-300">
                        <Instagram size={14} className="text-pink-400" /> Instagram
                    </label>
                    <div className="flex items-center">
                        <span className="px-3.5 py-2.5 bg-surface-700 border border-r-0 border-white/8 rounded-l-xl text-sm text-surface-400">@</span>
                        <input
                            type="text"
                            value={form.instagram}
                            onChange={e => set("instagram", e.target.value.replace(/^@/, ""))}
                            placeholder="mon_profil"
                            className={`${INPUT} rounded-l-none border-l-0 flex-1`}
                        />
                    </div>
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-surface-300">
                        <Globe size={14} className="text-surface-400" /> Site web
                    </label>
                    <input
                        type="url"
                        value={form.website}
                        onChange={e => set("website", e.target.value)}
                        placeholder="https://www.monsite.cm"
                        className={INPUT}
                    />
                </div>

                <Feedback success={success} error={error} />
                <SaveButton saving={saving} dirty={dirty} onClick={handleSave} />
            </div>
        </SectionCard>
    );
}

// ── Section 5 : Galerie ───────────────────────────────────────────────────────

function GallerySection({ supplier }: { supplier: SupplierProfile }) {
    const { refresh } = useSupplier();
    const { upload, uploading } = useUploadImage();
    const [gallery, setGallery] = useState<string[]>(supplier.gallery ?? []);
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const [saving,  setSaving]  = useState(false);
    const [success, setSuccess] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const dirty = JSON.stringify(gallery) !== JSON.stringify(supplier.gallery ?? []);

    async function handleFiles(files: FileList | null) {
        if (!files) return;
        const remaining = MAX_GALLERY - gallery.length;
        const toUpload  = Array.from(files).slice(0, remaining);
        for (const file of toUpload) {
            setUploadingIdx(gallery.length);
            const result = await upload(file);
            if (result) setGallery(prev => [...prev, result.url]);
        }
        setUploadingIdx(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    function removePhoto(idx: number) {
        setGallery(prev => prev.filter((_, i) => i !== idx));
    }

    async function handleSave() {
        setSaving(true); setError(null); setSuccess(false);
        try {
            const res = await authFetch("/api/marketplace/suppliers/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gallery }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erreur ${res.status}`);
            setSuccess(true);
            await refresh();
            setTimeout(() => setSuccess(false), 4000);
        } catch (e: any) {
            setError(e.message ?? "Erreur lors de la mise à jour.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <SectionCard title="Galerie de l'exploitation" icon={Images}>
            <div className="space-y-4">
                <p className="text-sm text-surface-400">
                    Montrez votre ferme, vos cultures, votre environnement de travail. Ces photos inspirent confiance aux restaurants.
                    Maximum {MAX_GALLERY} photos.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {/* Existing photos */}
                    {gallery.map((url, idx) => (
                        <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-800 border border-white/8">
                            <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removePhoto(idx)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={11} />
                            </button>
                            {idx === 0 && (
                                <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                    Principale
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Upload slot */}
                    {gallery.length < MAX_GALLERY && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            className="aspect-square rounded-xl border-2 border-dashed border-surface-700 hover:border-brand-500/40 bg-surface-800/50 hover:bg-surface-800 flex flex-col items-center justify-center gap-1.5 text-surface-600 hover:text-surface-400 transition-all"
                        >
                            {uploadingIdx !== null
                                ? <Loader2 size={20} className="animate-spin text-brand-400" />
                                : <><Plus size={20} /><span className="text-xs">Ajouter</span></>
                            }
                        </button>
                    )}
                </div>

                <p className="text-xs text-surface-500">
                    {gallery.length}/{MAX_GALLERY} photos · La première photo sera affichée en avant-plan.
                </p>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                />

                <Feedback success={success} error={error} />
                <SaveButton saving={saving} dirty={dirty} onClick={handleSave} />
            </div>
        </SectionCard>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProfileEditor({ supplier }: { supplier: SupplierProfile }) {
    return (
        <div className="space-y-6">
            <VisualSection      supplier={supplier} />
            <DescriptionSection supplier={supplier} />
            <DeliverySection    supplier={supplier} />
            <SocialSection      supplier={supplier} />
            <GallerySection     supplier={supplier} />
        </div>
    );
}
