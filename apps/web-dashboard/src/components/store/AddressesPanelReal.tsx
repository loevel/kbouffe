"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, MapPin, Pencil, Plus, Star, Trash2, X, Loader2 } from "lucide-react";
import { usePreferencesStore, type DeliveryAddress } from "@/store/client-store";
import toast from "react-hot-toast";

// ── Address card ────────────────────────────────────────────────────────────
function AddressCard({
    address,
    onEdit,
    onDelete,
    onSetDefault,
}: {
    address: DeliveryAddress;
    onEdit: (a: DeliveryAddress) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
}) {
    return (
        <div className={`p-4 rounded-xl border transition-all ${address.isDefault ? "border-brand-300 dark:border-brand-500/50 bg-brand-50 dark:bg-brand-500/5" : "border-surface-200 dark:border-surface-700"}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <MapPin size={16} className={`shrink-0 mt-0.5 ${address.isDefault ? "text-brand-500" : "text-surface-400"}`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-surface-900 dark:text-white text-sm">{address.label}</p>
                            {address.isDefault && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 font-medium">
                                    Par défaut
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">{address.addressLine1}</p>
                        {address.addressLine2 && (
                            <p className="text-xs text-surface-500 dark:text-surface-500">{address.addressLine2}</p>
                        )}
                        <p className="text-xs text-surface-500 dark:text-surface-500">{address.district}, {address.city}</p>
                        {address.deliveryInstructions && (
                            <p className="text-xs text-surface-400 dark:text-surface-600 italic mt-1">{address.deliveryInstructions}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {!address.isDefault && (
                        <button
                            onClick={() => onSetDefault(address.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                            title="Définir par défaut"
                        >
                            <Star size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(address)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        title="Modifier"
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        onClick={() => onDelete(address.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Address form ───────────────────────────────────────────────────────────
type AddressForm = Omit<DeliveryAddress, "id" | "coordinates">;

const defaultForm: AddressForm = {
    label: "",
    addressLine1: "",
    addressLine2: "",
    city: "Douala",
    district: "",
    isDefault: false,
    deliveryInstructions: "",
};

function AddressFormModal({
    initial,
    onSave,
    onCancel,
}: {
    initial?: AddressForm;
    onSave: (data: AddressForm) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState<AddressForm>(initial ?? defaultForm);
    const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

    const set = <K extends keyof AddressForm>(key: K, value: AddressForm[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const validate = () => {
        const e: typeof errors = {};
        if (!form.label.trim()) e.label = "Requis";
        if (!form.addressLine1.trim()) e.addressLine1 = "Requis";
        if (!form.district.trim()) e.district = "Requis";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (validate()) onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-surface-900 dark:text-white text-lg">
                        {initial ? "Modifier l'adresse" : "Nouvelle adresse"}
                    </h3>
                    <button type="button" onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {(["label", "addressLine1", "addressLine2", "district", "city", "deliveryInstructions"] as const).map((key) => {
                    const labels: Record<string, string> = {
                        label: "Nom de l'adresse (ex: Domicile)",
                        addressLine1: "Adresse principale *",
                        addressLine2: "Complément d'adresse",
                        district: "Quartier *",
                        city: "Ville *",
                        deliveryInstructions: "Instructions pour le livreur",
                    };
                    return (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                                {labels[key]}
                            </label>
                            <input
                                value={form[key] as string}
                                onChange={(e) => set(key, e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                                placeholder={labels[key].replace(" *", "")}
                            />
                            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                        </div>
                    );
                })}

                <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                        role="checkbox"
                        aria-checked={form.isDefault}
                        onClick={() => set("isDefault", !form.isDefault)}
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${form.isDefault ? "bg-brand-500 border-brand-500" : "border-surface-300 dark:border-surface-600"}`}
                    >
                        {form.isDefault && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-surface-700 dark:text-surface-300">Définir comme adresse par défaut</span>
                </label>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 h-11 rounded-xl border border-surface-300 dark:border-surface-600 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="flex-1 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
                    >
                        {initial ? "Enregistrer" : "Ajouter"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export function AddressesPanelReal() {
    const { addresses, setAddresses, addAddress, updateAddress, removeAddress, setDefaultAddress } = usePreferencesStore();
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<DeliveryAddress | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchAddresses = async () => {
        try {
            const res = await fetch("/api/auth/addresses");
            if (res.ok) {
                const data = await res.json();
                const normalizedAddresses: DeliveryAddress[] = data.map((addr: any) => ({
                    id: addr.id,
                    label: addr.label,
                    addressLine1: addr.address,
                    addressLine2: "",
                    city: addr.city,
                    district: addr.city, // Neighborhoods often put in city field in this schema
                    isDefault: addr.isDefault,
                    deliveryInstructions: addr.instructions,
                    coordinates: addr.lat && addr.lng ? { lat: addr.lat, lng: addr.lng } : undefined,
                }));
                setAddresses(normalizedAddresses);
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleAdd = async (data: AddressForm) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/auth/addresses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: data.label,
                    address: data.addressLine1,
                    city: data.district || data.city,
                    postal_code: "",
                    instructions: data.deliveryInstructions,
                    is_default: data.isDefault,
                }),
            });

            if (res.ok) {
                const newAddr = await res.json();
                addAddress(data); // Also sync locally for immediate UI (Zustand)
                // Actually, fetchAddresses() is safer to get the real ID from DB
                await fetchAddresses();
                setFormOpen(false);
                toast.success("Adresse ajoutée avec succès");
            } else {
                toast.error("Erreur lors de l'ajout de l'adresse");
            }
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = async (data: AddressForm) => {
        if (!editTarget) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/auth/addresses/${editTarget.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: data.label,
                    address: data.addressLine1,
                    city: data.district || data.city,
                    instructions: data.deliveryInstructions,
                    is_default: data.isDefault,
                }),
            });

            if (res.ok) {
                updateAddress(editTarget.id, data);
                setEditTarget(null);
                toast.success("Adresse mise à jour");
            } else {
                toast.error("Erreur lors de la mise à jour");
            }
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (deleteConfirm === id) {
            setIsSaving(true);
            try {
                const res = await fetch(`/api/auth/addresses/${id}`, {
                    method: "DELETE",
                });
                if (res.ok) {
                    removeAddress(id);
                    setDeleteConfirm(null);
                    toast.success("Adresse supprimée");
                } else {
                    toast.error("Erreur lors de la suppression");
                }
            } catch (error) {
                toast.error("Erreur réseau");
            } finally {
                setIsSaving(false);
            }
        } else {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 5000);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetch(`/api/auth/addresses/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_default: true }),
            });
            if (res.ok) {
                setDefaultAddress(id);
                toast.success("Adresse par défaut mise à jour");
            }
        } catch (error) {
            toast.error("Erreur lors du changement d'adresse par défaut");
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
                <p className="text-surface-500 text-sm">Chargement de vos adresses...</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 relative">
                {isSaving && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-surface-900/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                    </div>
                )}
                
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Mes adresses</h2>
                        <p className="text-surface-600 dark:text-surface-400 text-sm">
                            {addresses.length > 0
                                ? `${addresses.length} adresse${addresses.length > 1 ? "s" : ""} enregistrée${addresses.length > 1 ? "s" : ""}`
                                : "Aucune adresse enregistrée"}
                        </p>
                    </div>
                    <button
                        onClick={() => setFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shrink-0 disabled:opacity-50"
                        disabled={isSaving}
                    >
                        <Plus size={15} />
                        Ajouter
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin size={40} className="mx-auto text-surface-200 dark:text-surface-700 mb-3" />
                        <p className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">Aucune adresse enregistrée</p>
                        <p className="text-xs text-surface-500 dark:text-surface-500">Ajoutez une adresse pour commander encore plus vite !</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.map((addr) => (
                            <div key={addr.id}>
                                {deleteConfirm === addr.id && (
                                    <div className="mb-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-300 text-center font-medium animate-pulse">
                                        Cliquez à nouveau sur <Trash2 size={11} className="inline" /> pour confirmer la suppression
                                    </div>
                                )}
                                <AddressCard
                                    address={addr}
                                    onEdit={(a) => setEditTarget(a)}
                                    onDelete={handleDelete}
                                    onSetDefault={handleSetDefault}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {formOpen && (
                <AddressFormModal
                    onSave={handleAdd}
                    onCancel={() => setFormOpen(false)}
                />
            )}

            {editTarget && (
                <AddressFormModal
                    initial={{
                        label: editTarget.label,
                        addressLine1: editTarget.addressLine1,
                        addressLine2: editTarget.addressLine2 ?? "",
                        city: editTarget.city,
                        district: editTarget.district,
                        isDefault: editTarget.isDefault,
                        deliveryInstructions: editTarget.deliveryInstructions ?? "",
                    }}
                    onSave={handleEdit}
                    onCancel={() => setEditTarget(null)}
                />
            )}
        </>
    );
}
