"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User } from "lucide-react";
import Link from "next/link";
import {
    ArrowLeft,
    UserCircle,
    Mail,
    Phone,
    Calendar,
    Store,
    Truck,
    ShieldCheck,
    Globe,
    Clock,
    Activity,
    CheckCircle2,
    XCircle,
    Trash2,
    Key,
    Save,
    X,
    Edit2,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserDetail {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    adminRole: string | null;
    restaurantId: string | null;
    preferredLang: string;
    notificationsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    restaurant: {
        id: string;
        name: string;
        slug: string;
        city: string;
        isActive: boolean;
        isVerified: boolean;
    } | null;
    driver: {
        id: string;
        vehicleType: string;
        status: string;
        isVerified: boolean;
        totalDeliveries: number;
        rating: number;
    } | null;
}

const roleBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand" }> = {
    client: { label: "Client", variant: "info" },
    merchant: { label: "Marchand", variant: "success" },
    livreur: { label: "Livreur", variant: "warning" },
    admin: { label: "Admin", variant: "danger" },
};

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ fullName: "", phone: "" });
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/admin/users/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setEditData({
                        fullName: data.fullName || "",
                        phone: data.phone || "",
                    });
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const updateRole = async (newRole: string) => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setUser({ ...user, role: newRole });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            if (res.ok) {
                const updated = await res.json();
                setUser({ ...user, ...editData, updatedAt: updated.updatedAt });
                setIsEditing(false);
                toast.success("Profil mis á jour");
            } else {
                toast.error("Erreur lors de la mise á jour");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user) return;
        if (!confirm("Envoyer un lien de réinitialisation de mot de passe à cet utilisateur ?")) return;
        
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${id}/reset-password`, {
                method: "POST",
            });
            if (res.ok) {
                toast.success("Lien de réinitialisation généré");
            } else {
                toast.error("Erreur lors de la génération du lien");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!user) return;
        const confirmEmail = prompt(`Pour confirmer la suppression, veuillez saisir l'adresse email de l'utilisateur (${user.email}) :`);
        if (confirmEmail !== user.email) {
            if (confirmEmail !== null) toast.error("L'email ne correspond pas");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Utilisateur supprimé avec succès");
                router.push("/admin/users");
            } else {
                const err = await res.json();
                toast.error(err.error || "Erreur lors de la suppression");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-surface-400 font-bold uppercase tracking-widest text-xs">Chargement du profil...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-24 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-surface-50 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={40} className="text-surface-300" />
                </div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2">Oups !</h2>
                <p className="text-surface-500 mb-8">Utilisateur introuvable ou supprimé.</p>
                <Link href="/admin/users" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-black rounded-2xl hover:shadow-lg transition-all active:scale-95">
                    <ArrowLeft size={18} /> Retour à la liste
                </Link>
            </div>
        );
    }

    const u = user;
    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Jamais";

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Link
                href="/admin/users"
                className="group inline-flex items-center gap-2 text-sm font-black text-surface-400 hover:text-brand-500 transition-all mb-8 uppercase tracking-widest"
            >
                <div className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-800 flex items-center justify-center group-hover:border-brand-500/30 group-hover:bg-brand-500/5 transition-all">
                    <ArrowLeft size={16} />
                </div>
                Retour aux utilisateurs
            </Link>

            {/* Header / Profile Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 mb-10 shadow-xl shadow-surface-200/50 dark:shadow-none overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                
                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-300 shrink-0 overflow-hidden border-4 border-white dark:border-surface-900 shadow-2xl">
                            {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={64} strokeWidth={1} />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-surface-900">
                            <ShieldCheck size={20} />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                            <h1 className="text-3xl md:text-4xl font-black text-surface-900 dark:text-white tracking-tight leading-tight">
                                {u.fullName ?? "Profil sans nom"}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <Badge variant={roleBadge[u.role]?.variant ?? "info"} className="py-1 px-3 rounded-xl border border-transparent shadow-sm">
                                    <span className="text-[11px] font-black uppercase tracking-widest">{roleBadge[u.role]?.label ?? u.role}</span>
                                </Badge>
                                <AnimatePresence>
                                    {u.adminRole && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                            <Badge variant="danger" className="py-1 px-3 rounded-xl border border-transparent shadow-sm">
                                                <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <ShieldCheck size={12} /> {u.adminRole}
                                                </span>
                                            </Badge>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <p className="text-lg text-surface-500 font-medium mb-4">{u.email}</p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <Button 
                                variant={isEditing ? "outline" : "secondary"}
                                size="sm"
                                onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                                leftIcon={isEditing ? <X size={16} /> : <Edit2 size={16} />}
                                className="rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                {isEditing ? "Annuler" : "Modifier le profil"}
                            </Button>
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={handleResetPassword}
                                leftIcon={<Key size={16} />}
                                className="rounded-xl font-black uppercase text-[10px] tracking-widest"
                                isLoading={saving}
                            >
                                Réinitialiser Password
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-8">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-emerald-500" />
                                <span className="text-sm font-bold text-surface-600 dark:text-surface-400 uppercase tracking-tight">Actif depuis {new Date(u.createdAt).getFullYear()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-brand-500" />
                                <span className="text-sm font-bold text-surface-600 dark:text-surface-400 uppercase tracking-tight">Vu {formatDate(u.lastLoginAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Information Column */}
                <div className="lg:col-span-7 space-y-10">
                    <section className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">Détails du compte</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                            <DetailItem icon={Mail} label="Adresse Email" value={u.email} />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-surface-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Nom Complet</span>
                                </div>
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={editData.fullName}
                                        onChange={e => setEditData({...editData, fullName: e.target.value})}
                                    />
                                ) : (
                                    <p className="text-lg font-black tracking-tight text-surface-900 dark:text-white">{u.fullName ?? "Non renseigné"}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-surface-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Contact</span>
                                </div>
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={editData.phone}
                                        onChange={e => setEditData({...editData, phone: e.target.value})}
                                    />
                                ) : (
                                    <p className="text-lg font-black tracking-tight text-surface-900 dark:text-white">{u.phone ?? "Non renseigné"}</p>
                                )}
                            </div>
                            <DetailItem icon={Globe} label="Langue" value={u.preferredLang === "fr" ? "Français" : "Anglais"} />
                            <DetailItem icon={Calendar} label="Création" value={formatDate(u.createdAt)} />
                            <DetailItem icon={Clock} label="Dernière modification" value={formatDate(u.updatedAt)} />
                            <DetailItem icon={ShieldCheck} label="Rôle Actuel" value={roleBadge[u.role]?.label || u.role} color="text-brand-500" />
                            {isEditing && (
                                <div className="sm:col-span-2 flex justify-end">
                                    <Button 
                                        onClick={handleUpdateProfile}
                                        isLoading={saving}
                                        leftIcon={<Save size={18} />}
                                        className="px-8"
                                    >
                                        Enregistrer les modifications
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Conditional Sections */}
                    <AnimatePresence mode="wait">
                        {u.restaurant && (
                            <motion.section 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/20"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/20">
                                            <Store size={24} />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">Établissement lié</h3>
                                    </div>
                                    <Badge variant="outline" className="text-white border-white/30 bg-white/10 uppercase font-black text-[10px] py-1 px-3">Actif</Badge>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                        <Store size={32} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-2xl font-black tracking-tight">{u.restaurant.name}</p>
                                        <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-1">{u.restaurant.city} · {u.restaurant.slug}</p>
                                    </div>
                                    <Link
                                        href={`/admin/restaurants/${u.restaurant.id}`}
                                        className="h-14 px-8 rounded-2xl bg-white text-brand-600 font-black flex items-center justify-center hover:bg-surface-50 transition-all active:scale-95 shadow-lg"
                                    >
                                        Consulter
                                    </Link>
                                </div>
                            </motion.section>
                        )}

                        {u.driver && (
                            <motion.section 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-surface-900 rounded-3xl border-2 border-amber-500/20 p-8 shadow-xl shadow-amber-500/5"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                        <Truck size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">Profil Livreur</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                    <StatItem label="Véhicule" value={u.driver.vehicleType} icon={Truck} />
                                    <StatItem label="Livr. Totales" value={String(u.driver.totalDeliveries)} icon={Activity} />
                                    <StatItem label="Note" value={`${u.driver.rating}/5`} icon={ShieldCheck} />
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions Column */}
                <div className="lg:col-span-5 space-y-8">
                    <section className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8">
                        <h3 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight mb-8">Changer le rôle</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: "client", icon: UserCircle, desc: "Utilisateur standard de la plateforme" },
                                { id: "merchant", icon: Store, desc: "Gestionnaire d'un ou plusieurs restaurants" },
                                { id: "livreur", icon: Truck, desc: "Partenaire de livraison kbouffe" },
                                { id: "admin", icon: ShieldCheck, desc: "Accès total au panneau d'administration" },
                            ].map((role) => {
                                const active = u.role === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => updateRole(role.id)}
                                        disabled={saving || active}
                                        className={cn(
                                            "group text-left p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden",
                                            active 
                                                ? "border-brand-500 bg-brand-500/5 shadow-inner" 
                                                : "border-surface-100 dark:border-surface-800 hover:border-brand-500/30 hover:bg-surface-50 dark:hover:bg-brand-500/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                                active ? "bg-brand-500 text-white" : "bg-surface-100 dark:bg-surface-800 text-surface-400 group-hover:text-brand-500"
                                            )}>
                                                <role.icon size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("font-black uppercase tracking-tight", active ? "text-brand-600 dark:text-brand-400" : "text-surface-900 dark:text-white")}>
                                                        {roleBadge[role.id]?.label ?? role.id}
                                                    </span>
                                                    {active && <CheckCircle2 size={16} className="text-brand-500" />}
                                                </div>
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-1 group-hover:text-surface-500 transition-colors">{role.desc}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-surface-900 rounded-3xl border border-rose-500/20 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">Zone de Danger</h3>
                        </div>
                        <p className="text-sm text-surface-500 mb-6 font-medium">
                            La suppression d&apos;un utilisateur est irréversible. Toutes ses données, commandes et accès seront définitivement supprimés.
                        </p>
                        <Button 
                            variant="danger" 
                            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
                            onClick={handleDeleteUser}
                            isLoading={saving}
                            leftIcon={<Trash2 size={18} />}
                        >
                            Supprimer définitivement le compte
                        </Button>
                    </section>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string, color?: string }) {
    return (
        <div className="group">
            <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-surface-400 group-hover:text-brand-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">{label}</span>
            </div>
            <p className={cn("text-lg font-black tracking-tight truncate", color || "text-surface-900 dark:text-white")}>{value}</p>
        </div>
    );
}

function StatItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mx-auto mb-3 text-brand-500 shadow-sm border border-surface-100 dark:border-surface-700">
                <Icon size={24} />
            </div>
            <p className="text-2xl font-black text-surface-900 dark:text-white tabular-nums">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">{label}</p>
        </div>
    );
}
