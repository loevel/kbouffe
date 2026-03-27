"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Store,
    CheckCircle,
    XCircle,
    Star,
    ShoppingBag,
    Users,
    MapPin,
    Crown,
    Globe,
    Phone,
    Mail,
    FileText,
    ExternalLink,
    AlertCircle,
    Clock,
    Shield,
    Camera,
    Info,
    ChevronRight,
    Search,
    Edit2,
    Save,
    X,
    Trash2,
    AlertTriangle,
    Puzzle,
    CalendarDays,
    Megaphone,
    Truck,
    Utensils,
    Brain,
    Package,
    Activity,
    Zap,
    Send,
    FileSearch,
    PenSquare,
    Loader2,
} from "lucide-react";
import { Badge, Button, toast, adminFetch, Modal, ModalFooter } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ProductsTable, CategoryList, MenuStats, useProducts } from "@kbouffe/module-catalog";

interface RestaurantDetail {
    id: string;
    name: string;
    slug: string;
    description: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    lat: number;
    lng: number;
    address: string;
    city: string;
    phone: string | null;
    email: string | null;
    cuisineType: string;
    priceRange: number;
    rating: number;
    reviewCount: number;
    orderCount: number;
    favoritesCount: number;
    isActive: boolean;
    isVerified: boolean;
    isPremium: boolean;
    isSponsored: boolean;
    createdAt: string;
    owner: { id: string; email: string; fullName: string; phone: string } | null;
    teamCount: number;

    // KYC Fields
    kycNiu: string | null;
    kycRccm: string | null;
    kycNiuUrl: string | null;
    kycRccmUrl: string | null;
    kycIdUrl: string | null;
    kycStatus: "pending" | "approved" | "rejected";
    kycRejectionReason: string | null;
    kycSubmittedAt: string | null;
}

interface TeamMember {
    id: string;
    userId: string;
    email: string;
    fullName: string | null;
    role: string;
    status: string;
    createdAt: string;
    avatarUrl: string | null;
    phone: string | null;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function AdminRestaurantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "team" | "catalog" | "modules" | "ia-packs">("overview");

    // Modules state
    const [modules, setModules] = useState<Array<{
        id: string; name: string; description: string; icon: string; isActive: boolean;
    }>>([]);
    const [loadingModules, setLoadingModules] = useState(false);
    const [togglingModule, setTogglingModule] = useState<string | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // IA & Packs state
    type PacksUsageData = {
        packs: any[];
        aiUsage: any[];
        summary: { activePacks: number; totalPacks: number; todayCalls: number; monthCalls: number; totalCostFCFA: number };
    };
    const [packsUsage, setPacksUsage] = useState<PacksUsageData | null>(null);
    const [loadingPacksUsage, setLoadingPacksUsage] = useState(false);
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<RestaurantDetail>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Deletion State
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await adminFetch(`/api/admin/restaurants/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setRestaurant(data);
                    setEditForm(data);
                }

                // Fetch members
                setLoadingMembers(true);
                const memRes = await adminFetch(`/api/admin/restaurants/${id}/members`);
                if (memRes.ok) {
                    const data = await memRes.json();
                    setMembers(data.members || []);
                }

                // Fetch modules
                setLoadingModules(true);
                const modRes = await adminFetch(`/api/admin/restaurants/${id}/modules`);
                if (modRes.ok) {
                    const data = await modRes.json();
                    setModules(data.modules || []);
                }

                // Fetch IA & packs usage
                setLoadingPacksUsage(true);
                const puRes = await adminFetch(`/api/admin/restaurants/${id}/packs-usage`);
                if (puRes.ok) {
                    const data = await puRes.json();
                    setPacksUsage(data);
                }
            } catch (err) {
                console.error("Failed to fetch restaurant details:", err);
                toast.error("Échec du chargement du restaurant");
            } finally {
                setLoading(false);
                setLoadingMembers(false);
                setLoadingModules(false);
                setLoadingPacksUsage(false);
            }
        })();
    }, [id]);

    const toggleModule = async (moduleId: string, isActive: boolean) => {
        setTogglingModule(moduleId);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${id}/modules`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ moduleId, isActive }),
            });
            if (res.ok) {
                setModules(prev => prev.map(m => m.id === moduleId ? { ...m, isActive } : m));
                toast.success(isActive ? "Module activé" : "Module désactivé");
            } else {
                toast.error("Erreur lors de la mise à jour");
            }
        } catch {
            toast.error("Une erreur est survenue");
        } finally {
            setTogglingModule(null);
        }
    };

    const updateRestaurant = async (updates: Partial<RestaurantDetail>) => {
        if (!restaurant) return;
        setToggling(true);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${id}`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const updatedData = await res.json();
                setRestaurant({ ...restaurant, ...updatedData, ...updates });
                if (updates.kycStatus === "approved") {
                    setRestaurant(prev => prev ? { ...prev, isVerified: true } : null);
                }
                toast.success("Mise à jour réussie");
            } else {
                toast.error("Échec de la mise à jour");
            }
        } catch (err) {
            toast.error("Une erreur est survenue");
        } finally {
            setToggling(false);
        }
    };

    const handleSave = async () => {
        if (!restaurant) return;
        setIsSaving(true);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${id}`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                setRestaurant({ ...restaurant, ...editForm });
                setIsEditing(false);
                toast.success("Informations enregistrées");
            } else {
                toast.error("Erreur lors de l'enregistrement");
            }
        } catch (err) {
            toast.error("Une erreur est survenue");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteRestaurant = async () => {
        if (!restaurant) return;
        setIsDeleting(true);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success("Restaurant supprimé");
                router.push("/admin/restaurants");
            } else {
                toast.error("Échec de la suppression");
            }
        } catch (err) {
            toast.error("Une erreur est survenue");
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleField = (field: string, value: boolean) => {
        updateRestaurant({ [field]: value });
    };

    const handleVerify = () => {
        updateRestaurant({ kycStatus: "approved", isVerified: true });
    };

    const handleReject = () => {
        if (!rejectionReason) {
            alert("Veuillez fournir un motif de rejet.");
            return;
        }
        updateRestaurant({ kycStatus: "rejected", kycRejectionReason: rejectionReason });
        setShowRejectionInput(false);
    };

    const updateMember = async (memberId: string, updates: Partial<TeamMember>) => {
        setToggling(true);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${id}/members/${memberId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));
            }
        } finally {
            setToggling(false);
        }
    };

    const revokeMember = async (memberId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir révoquer l'accès de ce membre ?")) return;
        setToggling(true);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${id}/members/${memberId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: "revoked" } : m));
            }
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-surface-500 animate-pulse">Chargement des détails du restaurant...</p>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24"
            >
                <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} className="text-surface-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Restaurant introuvable</h2>
                <p className="text-surface-500 mb-8 max-w-sm mx-auto">
                    Le restaurant que vous recherchez n'existe pas ou a été supprimé.
                </p>
                <Link href="/admin/restaurants">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft size={16} /> Retour à la liste
                    </Button>
                </Link>
            </motion.div>
        );
    }

    const r = restaurant;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved": return <Badge variant="success" className="gap-1.5 px-3 py-1"><CheckCircle size={14} /> Vérifié</Badge>;
            case "rejected": return <Badge variant="danger" className="gap-1.5 px-3 py-1"><XCircle size={14} /> Rejeté</Badge>;
            default: return <Badge variant="warning" className="gap-1.5 px-3 py-1 animate-pulse"><Clock size={14} /> En attente</Badge>;
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto space-y-8 pb-12"
        >
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <Link
                    href="/admin/restaurants"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-brand-500 transition-all"
                >
                    <div className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 group-hover:bg-brand-500/10 transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    Retour à la liste
                </Link>

                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditForm(restaurant);
                                }}
                                className="gap-2"
                                disabled={isSaving}
                            >
                                <X size={14} /> Annuler
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handleSave}
                                className="gap-2 bg-brand-500 text-white"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={14} />
                                )}
                                Enregistrer
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsEditing(true)}
                            className="gap-2"
                        >
                            <Edit2 size={14} /> Modifier
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                        <Search size={14} /> Voir sur la plateforme
                    </Button>
                </div>
            </div>

            {/* Main Header Card */}
            <motion.div 
                variants={itemVariants}
                className="relative overflow-hidden bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm"
            >
                {/* Cover Pattern / Backdrop */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border-b border-surface-100 dark:border-surface-800" />
                
                <div className="relative p-6 pt-12 md:p-8 md:pt-12">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                        {/* Logo */}
                        <div className="relative -mt-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white dark:bg-surface-800 shadow-xl border-4 border-white dark:border-surface-900 flex items-center justify-center overflow-hidden">
                                {r.logoUrl ? (
                                    <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Store size={48} className="text-surface-300" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 p-2 bg-brand-500 rounded-xl shadow-lg border-4 border-white dark:border-surface-900 text-white">
                                {r.isPremium ? <Crown size={16} /> : <Store size={16} />}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-3 py-1 focus:ring-2 focus:ring-brand-500 outline-none w-full max-w-md"
                                        placeholder="Nom du restaurant"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">{r.name}</h1>
                                )}
                                {getStatusBadge(r.kycStatus)}
                            </div>
                            <div className="flex items-center gap-4 text-surface-500 text-sm flex-wrap">
                                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-500" /> {r.city}, {r.address}</span>
                                <span className="w-1 h-1 rounded-full bg-surface-300" />
                                <span className="flex items-center gap-1.5"><ShoppingBag size={14} className="text-brand-500" /> {r.cuisineType}</span>
                                <span className="w-1 h-1 rounded-full bg-surface-300" />
                                <span className="font-mono text-xs opacity-70">ID: {r.id.slice(0, 8)}...</span>
                            </div>
                        </div>

                        {/* Quick Stats Overlay */}
                        <div className="flex items-center gap-2 self-stretch md:self-auto p-1.5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800">
                            <div className="px-4 py-2 text-center border-r border-surface-200 dark:border-surface-700">
                                <p className="text-xl font-bold text-surface-900 dark:text-white">{r.rating?.toFixed(1) || "—"}</p>
                                <p className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">Rating</p>
                            </div>
                            <div className="px-4 py-2 text-center border-r border-surface-200 dark:border-surface-700">
                                <p className="text-xl font-bold text-surface-900 dark:text-white text-brand-500">{r.orderCount || 0}</p>
                                <p className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">Ventes</p>
                            </div>
                            <div className="px-4 py-2 text-center">
                                <p className="text-xl font-bold text-surface-900 dark:text-white text-red-500">{r.favoritesCount || 0}</p>
                                <p className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">Favoris</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={cn(
                        "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === "overview" 
                            ? "bg-white dark:bg-surface-700 text-brand-500 shadow-sm" 
                            : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    )}
                >
                    Vue d'ensemble
                </button>
                <button
                    onClick={() => setActiveTab("team")}
                    className={cn(
                        "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === "team" 
                            ? "bg-white dark:bg-surface-700 text-brand-500 shadow-sm" 
                            : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    )}
                >
                    Équipe ({members.filter(m => m.status === "active").length})
                </button>
                <button
                    onClick={() => setActiveTab("catalog")}
                    className={cn(
                        "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === "catalog"
                            ? "bg-white dark:bg-surface-700 text-brand-500 shadow-sm"
                            : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    )}
                >
                    Catalogue
                </button>
                <button
                    onClick={() => setActiveTab("modules")}
                    className={cn(
                        "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5",
                        activeTab === "modules"
                            ? "bg-white dark:bg-surface-700 text-brand-500 shadow-sm"
                            : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    )}
                >
                    <Puzzle size={14} />
                    Modules
                </button>
                <button
                    onClick={() => setActiveTab("ia-packs")}
                    className={cn(
                        "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5",
                        activeTab === "ia-packs"
                            ? "bg-white dark:bg-surface-700 text-brand-500 shadow-sm"
                            : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    )}
                >
                    <Brain size={14} />
                    IA & Packs
                    {packsUsage && packsUsage.summary.activePacks > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                            {packsUsage.summary.activePacks}
                        </span>
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "overview" ? (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                {/* Left Sidebar: Detailed Info */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Ownership */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                        <div className="p-5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/20">
                            <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <Users size={18} className="text-brand-500" /> Propriétaire & Équipe
                            </h3>
                        </div>
                        <div className="p-5 space-y-6">
                            {r.owner ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-lg">
                                            {r.owner.fullName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{r.owner.fullName}</p>
                                            <p className="text-xs text-surface-500">ID: {r.owner.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <a href={`mailto:${r.owner.email}`} className="flex items-center gap-2.5 p-2 rounded-xl border border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                            <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-xs text-surface-600 dark:text-surface-300 truncate">{r.owner.email}</span>
                                        </a>
                                        <a href={`tel:${r.owner.phone}`} className="flex items-center gap-2.5 p-2 rounded-xl border border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                            <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-xs text-surface-600 dark:text-surface-300">{r.owner.phone}</span>
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                    <AlertCircle size={32} className="text-surface-300 mb-2" />
                                    <p className="text-xs text-surface-400">Aucun propriétaire assigné</p>
                                </div>
                            )}
                            {isEditing ? (
                                <div className="space-y-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-surface-400">Description</label>
                                        <textarea
                                            value={editForm.description || ""}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none min-h-[80px]"
                                            placeholder="Description du restaurant..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-surface-400">Ville</label>
                                        <input
                                            type="text"
                                            value={editForm.city || ""}
                                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                            className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-surface-400">Addresse</label>
                                        <input
                                            type="text"
                                            value={editForm.address || ""}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-surface-400">Téléphone</label>
                                        <input
                                            type="text"
                                            value={editForm.phone || ""}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-surface-400">Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email || ""}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-surface-400">NIU</label>
                                            <input
                                                type="text"
                                                value={editForm.kycNiu || ""}
                                                onChange={(e) => setEditForm({ ...editForm, kycNiu: e.target.value })}
                                                className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-surface-400">RCCM</label>
                                            <input
                                                type="text"
                                                value={editForm.kycRccm || ""}
                                                onChange={(e) => setEditForm({ ...editForm, kycRccm: e.target.value })}
                                                className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-surface-400">Slug</label>
                                        <input
                                            type="text"
                                            value={editForm.slug || ""}
                                            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                            className="w-full text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 pt-4 border-t border-surface-100 dark:border-surface-800">
                                    <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                        <Globe size={14} className="shrink-0" />
                                        <span className="text-xs truncate">kbouffe.com/r/{r.slug}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                        <Phone size={14} className="shrink-0" />
                                        <span className="text-xs">{r.phone || "Non spécifié"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                        <Mail size={14} className="shrink-0" />
                                        <span className="text-xs truncate">{r.email || "Non spécifié"}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                                <p className="text-sm font-medium text-surface-600 dark:text-surface-400 italic">Nombre d'employés</p>
                                <Badge variant="outline" className="text-brand-500 border-brand-500/20">{r.teamCount} membres</Badge>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Settings */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                        <div className="p-5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/20">
                            <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <Shield size={18} className="text-brand-500" /> Paramètres d'Affichage
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {[
                                { field: "isActive", label: "Restaurant Actif", description: "Visible par les clients", value: r.isActive },
                                { field: "isVerified", label: "Compte Vérifié", description: "A passé le KYC initial", value: r.isVerified },
                                { field: "isPremium", label: "Statut Premium", description: "Statut privilégié", value: r.isPremium },
                                { field: "isSponsored", label: "Mise en Avant", description: "Apparaît en tête de liste", value: r.isSponsored },
                            ].map(({ field, label, description, value }) => (
                                <div key={field} className="flex items-center justify-between gap-4 py-2 group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-surface-900 dark:text-white">{label}</p>
                                        <p className="text-[10px] text-surface-500">{description}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleField(field, !value)}
                                        disabled={toggling}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900",
                                            value ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"
                                        )}
                                    >
                                        <span className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
                                            value ? "translate-x-6" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Danger Zone */}
                    <motion.div 
                        variants={itemVariants}
                        className="bg-white dark:bg-surface-900 rounded-3xl border border-red-200 dark:border-red-900/30 overflow-hidden shadow-sm shadow-red-500/5"
                    >
                        <div className="p-5 border-b border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Trash2 size={18} /> Zone de Danger
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-surface-500 leading-relaxed">
                                La suppression d'un restaurant est une action <strong>irréversible</strong>. Toutes les données associées (équipes, menus, commandes) seront définitivement effacées.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/5 dark:border-red-900/50"
                                onClick={() => setIsConfirmDeleteOpen(true)}
                            >
                                <Trash2 size={16} className="mr-2" /> Supprimer le restaurant
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Right Area: Verification Hub */}
                <div className="lg:col-span-8 space-y-6">
                    <motion.div variants={itemVariants} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                        <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                    <FileText size={20} className="text-brand-500" /> Hub de Vérification Marchand
                                </h3>
                                <p className="text-xs text-surface-500">Valider les informations légales du partenaire</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] uppercase tracking-widest text-surface-400 font-bold">État Dossier</span>
                                {getStatusBadge(r.kycStatus)}
                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Document Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* NIU */}
                                <div className="space-y-3 group">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-surface-400 uppercase tracking-wider">Identifiant Fiscal (NIU)</label>
                                        <Badge variant="outline" className="text-[10px] h-5 bg-surface-50 dark:bg-surface-800 border-none">Obligatoire</Badge>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 group-hover:border-brand-500/20 transition-colors">
                                        <p className="text-base font-mono font-bold text-surface-900 dark:text-white mb-3">{r.kycNiu || "Non spécifié"}</p>
                                        {r.kycNiuUrl ? (
                                            <a 
                                                href={r.kycNiuUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex items-center gap-2 text-xs font-semibold text-brand-500 hover:text-brand-600 bg-brand-500/10 dark:bg-brand-500/5 px-3 py-2 rounded-xl transition-all w-fit"
                                            >
                                                <ExternalLink size={14} /> Voir le certificat
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-surface-400 italic">
                                                <Info size={12} /> Document manquant
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RCCM */}
                                <div className="space-y-3 group">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-surface-400 uppercase tracking-wider">Registre Commerce (RCCM)</label>
                                        <Badge variant="outline" className="text-[10px] h-5 bg-surface-50 dark:bg-surface-800 border-none">Obligatoire</Badge>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 group-hover:border-brand-500/20 transition-colors">
                                        <p className="text-base font-mono font-bold text-surface-900 dark:text-white mb-3">{r.kycRccm || "Non spécifié"}</p>
                                        {r.kycRccmUrl ? (
                                            <a 
                                                href={r.kycRccmUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex items-center gap-2 text-xs font-semibold text-brand-500 hover:text-brand-600 bg-brand-500/10 dark:bg-brand-500/5 px-3 py-2 rounded-xl transition-all w-fit"
                                            >
                                                <ExternalLink size={14} /> Voir l'extrait RCCM
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-surface-400 italic">
                                                <Info size={12} /> Document manquant
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ID Card */}
                                <div className="space-y-3 group md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-surface-400 uppercase tracking-wider">Identification du Dirigeant</label>
                                        <Badge variant="outline" className="text-[10px] h-5 bg-surface-50 dark:bg-surface-800 border-none">KYC</Badge>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 group-hover:border-brand-500/20 transition-colors flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 shrink-0">
                                                <Camera size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-surface-900 dark:text-white">Pièce d'Identité National / Passeport</p>
                                                <p className="text-[10px] text-surface-500">Doit correspondre au nom du propriétaire du compte</p>
                                            </div>
                                        </div>
                                        {r.kycIdUrl ? (
                                            <a 
                                                href={r.kycIdUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex items-center gap-2 text-xs font-semibold text-brand-500 hover:text-brand-600 bg-brand-500/10 dark:bg-brand-500/5 px-4 py-2 rounded-xl transition-all"
                                            >
                                                Inspecter <ChevronRight size={14} />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full">En attente</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Alert */}
                            <AnimatePresence>
                                {r.kycStatus === "rejected" && r.kycRejectionReason && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                                                <AlertCircle size={16} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-red-600 dark:text-red-400">Demande rejetée</p>
                                                <p className="text-xs text-red-500 leading-relaxed font-semibold">{r.kycRejectionReason}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Verification Actions */}
                            <div className="pt-8 border-t border-surface-100 dark:border-surface-800">
                                {r.kycStatus === "pending" ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <Button
                                                onClick={handleVerify}
                                                disabled={toggling}
                                                className="bg-green-600 hover:bg-green-700 text-white min-w-[200px] h-11 rounded-xl shadow-lg shadow-green-600/10"
                                            >
                                                <CheckCircle size={18} className="mr-2" /> Approuver le Marchand
                                            </Button>
                                            <Button
                                                onClick={() => setShowRejectionInput(!showRejectionInput)}
                                                variant="outline"
                                                className="text-red-500 border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/5 h-11 rounded-xl"
                                            >
                                                <XCircle size={18} className="mr-2" /> Rejeter le dossier
                                            </Button>
                                        </div>

                                        <AnimatePresence>
                                            {showRejectionInput && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    className="p-5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                                                            <XCircle size={16} />
                                                        </div>
                                                        <p className="text-sm font-bold text-surface-900 dark:text-white">Détails du rejet</p>
                                                    </div>
                                                    <textarea
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="Veuillez expliquer les raisons du rejet. Ces informations seront visibles par le restaurant..."
                                                        className="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none min-h-[120px] transition-all"
                                                    />
                                                    <div className="flex justify-end gap-3 mt-4">
                                                        <Button variant="ghost" size="sm" onClick={() => setShowRejectionInput(false)}>Fermer</Button>
                                                        <Button size="sm" className="bg-red-500 text-white hover:bg-red-600 rounded-xl px-6" onClick={handleReject} disabled={toggling}>
                                                            Confirmer le Rejet
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700 gap-4">
                                        <div className="flex items-center gap-3 text-surface-500">
                                            <Info size={18} />
                                            <p className="text-xs font-semibold">
                                                Dossier déjà <strong>{r.kycStatus === "approved" ? "validé" : "clôturé"}</strong>.
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateRestaurant({ kycStatus: "pending" })}
                                            className="text-brand-500 hover:text-brand-600 hover:bg-brand-500/5 text-xs font-bold"
                                        >
                                            Réouvrir l'examen du dossier
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
                ) : activeTab === "team" ? (
                    <motion.div 
                        key="team"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden"
                    >
                        <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-surface-900 dark:text-white">Gestion de l'Équipe</h3>
                                <p className="text-xs text-surface-500">Liste des membres et accès au Dashboard</p>
                            </div>
                            <Badge variant="outline" className="text-brand-500 border-brand-500/20">
                                {members.filter((m: any) => m.status === "active").length} membres actifs
                            </Badge>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-50/50 dark:bg-surface-800/50 text-[10px] uppercase tracking-widest text-surface-400 font-bold border-b border-surface-100 dark:border-surface-800">
                                        <th className="px-6 py-4">Membre</th>
                                        <th className="px-6 py-4">Rôle</th>
                                        <th className="px-6 py-4">Statut</th>
                                        <th className="px-6 py-4">Rejoint le</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                                    {loadingMembers ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-surface-400 italic">Chargement...</td>
                                        </tr>
                                    ) : members.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-surface-400 italic">Aucun membre trouvé.</td>
                                        </tr>
                                    ) : members.map((member: any) => (
                                        <tr key={member.id} className="group hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            (member.fullName || member.email).charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                                                            {member.fullName || "Sans nom"}
                                                        </p>
                                                        <p className="text-xs text-surface-500 truncate">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    defaultValue={member.role}
                                                    onChange={(e) => updateMember(member.id, { role: e.target.value })}
                                                    disabled={toggling || member.role === "owner"}
                                                    className="text-xs bg-surface-50 dark:bg-surface-800 border-none rounded-lg focus:ring-1 focus:ring-brand-500 outline-none p-1 cursor-pointer font-medium"
                                                >
                                                    <option value="owner">Propriétaire</option>
                                                    <option value="manager">Gérant</option>
                                                    <option value="cashier">Caissier</option>
                                                    <option value="cook">Cuisinier</option>
                                                    <option value="viewer">Observateur</option>
                                                    <option value="driver">Livreur</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                {member.status === "active" ? (
                                                    <Badge variant="success" dot>Actif</Badge>
                                                ) : member.status === "pending" ? (
                                                    <Badge variant="warning" dot>Invité</Badge>
                                                ) : (
                                                    <Badge variant="danger" dot>Révoqué</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-surface-500">
                                                {new Date(member.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {member.role !== "owner" && member.status !== "revoked" && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => revokeMember(member.id)}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <XCircle size={14} className="mr-1.5" /> Révoquer
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : activeTab === "catalog" ? (
                    <motion.div
                        key="catalog"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <AdminCatalogContent restaurantId={id} />
                    </motion.div>
                ) : activeTab === "modules" ? (
                    <motion.div
                        key="modules"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-100 dark:border-surface-800">
                                <div className="p-2 bg-brand-500/10 rounded-xl">
                                    <Puzzle size={18} className="text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-surface-900 dark:text-white">Modules du système</h3>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">
                                        Cochez ou décochez les fonctionnalités disponibles pour <span className="font-semibold text-surface-700 dark:text-surface-300">{restaurant?.name}</span>.
                                    </p>
                                </div>
                            </div>

                            {/* Module list */}
                            {loadingModules ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-7 h-7 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                                </div>
                            ) : modules.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-surface-400">
                                    <Puzzle size={32} className="opacity-40" />
                                    <p className="text-sm">Aucun module trouvé pour ce restaurant.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                                    {modules.map((mod) => {
                                        const IconMap: Record<string, React.ElementType> = {
                                            CalendarDays,
                                            Megaphone,
                                            Users,
                                            Truck,
                                            Utensils,
                                        };
                                        const Icon = IconMap[mod.icon] ?? Puzzle;
                                        const isToggling = togglingModule === mod.id;

                                        return (
                                            <li
                                                key={mod.id}
                                                className={cn(
                                                    "flex items-center gap-4 px-6 py-4 transition-colors",
                                                    mod.isActive
                                                        ? "bg-brand-50/40 dark:bg-brand-500/5"
                                                        : "hover:bg-surface-50 dark:hover:bg-surface-800/50"
                                                )}
                                            >
                                                {/* Icon */}
                                                <div className={cn(
                                                    "p-2 rounded-xl shrink-0",
                                                    mod.isActive
                                                        ? "bg-brand-500/10"
                                                        : "bg-surface-100 dark:bg-surface-800"
                                                )}>
                                                    <Icon size={18} className={mod.isActive ? "text-brand-500" : "text-surface-400"} />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{mod.name}</p>
                                                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{mod.description}</p>
                                                </div>

                                                {/* Status badge */}
                                                <span className={cn(
                                                    "hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0",
                                                    mod.isActive
                                                        ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                                        : "bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500"
                                                )}>
                                                    {mod.isActive ? "Activé" : "Désactivé"}
                                                </span>

                                                {/* Checkbox toggle */}
                                                <label className={cn("relative inline-flex items-center shrink-0", isToggling ? "cursor-wait opacity-60" : "cursor-pointer")}>
                                                    <input
                                                        type="checkbox"
                                                        checked={mod.isActive}
                                                        onChange={() => !isToggling && toggleModule(mod.id, !mod.isActive)}
                                                        disabled={isToggling}
                                                        className="sr-only peer"
                                                        aria-label={`${mod.isActive ? "Désactiver" : "Activer"} le module ${mod.name}`}
                                                    />
                                                    <div className={cn(
                                                        "w-11 h-6 rounded-full transition-colors duration-200 relative",
                                                        "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
                                                        "after:bg-white after:rounded-full after:h-5 after:w-5",
                                                        "after:transition-transform after:duration-200 after:shadow-sm",
                                                        mod.isActive
                                                            ? "bg-brand-500 after:translate-x-5"
                                                            : "bg-surface-300 dark:bg-surface-600 after:translate-x-0"
                                                    )} />
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                ) : activeTab === "ia-packs" ? (
                    <motion.div
                        key="ia-packs"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {loadingPacksUsage ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={24} className="animate-spin text-surface-400" />
                            </div>
                        ) : !packsUsage ? (
                            <div className="text-center py-16 text-surface-400 text-sm">Impossible de charger les données</div>
                        ) : (
                            <>
                                {/* Summary cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: "Packs actifs", value: packsUsage.summary.activePacks, icon: Package, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                        { label: "Total packs achetés", value: packsUsage.summary.totalPacks, icon: Zap, color: "text-brand-500", bg: "bg-brand-500/10" },
                                        { label: "Appels IA ce mois", value: packsUsage.summary.monthCalls, icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
                                        { label: "Coût estimé (mois)", value: `${packsUsage.summary.totalCostFCFA.toLocaleString("fr-FR")} F`, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                                                <stat.icon size={18} className={stat.color} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-surface-400 font-medium">{stat.label}</p>
                                                <p className="text-xl font-black text-surface-900 dark:text-white mt-0.5">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Packs list */}
                                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2">
                                        <Package size={16} className="text-brand-500" />
                                        <h3 className="font-bold text-surface-900 dark:text-white text-sm">Packs Marketplace</h3>
                                    </div>
                                    {packsUsage.packs.length === 0 ? (
                                        <div className="py-12 text-center text-surface-400 text-sm">
                                            <Package size={32} className="mx-auto opacity-20 mb-3" />
                                            Aucun pack acheté
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-surface-100 dark:divide-surface-800">
                                            {packsUsage.packs.map((pack: any) => {
                                                const isActive = pack.status === "active";
                                                const isExpired = pack.expires_at && new Date(pack.expires_at) < new Date();
                                                return (
                                                    <div key={pack.id} className="flex items-center gap-4 px-6 py-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-surface-900 dark:text-white">
                                                                    {pack.service?.name ?? "Pack inconnu"}
                                                                </span>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                                                    isActive && !isExpired
                                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                                        : isExpired
                                                                        ? "bg-surface-100 text-surface-500"
                                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                                                }`}>
                                                                    {isExpired ? "EXPIRÉ" : isActive ? "ACTIF" : pack.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-surface-400 mt-0.5">
                                                                {pack.service?.category} · {pack.amount_paid?.toLocaleString("fr-FR")} FCFA payé
                                                                {pack.expires_at ? ` · expire le ${new Date(pack.expires_at).toLocaleDateString("fr-FR")}` : ""}
                                                            </p>
                                                        </div>
                                                        <div className="text-right text-xs text-surface-400">
                                                            {new Date(pack.created_at).toLocaleDateString("fr-FR")}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* AI usage per feature */}
                                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2">
                                        <Brain size={16} className="text-purple-500" />
                                        <h3 className="font-bold text-surface-900 dark:text-white text-sm">Consommation IA ce mois</h3>
                                    </div>
                                    <div className="divide-y divide-surface-100 dark:divide-surface-800">
                                        {packsUsage.aiUsage.filter((u: any) => u.month > 0 || u.today > 0).length === 0 ? (
                                            <div className="py-10 text-center text-surface-400 text-sm">
                                                <Brain size={28} className="mx-auto opacity-20 mb-2" />
                                                Aucun appel IA ce mois
                                            </div>
                                        ) : packsUsage.aiUsage.map((usage: any) => {
                                            const FEATURE_ICONS: Record<string, any> = {
                                                ai_photo: Camera, ai_analytics: Brain, ai_social: Send,
                                                ai_calendar: CalendarDays, ai_ocr: FileSearch, ai_copywriter: PenSquare,
                                            };
                                            const Icon = FEATURE_ICONS[usage.feature] ?? Zap;
                                            return (
                                                <div key={usage.feature} className="flex items-center gap-4 px-6 py-3">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                                                        <Icon size={14} className="text-surface-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-surface-700 dark:text-surface-300">{usage.label}</span>
                                                            <span className="text-sm font-bold text-surface-900 dark:text-white">{usage.month} / {usage.limit * 30}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${usage.quotaPct > 80 ? "bg-red-500" : usage.quotaPct > 50 ? "bg-amber-500" : "bg-brand-500"}`}
                                                                    style={{ width: `${Math.min(100, usage.month / (usage.limit * 30) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-surface-400 w-20 text-right">
                                                                auj: {usage.today} · ~{usage.estimatedCostFCFA} F
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isConfirmDeleteOpen}
                onClose={() => {
                    setIsConfirmDeleteOpen(false);
                    setDeleteConfirmationName("");
                }}
                title="Supprimer le restaurant"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-danger-50 dark:bg-danger-900/10 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="text-danger-500 shrink-0 mt-0.5" size={18} />
                        <div className="text-sm text-danger-600 dark:text-danger-400">
                            <p className="font-bold mb-1">Action irréversible</p>
                            <p>Toutes les données associées (menu, commandes, réservations, équipe) seront définitivement supprimées.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-surface-600 dark:text-surface-400">
                            Veuillez saisir <strong className="text-surface-900 dark:text-white">{restaurant.name}</strong> pour confirmer :
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmationName}
                            onChange={(e) => setDeleteConfirmationName(e.target.value)}
                            className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-danger-500 outline-none"
                            placeholder="Nom du restaurant"
                        />
                    </div>
                    <ModalFooter>
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setIsConfirmDeleteOpen(false);
                                setDeleteConfirmationName("");
                            }}
                        >
                            Annuler
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={deleteRestaurant}
                            disabled={deleteConfirmationName !== restaurant.name || isDeleting}
                            className="gap-2"
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Trash2 size={16} />
                            )}
                            Supprimer définitivement
                        </Button>
                    </ModalFooter>
                </div>
            </Modal>
        </motion.div>
    );
}

function AdminCatalogContent({ restaurantId }: { restaurantId: string }) {
    const { products } = useProducts(restaurantId, true);
    const [view, setView] = useState<"products" | "categories">("products");

    return (
        <div className="space-y-6">
            <MenuStats products={products || []} restaurantId={restaurantId} isAdmin={true} />
            
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
                    <button
                        onClick={() => setView("products")}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            view === "products" 
                                ? "bg-white dark:bg-surface-700 text-brand-500 shadow-sm" 
                                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                        )}
                    >
                        Produits
                    </button>
                    <button
                        onClick={() => setView("categories")}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            view === "categories" 
                                ? "bg-white dark:bg-surface-700 text-brand-500 shadow-sm" 
                                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                        )}
                    >
                        Catégories
                    </button>
                </div>
            </div>

            {view === "products" ? (
                <ProductsTable restaurantId={restaurantId} isAdmin={true} />
            ) : (
                <CategoryList restaurantId={restaurantId} isAdmin={true} />
            )}
        </div>
    );
}

