"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Loader2, Pencil, Phone, User, X } from "lucide-react";
import { useUserSession } from "@/store/client-store";
import { createClient } from "@/lib/supabase/client";

// ── Inline field ─────────────────────────────────────────────────────────────
function StaticField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <p className="text-xs uppercase tracking-wide font-medium text-surface-500 dark:text-surface-400 mb-1">{label}</p>
            <p className="font-semibold text-surface-900 dark:text-white text-sm">{value || "—"}</p>
        </div>
    );
}

// ── Edit modal ───────────────────────────────────────────────────────────────
interface ProfileForm {
    name: string;
    phone: string;
}

function EditProfileModal({
    initial,
    onSave,
    onCancel,
}: {
    initial: ProfileForm;
    onSave: (data: ProfileForm) => Promise<void>;
    onCancel: () => void;
}) {
    const [form, setForm]       = useState<ProfileForm>(initial);
    const [saving, setSaving]   = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const set = <K extends keyof ProfileForm>(key: K, v: string) =>
        setForm((prev) => ({ ...prev, [key]: v }));

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await onSave(form);
            setSuccess(true);
            setTimeout(onCancel, 800);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-surface-900 dark:text-white text-lg">Modifier mon profil</h3>
                    <button type="button" onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                        Nom complet
                    </label>
                    <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <input
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                            placeholder="Votre nom"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                        Numéro de téléphone
                    </label>
                    <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <input
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                            placeholder="+237 6XX XXX XXX"
                            type="tel"
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 h-11 rounded-xl border border-surface-300 dark:border-surface-600 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : success ? (
                            <CheckCircle2 size={15} />
                        ) : null}
                        {success ? "Sauvegardé !" : saving ? "Sauvegarde…" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Main panel ───────────────────────────────────────────────────────────────
export function ProfilePanelReal() {
    const session      = useUserSession((s) => s.session);
    const updateProfile = useUserSession((s) => s.updateProfile);
    const [editing, setEditing] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const supabase = createClient();

    const handleSave = async (data: ProfileForm) => {
        // Optimistic update in Zustand
        updateProfile({ name: data.name || undefined, phone: data.phone || undefined });

        // If there's a live session, sync to Supabase auth via API
        if (session?.id) {
            const res = await fetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: data.name, phone: data.phone }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message ?? "Erreur de sauvegarde");
            }
        }
    };

    const handleAvatarUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
        const file = ev.target.files?.[0];
        if (!file || !session?.id) return;

        setUploadingAvatar(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.id}/${Date.now()}.${fileExt}`;

            if (!supabase) throw new Error("Supabase client non initialisé");

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Optimistic update
            updateProfile({ avatarUrl: data.publicUrl });

            // Sync with backend API
            const res = await fetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: data.publicUrl }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message ?? "Erreur de sauvegarde de l'avatar");
            }

        } catch (err: any) {
            console.error("Avatar upload error:", err);
            alert(err.message ?? "Une erreur est survenue lors du téléchargement.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const isAuthenticated = !!session;

    return (
        <>
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Mon profil</h2>
                        <p className="text-surface-600 dark:text-surface-400 text-sm">
                            {isAuthenticated ? "Gérez vos informations personnelles" : "Connectez-vous pour gérer votre profil"}
                        </p>
                    </div>
                    {isAuthenticated && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-600 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            <Pencil size={14} />
                            Modifier
                        </button>
                    )}
                </div>

                {/* Avatar placeholder */}
                {isAuthenticated && (
                    <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
                        <label className="relative flex-shrink-0 cursor-pointer group">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                            />
                            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xl overflow-hidden shadow-sm ring-2 ring-white dark:ring-surface-900 group-hover:ring-brand-200 dark:group-hover:ring-brand-500/30 transition-all">
                                {uploadingAvatar ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : session?.avatarUrl ? (
                                    <img src={session.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    session?.name?.[0]?.toUpperCase() ?? session?.email?.[0]?.toUpperCase() ?? "?"
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-surface-800 rounded-full flex items-center justify-center shadow-sm border border-surface-200 dark:border-surface-700 text-surface-500 group-hover:text-brand-500 transition-colors">
                                <Camera size={12} />
                            </div>
                        </label>
                        <div>
                            <p className="font-semibold text-surface-900 dark:text-white text-lg">{session?.name ?? "Utilisateur Kbouffe"}</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">{session?.email}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <StaticField label="Nom complet"   value={session?.name} />
                    <StaticField label="Téléphone"     value={session?.phone} />
                    <div className="md:col-span-2">
                        <StaticField label="Adresse e-mail" value={session?.email} />
                    </div>
                    <div className="md:col-span-2">
                        <StaticField label="Statut du compte" value={
                            !session ? "Non connecté" :
                            session.isVerified ? "Compte vérifié" : "En attente de vérification"
                        } />
                    </div>
                </div>

                {!isAuthenticated && (
                    <div className="mt-4 text-center">
                        <a
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
                        >
                            Se connecter
                        </a>
                    </div>
                )}
            </div>

            {editing && session && (
                <EditProfileModal
                    initial={{ name: session.name ?? "", phone: session.phone ?? "" }}
                    onSave={handleSave}
                    onCancel={() => setEditing(false)}
                />
            )}
        </>
    );
}
