"use client";

/**
 * ProfilePreview -- Modal de preview du profil tel que vu par un restaurant
 *
 * - Bouton "Voir mon profil" ouvre la modale
 * - 2 tabs: Desktop (1280x800) | Mobile (375x812)
 * - Preview inclut: avatar, nom, description, galerie, badges, social links
 * - Edit button pour revenir au ProfileEditor
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye,
    X,
    Monitor,
    Smartphone,
    Edit3,
    Star,
    MapPin,
    Globe,
    MessageCircle,
    Facebook,
    Instagram,
    Link as LinkIcon,
    Package,
    Truck,
    CreditCard,
    ChevronRight,
    Store,
    CheckCircle2,
} from "lucide-react";
import type { SupplierProfile } from "../../SupplierContext";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProfilePreviewProps {
    supplier: SupplierProfile;
}

type ViewMode = "desktop" | "mobile";

// ── Preview content (what a restaurant sees) ──────────────────────────────

function PreviewContent({
    supplier,
    isMobile,
}: {
    supplier: SupplierProfile;
    isMobile: boolean;
}) {
    const socialLinks = supplier.social_links ?? {};

    return (
        <div className={`bg-white text-gray-900 min-h-full ${isMobile ? "text-sm" : ""}`}>
            {/* Cover */}
            <div className="relative">
                <div
                    className={`w-full bg-gradient-to-br from-emerald-500 to-emerald-700 ${
                        isMobile ? "h-32" : "h-48"
                    }`}
                    style={
                        supplier.cover_url
                            ? { backgroundImage: `url(${supplier.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                            : undefined
                    }
                />

                {/* Avatar */}
                <div
                    className={`absolute ${
                        isMobile ? "-bottom-8 left-4" : "-bottom-10 left-8"
                    }`}
                >
                    <div
                        className={`${
                            isMobile ? "w-16 h-16" : "w-20 h-20"
                        } rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden`}
                    >
                        {supplier.logo_url ? (
                            <img
                                src={supplier.logo_url}
                                alt={supplier.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Store size={isMobile ? 24 : 32} className="text-gray-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Name & info */}
            <div className={`${isMobile ? "pt-12 px-4" : "pt-14 px-8"}`}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className={`font-bold text-gray-900 ${isMobile ? "text-lg" : "text-2xl"}`}>
                            {supplier.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                            <MapPin size={13} />
                            <span>{supplier.locality}, {supplier.region}</span>
                        </div>
                    </div>
                    {supplier.kyc_status === "approved" && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200 shrink-0">
                            <CheckCircle2 size={12} />
                            Verifie
                        </span>
                    )}
                </div>

                {/* Description */}
                {supplier.description && (
                    <p className={`text-gray-600 mt-3 leading-relaxed ${isMobile ? "text-xs" : "text-sm"}`}>
                        {supplier.description}
                    </p>
                )}

                {/* Stats row */}
                <div className={`flex items-center gap-4 mt-4 ${isMobile ? "gap-3" : "gap-6"}`}>
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{supplier.product_count ?? 0}</p>
                        <p className="text-[11px] text-gray-500">Produits</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{supplier.delivery_zones?.length ?? 0}</p>
                        <p className="text-[11px] text-gray-500">Zones</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <span className="text-lg font-bold text-gray-900">4.3</span>
                        </div>
                        <p className="text-[11px] text-gray-500">Rating</p>
                    </div>
                </div>

                {/* Specialties */}
                {supplier.specialties && supplier.specialties.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Specialites</p>
                        <div className="flex flex-wrap gap-1.5">
                            {supplier.specialties.map((s) => (
                                <span
                                    key={s}
                                    className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivery info */}
                <div className={`mt-4 grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-2 gap-3"}`}>
                    {supplier.delivery_delay_days !== null && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                            <Truck size={15} className="text-gray-400" />
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Delai de livraison</p>
                                <p className="text-[11px] text-gray-500">{supplier.delivery_delay_days} jours</p>
                            </div>
                        </div>
                    )}
                    {supplier.payment_methods && supplier.payment_methods.length > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                            <CreditCard size={15} className="text-gray-400" />
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Paiement</p>
                                <p className="text-[11px] text-gray-500">{supplier.payment_methods.join(", ")}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gallery */}
                {supplier.gallery && supplier.gallery.length > 0 && (
                    <div className="mt-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Galerie</p>
                        <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
                            {supplier.gallery.slice(0, isMobile ? 4 : 6).map((url, i) => (
                                <div
                                    key={i}
                                    className="aspect-square rounded-lg bg-gray-100 overflow-hidden"
                                >
                                    <img
                                        src={url}
                                        alt={`Photo ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Social links */}
                {Object.keys(socialLinks).length > 0 && (
                    <div className="mt-5 pb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Liens</p>
                        <div className="flex flex-wrap gap-2">
                            {socialLinks.whatsapp && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                                    <MessageCircle size={12} />
                                    WhatsApp
                                </span>
                            )}
                            {socialLinks.facebook && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                                    <Facebook size={12} />
                                    Facebook
                                </span>
                            )}
                            {socialLinks.instagram && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 text-xs font-medium border border-pink-200">
                                    <Instagram size={12} />
                                    Instagram
                                </span>
                            )}
                            {socialLinks.website && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                                    <Globe size={12} />
                                    Site web
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty gallery/social placeholder */}
                {(!supplier.gallery || supplier.gallery.length === 0) &&
                 Object.keys(socialLinks).length === 0 && (
                    <div className="mt-5 pb-6 text-center py-8">
                        <p className="text-xs text-gray-400">
                            Completez votre profil pour attirer plus de restaurants
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────

export function ProfilePreview({ supplier }: ProfilePreviewProps) {
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("desktop");

    return (
        <>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/8 text-surface-300 hover:text-white text-sm font-medium transition-all"
            >
                <Eye size={15} />
                Voir mon profil
            </button>

            {/* Modal */}
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-surface-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                            style={{
                                width: "min(95vw, 1340px)",
                                maxHeight: "90vh",
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Eye size={16} className="text-brand-400" />
                                    <span className="text-sm font-bold text-white">
                                        Apercu du profil
                                    </span>
                                    <span className="text-xs text-surface-500">
                                        Vue restaurant
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* View mode tabs */}
                                    <div className="flex rounded-lg bg-surface-800 border border-white/8 p-0.5">
                                        <button
                                            onClick={() => setViewMode("desktop")}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                viewMode === "desktop"
                                                    ? "bg-brand-500/15 text-brand-300"
                                                    : "text-surface-400 hover:text-white"
                                            }`}
                                        >
                                            <Monitor size={12} />
                                            Desktop
                                        </button>
                                        <button
                                            onClick={() => setViewMode("mobile")}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                viewMode === "mobile"
                                                    ? "bg-brand-500/15 text-brand-300"
                                                    : "text-surface-400 hover:text-white"
                                            }`}
                                        >
                                            <Smartphone size={12} />
                                            Mobile
                                        </button>
                                    </div>

                                    {/* Edit button */}
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/20 text-brand-300 text-xs font-medium transition-all"
                                    >
                                        <Edit3 size={11} />
                                        Modifier
                                    </button>

                                    {/* Close */}
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview area */}
                            <div className="flex-1 overflow-auto p-5 flex justify-center bg-surface-950/50">
                                <div
                                    className={`transition-all duration-300 ${
                                        viewMode === "mobile"
                                            ? "w-[375px] min-h-[812px]"
                                            : "w-full max-w-[1280px] min-h-[800px]"
                                    } bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200`}
                                >
                                    <PreviewContent
                                        supplier={supplier}
                                        isMobile={viewMode === "mobile"}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
