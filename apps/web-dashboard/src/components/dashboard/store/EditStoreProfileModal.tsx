"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Modal, Button, Input, Textarea, Select, toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

interface EditStoreProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EditStoreProfileModal({ isOpen, onClose }: EditStoreProfileModalProps) {
    const { restaurant, updateRestaurant } = useDashboard();
    const { t } = useLocale();
    const [form, setForm] = useState({
        name: "",
        description: "",
        address: "",
        city: "",
        postalCode: "",
        country: "Cameroun",
        phone: "",
        email: "",
        cuisineType: "",
        priceRange: "1",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (restaurant && isOpen) {
            setForm({
                name: restaurant.name ?? "",
                description: restaurant.description ?? "",
                address: restaurant.address ?? "",
                city: restaurant.city ?? "",
                postalCode: (restaurant as any).postal_code ?? "",
                country: (restaurant as any).country ?? "Cameroun",
                phone: restaurant.phone ?? "",
                email: restaurant.email ?? "",
                cuisineType: (restaurant as any).cuisine_type ?? "",
                priceRange: (restaurant as any).price_range?.toString() ?? "1",
            });
        }
    }, [restaurant, isOpen]);

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error(t.settings?.nameRequired || "Le nom est requis");
            return;
        }
        setLoading(true);

        const payload: any = {
            name: form.name,
            description: form.description || null,
            address: form.address || null,
            city: form.city || null,
            postalCode: form.postalCode || null,
            country: form.country || null,
            phone: form.phone || null,
            email: form.email || null,
            cuisineType: form.cuisineType || null,
            priceRange: parseInt(form.priceRange) || null,
        };

        const { error } = await updateRestaurant(payload);

        if (error) {
            toast.error(`${t.settings?.errorPrefix || "Erreur: "}${error}`);
        } else {
            toast.success(t.settings?.infoUpdated || "Informations mises à jour");
            onClose();
        }
        setLoading(false);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Modifier le profil"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input 
                            label={t.settings?.restaurantName || "Nom du restaurant"} 
                            value={form.name} 
                            onChange={(e) => updateField("name", e.target.value)} 
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Textarea 
                            label={t.settings?.description || "Description"} 
                            value={form.description} 
                            onChange={(e) => updateField("description", e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Input 
                            label={t.settings?.address || "Adresse"} 
                            value={form.address} 
                            onChange={(e) => updateField("address", e.target.value)} 
                        />
                    </div>
                    <Input 
                        label={t.settings?.city || "Ville"} 
                        value={form.city} 
                        onChange={(e) => updateField("city", e.target.value)} 
                    />
                    <Input 
                        label="Code postal" 
                        value={form.postalCode} 
                        onChange={(e) => updateField("postalCode", e.target.value)} 
                    />
                    <Input 
                        label={t.settings?.phone || "Téléphone"} 
                        value={form.phone} 
                        onChange={(e) => updateField("phone", e.target.value)} 
                    />
                    <Input 
                        label={t.settings?.email || "Email"} 
                        type="email" 
                        value={form.email} 
                        onChange={(e) => updateField("email", e.target.value)} 
                    />
                    <Input 
                        label="Type de cuisine" 
                        value={form.cuisineType} 
                        onChange={(e) => updateField("cuisineType", e.target.value)} 
                    />
                    <Select 
                        label="Gamme de prix" 
                        value={form.priceRange} 
                        onChange={(e) => updateField("priceRange", e.target.value)}
                        options={[
                            { value: "1", label: "€ (Économique)" },
                            { value: "2", label: "€€ (Moyen)" },
                            { value: "3", label: "€€€ (Cher)" },
                            { value: "4", label: "€€€€ (Très cher)" }
                        ]}
                    />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onClose} type="button">
                        {t.common?.cancel || "Annuler"}
                    </Button>
                    <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>
                        {t.common?.save || "Enregistrer"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
