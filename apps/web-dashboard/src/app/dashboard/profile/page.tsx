"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Mail, Phone, User, Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Button, Input, toast } from "@kbouffe/module-core/ui";
import { useUserSession } from "@/store/client-store";

export default function RestaurantOwnerProfilePage() {
    const router = useRouter();
    const session = useUserSession((s) => s.session);
    const updateProfile = useUserSession((s) => s.updateProfile);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (session) {
            setForm({
                name: session.name || "",
                email: session.email || "",
                phone: session.phone || "",
            });
        }
    }, [session]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            // Update in Zustand store
            updateProfile({
                name: form.name || undefined,
                phone: form.phone || undefined,
            });

            // Sync to API
            const res = await fetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Erreur lors de la sauvegarde");
            }

            setSuccess(true);
            toast.success("Profil mis à jour avec succès ✨");
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-brand-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-surface-900 dark:text-white">Mon Profil</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-2">Gérez les informations de votre compte personnel</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar Section */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-100 dark:bg-brand-900 flex items-center justify-center border-2 border-brand-200 dark:border-brand-800">
                            {session.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={session.avatarUrl}
                                    alt={session.name || "User"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={32} className="text-brand-600 dark:text-brand-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-900 dark:text-white">{session.name || "Utilisateur"}</h2>
                            <p className="text-sm text-surface-500">{session.email}</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                disabled
                            >
                                <Camera size={14} />
                                Changer l'avatar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-5">
                    <h3 className="font-bold text-lg text-surface-900 dark:text-white">Informations Personnelles</h3>

                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                            Nom Complet
                        </label>
                        <Input
                            type="text"
                            placeholder="Votre nom complet"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            leftIcon={<User size={16} />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                            Email (Non modifiable)
                        </label>
                        <Input
                            type="email"
                            placeholder="Votre email"
                            value={form.email}
                            disabled
                            leftIcon={<Mail size={16} />}
                        />
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                            Votre adresse email ne peut pas être modifiée
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                            Numéro de Téléphone
                        </label>
                        <Input
                            type="tel"
                            placeholder="+237 6XX XXX XXX"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            leftIcon={<Phone size={16} />}
                        />
                    </div>
                </div>

                {/* Account Info */}
                <div className="bg-brand-50 dark:bg-brand-500/10 rounded-2xl border border-brand-200 dark:border-brand-500/20 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-brand-600 dark:text-brand-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-brand-900 dark:text-brand-100 mb-1">Sécurité</p>
                            <p className="text-sm text-brand-800 dark:text-brand-200">
                                Pour modifier votre mot de passe, veuillez aller dans les paramètres de sécurité.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Votre profil a été mis à jour avec succès !
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 sticky bottom-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        isLoading={saving}
                    >
                        <Save size={16} />
                        {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
