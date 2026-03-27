"use client";

import { useState, useEffect } from "react";
import { Save, Store, MapPin, Phone, UtensilsCrossed, Wallet } from "lucide-react";
import { Modal, ModalFooter, Button, Input, Textarea, Select, toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

interface EditStoreProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRICE_RANGES = [
    { value: "1", label: "XAF (Économique)", sub: "Moins de 3 000 FCFA" },
    { value: "2", label: "XAF XAF (Abordable)", sub: "3 000 – 8 000 FCFA" },
    { value: "3", label: "XAF XAF XAF (Intermédiaire)", sub: "8 000 – 20 000 FCFA" },
    { value: "4", label: "XAF XAF XAF XAF (Haut de gamme)", sub: "+ 20 000 FCFA" },
];

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-500">
                {icon}
            </div>
            <p className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{label}</p>
        </div>
    );
}

export function EditStoreProfileModal({ isOpen, onClose }: EditStoreProfileModalProps) {
    const { restaurant, updateRestaurant } = useDashboard();
    const { t } = useLocale();
    const [form, setForm] = useState({
        name: "",
        description: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        cuisineType: "",
        priceRange: "2",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (restaurant && isOpen) {
            setForm({
                name: restaurant.name ?? "",
                description: restaurant.description ?? "",
                address: restaurant.address ?? "",
                city: restaurant.city ?? "",
                phone: restaurant.phone ?? "",
                email: restaurant.email ?? "",
                cuisineType: (restaurant as any).cuisine_type ?? "",
                priceRange: (restaurant as any).price_range?.toString() ?? "2",
            });
        }
    }, [restaurant, isOpen]);

    const set = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Le nom du restaurant est requis");
            return;
        }
        setLoading(true);

        const { error } = await updateRestaurant({
            name: form.name,
            description: form.description || null,
            address: form.address || null,
            city: form.city || null,
            phone: form.phone || null,
            email: form.email || null,
            cuisine_type: form.cuisineType || null,
            price_range: parseInt(form.priceRange) || null,
        } as any);

        if (error) {
            toast.error(error);
        } else {
            toast.success("Profil mis à jour ✓");
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
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* ── Identité ── */}
                    <div>
                        <SectionHeader icon={<Store size={14} />} label="Identité" />
                        <div className="space-y-3">
                            <Input
                                label="Nom du restaurant"
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                placeholder="Ex: Le Saveur d'Akwa"
                                required
                            />
                            <Textarea
                                label="Description"
                                value={form.description}
                                onChange={(e) => set("description", e.target.value)}
                                placeholder="Décrivez votre restaurant en quelques mots…"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* ── Localisation ── */}
                    <div>
                        <SectionHeader icon={<MapPin size={14} />} label="Localisation" />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <Input
                                    label="Adresse"
                                    value={form.address}
                                    onChange={(e) => set("address", e.target.value)}
                                    placeholder="Ex: Rue de la joie, face Total, Akwa"
                                />
                            </div>
                            <Input
                                label="Ville"
                                value={form.city}
                                onChange={(e) => set("city", e.target.value)}
                                placeholder="Ex: Douala"
                            />
                        </div>
                    </div>

                    {/* ── Contact ── */}
                    <div>
                        <SectionHeader icon={<Phone size={14} />} label="Contact" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Téléphone"
                                value={form.phone}
                                onChange={(e) => set("phone", e.target.value)}
                                placeholder="6XX XXX XXX"
                                type="tel"
                            />
                            <Input
                                label="Email"
                                value={form.email}
                                onChange={(e) => set("email", e.target.value)}
                                placeholder="contact@restaurant.cm"
                                type="email"
                            />
                        </div>
                    </div>

                    {/* ── Restauration ── */}
                    <div>
                        <SectionHeader icon={<UtensilsCrossed size={14} />} label="Cuisine" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Type de cuisine"
                                value={form.cuisineType}
                                onChange={(e) => set("cuisineType", e.target.value)}
                                placeholder="Ex: Africaine, Créole…"
                            />
                            <div>
                                <Select
                                    label="Gamme de prix"
                                    value={form.priceRange}
                                    onChange={(e) => set("priceRange", e.target.value)}
                                    options={PRICE_RANGES.map((p) => ({ value: p.value, label: p.label }))}
                                />
                                {(() => {
                                    const selected = PRICE_RANGES.find((p) => p.value === form.priceRange);
                                    return selected ? (
                                        <p className="text-[11px] text-surface-400 mt-1">{selected.sub}</p>
                                    ) : null;
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="outline" type="button" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button type="submit" leftIcon={<Save size={16} />} isLoading={loading}>
                        Enregistrer
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
