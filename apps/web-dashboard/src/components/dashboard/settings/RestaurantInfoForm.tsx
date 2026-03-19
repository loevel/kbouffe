"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, AlertCircle, Facebook, Instagram, Twitter, Globe } from "lucide-react";
import { Card, Button, Input, Textarea, Select, Toggle } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

const CUISINE_OPTIONS = [
    { value: "african", label: "Africaine" },
    { value: "cameroonian", label: "Camerounaise" },
    { value: "grillades", label: "Grillades / Braises" },
    { value: "fast_food", label: "Fast Food" },
    { value: "international", label: "Internationale" },
    { value: "patisserie", label: "Pâtisserie" },
    { value: "boissons", label: "Bar / Boissons" },
];

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
        cuisineTypes: [] as string[],
        priceRange: "2",
        welcomeMessage: "",
        socialLinks: { facebook: "", instagram: "", twitter: "", website: "" },
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (restaurant) {
            setForm({
                name: restaurant.name ?? "",
                description: restaurant.description ?? "",
                address: restaurant.address ?? "",
                city: restaurant.city ?? "",
                postalCode: restaurant.postalCode ?? "",
                country: restaurant.country ?? "Cameroun",
                phone: restaurant.phone ?? "",
                email: restaurant.email ?? "",
                cuisineTypes: restaurant.cuisineTypes ?? [],
                priceRange: restaurant.priceRange?.toString() ?? "2",
                welcomeMessage: restaurant.welcomeMessage ?? "",
                socialLinks: restaurant.socialLinks ?? { facebook: "", instagram: "", twitter: "", website: "" },
            });
        }
    }, [restaurant]);

    const updateField = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSocial = (platform: string, value: string) => {
        setForm(prev => ({ 
            ...prev, 
            socialLinks: { ...prev.socialLinks, [platform]: value } 
        }));
    };

    const toggleCuisine = (val: string) => {
        const current = form.cuisineTypes;
        if (current.includes(val)) {
            updateField("cuisineTypes", current.filter(c => c !== val));
        } else {
            updateField("cuisineTypes", [...current, val]);
        }
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!form.name.trim()) next.name = t.settings.nameRequired;
        return next;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const validation = validate();
        setErrors(validation);
        if (Object.keys(validation).length) { 
            toast.error(t.settings.errorPrefix + Object.values(validation)[0]); 
            return; 
        }
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
            cuisineTypes: form.cuisineTypes,
            priceRange: parseInt(form.priceRange) || null,
            welcomeMessage: form.welcomeMessage || null,
            socialLinks: form.socialLinks,
        });

        if (error) {
            toast.error(`${t.settings.errorPrefix}${error}`);
        } else {
            toast.success(t.settings.infoUpdated);
        }
        setLoading(false);
    };

    const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

    if (dashboardLoading) return <Card className="animate-pulse h-96 bg-surface-50 dark:bg-surface-800/20" />;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.settings.generalInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                        label={t.settings.restaurantName} 
                        value={form.name} 
                        onChange={(e) => updateField("name", e.target.value)} 
                        error={errors.name}
                    />
                    <Select 
                        label={t.settings.priceRange} 
                        value={form.priceRange} 
                        onChange={(e) => updateField("priceRange", e.target.value)}
                        options={[
                            { value: "1", label: "FCFA (Économique)" },
                            { value: "2", label: "FCFA FCFA (Moyen)" },
                            { value: "3", label: "FCFA FCFA FCFA (Cher)" },
                        ]}
                    />
                    <div className="md:col-span-2">
                        <Textarea 
                            label={t.settings.description} 
                            value={form.description} 
                            onChange={(e) => updateField("description", e.target.value)} 
                            rows={3}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                            Type de cuisine (multi-sélection)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CUISINE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => toggleCuisine(opt.value)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        form.cuisineTypes.includes(opt.value)
                                            ? "bg-brand-500 text-white border-brand-500 shadow-md"
                                            : "bg-surface-50 dark:bg-surface-800 border-surface-100 dark:border-surface-700 text-surface-500"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Localisation & Contact</h3>
                    <div className="space-y-4">
                        <Input label={t.settings.address} value={form.address} onChange={(e) => updateField("address", e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label={t.settings.city} value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                            <Input label={t.settings.phone} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                        </div>
                        <Input label={t.settings.email} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                    </div>
                </Card>

                <Card>
                    <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Réseaux Sociaux</h3>
                    <div className="space-y-4">
                        <Input 
                            label="Facebook" 
                            value={form.socialLinks.facebook} 
                            onChange={(e) => updateSocial("facebook", e.target.value)} 
                            leftIcon={<Facebook size={16} />}
                        />
                        <Input 
                            label="Instagram" 
                            value={form.socialLinks.instagram} 
                            onChange={(e) => updateSocial("instagram", e.target.value)} 
                            leftIcon={<Instagram size={16} />}
                        />
                        <Input 
                            label="Site Web" 
                            value={form.socialLinks.website} 
                            onChange={(e) => updateSocial("website", e.target.value)} 
                            leftIcon={<Globe size={16} />}
                        />
                    </div>
                </Card>
            </div>

            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Personnalisation du Menu</h3>
                <div className="space-y-4">
                    <Input 
                        label="Message d'accueil personnalisé" 
                        placeholder="Ex: Bienvenue chez Mama Ngono ! Découvrez nos saveurs locales..."
                        value={form.welcomeMessage} 
                        onChange={(e) => updateField("welcomeMessage", e.target.value)} 
                    />
                </div>
            </Card>

            <div className="flex justify-end gap-3">
                <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading} disabled={hasErrors} className="px-8">
                    {t.common.save}
                </Button>
            </div>
        </form>
    );
}
