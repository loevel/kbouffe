"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Card, Button, Input, Textarea, Select } from "@/components/ui";
import { toast } from "@/components/ui";
import { useDashboard } from "@/contexts/dashboard-context";
import { useLocale } from "@/contexts/locale-context";

export function RestaurantInfoForm() {
    const { restaurant, updateRestaurant, loading: dashboardLoading } = useDashboard();
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

    // Synchroniser le formulaire avec les données du restaurant
    useEffect(() => {
        if (restaurant) {
            setForm({
                name: restaurant.name ?? "",
                description: restaurant.description ?? "",
                address: restaurant.address ?? "",
                city: restaurant.city ?? "",
                postalCode: restaurant.postal_code ?? "",
                country: restaurant.country ?? "Cameroun",
                phone: restaurant.phone ?? "",
                email: restaurant.email ?? "",
                cuisineType: restaurant.cuisine_type ?? "",
                priceRange: restaurant.price_range?.toString() ?? "1",
            });
        }
    }, [restaurant]);

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error(t.settings.nameRequired); return; }
        setLoading(true);

        const { error } = await updateRestaurant({
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
        });

        if (error) {
            toast.error(`${t.settings.errorPrefix}${error}`);
        } else {
            toast.success(t.settings.infoUpdated);
        }
        setLoading(false);
    };

    if (dashboardLoading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
                        <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.settings.generalInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label={t.settings.restaurantName} value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                    <div className="md:col-span-2">
                        <Input label={t.settings.address} value={form.address} onChange={(e) => updateField("address", e.target.value)} />
                    </div>
                    <Input label={t.settings.city} value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                    <Input label={t.settings.postalCode} value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
                    <Input label={t.settings.country} value={form.country} onChange={(e) => updateField("country", e.target.value)} />
                    <Input label={t.settings.phone} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                    <Input label={t.settings.email} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                    <Input label={t.settings.cuisineType} value={form.cuisineType} onChange={(e) => updateField("cuisineType", e.target.value)} />
                    <Select 
                        label={t.settings.priceRange} 
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
                <div className="mt-6 flex justify-end">
                    <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>{t.common.save}</Button>
                </div>
            </Card>
        </form>
    );
}
