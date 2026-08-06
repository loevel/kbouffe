"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, MapPin, Pencil, Plus, Star, Trash2, X, Loader2 } from "lucide-react";
import { usePreferencesStore, type DeliveryAddress } from "@/store/client-store";
import { useDashboardLocale } from "@/hooks/use-dashboard-locale";
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
    const { t } = useDashboardLocale();
    const a = t.clientAddresses;
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
                                    {a.default}
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
                            title={a.setDefaultTooltip}
                        >
                            <Star size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(address)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        title={a.editTooltip}
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        onClick={() => onDelete(address.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title={a.deleteTooltip}
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
    const { t } = useDashboardLocale();
    const a = t.clientAddresses;
    const [form, setForm] = useState<AddressForm>(initial ?? defaultForm);
    const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

    const set = <K extends keyof AddressForm>(key: K, value: AddressForm[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const validate = () => {
        const e: typeof errors = {};
        if (!form.label.trim()) e.label = a.required;
        if (!form.addressLine1.trim()) e.addressLine1 = a.required;
        if (!form.district.trim()) e.district = a.required;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (validate()) onSave(form);
    };

    const labels: Record<string, string> = {
        label: a.fieldLabel,
        addressLine1: a.fieldAddressLine1,
        addressLine2: a.fieldAddressLine2,
        district: a.fieldDistrict,
        city: a.fieldCity,
        deliveryInstructions: a.fieldInstructions,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-surface-900 dark:text-white text-lg">
                        {initial ? a.editTitle : a.newTitle}
                    </h3>
                    <button type="button" onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {(["label", "addressLine1", "addressLine2", "district", "city", "deliveryInstructions"] as const).map((key) => {
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
                    <span className="text-sm text-surface-700 dark:text-surface-300">{a.setAsDefault}</span>
                </label>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 h-11 rounded-xl border border-surface-300 dark:border-surface-600 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                        {a.cancel}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
                    >
                        {initial ? a.save : a.addAction}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export function AddressesPanelReal() {
    const { t } = useDashboardLocale();
    const a = t.clientAddresses;
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
                toast.success(a.toastAdded);
            } else {
                toast.error(a.toastAddError);
            }
        } catch (error) {
            toast.error(a.toastNetworkError);
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
                toast.success(a.toastUpdated);
            } else {
                toast.error(a.toastUpdateError);
            }
        } catch (error) {
            toast.error(a.toastNetworkError);
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
                    toast.success(a.toastDeleted);
                } else {
                    const data = await res.json();
                    toast.error(data.error || a.toastDeleteError);
                }
            } catch (error) {
                console.error("Delete error:", error);
                toast.error(a.toastNetworkErrorDelete);
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
                toast.success(a.toastDefaultUpdated);
            }
        } catch (error) {
            toast.error(a.toastDefaultError);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
                <p className="text-surface-500 text-sm">{a.loading}</p>
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
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">{a.title}</h2>
                        <p className="text-surface-600 dark:text-surface-400 text-sm">
                            {addresses.length > 0
                                ? a.savedCount
                                    .replace(/\{\{n\}\}/g, String(addresses.length))
                                    .replace(/\{\{s\}\}/g, addresses.length > 1 ? "s" : "")
                                : a.noneRegistered}
                        </p>
                    </div>
                    <button
                        onClick={() => setFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shrink-0 disabled:opacity-50"
                        disabled={isSaving}
                    >
                        <Plus size={15} />
                        {a.add}
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin size={40} className="mx-auto text-surface-200 dark:text-surface-700 mb-3" />
                        <p className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">{a.noneRegistered}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-500">{a.emptyDesc}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.map((addr) => (
                            <div key={addr.id}>
                                {deleteConfirm === addr.id && (
                                    <div className="mb-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-300 text-center font-medium animate-pulse">
                                        <Trash2 size={11} className="inline" /> {a.deleteConfirm}
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
