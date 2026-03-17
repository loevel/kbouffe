"use client";

import { useEffect, useState } from "react";
import { Save, Plus, X } from "lucide-react";
import { Card, Button, Input } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import type { Json } from "@/lib/supabase/types";

export function DeliverySettingsForm() {
    const { restaurant, updateRestaurant } = useDashboard();
    const { t } = useLocale();
    const [form, setForm] = useState({
        deliveryBaseFee: restaurant?.delivery_base_fee?.toString() ?? "0",
        deliveryPerKmFee: restaurant?.delivery_per_km_fee?.toString() ?? "0",
        maxDeliveryRadiusKm: restaurant?.max_delivery_radius_km?.toString() ?? "10",
        minOrderAmount: restaurant?.min_order_amount?.toString() ?? "0",
    });
    const [zones, setZones] = useState<string[]>(
        (restaurant?.delivery_zones as unknown as string[]) ?? []
    );
    const [newZone, setNewZone] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!restaurant) return;
        setForm({
            deliveryBaseFee: restaurant.delivery_base_fee?.toString() ?? "0",
            deliveryPerKmFee: restaurant.delivery_per_km_fee?.toString() ?? "0",
            maxDeliveryRadiusKm: restaurant.max_delivery_radius_km?.toString() ?? "10",
            minOrderAmount: restaurant.min_order_amount?.toString() ?? "0",
        });
        setZones((restaurant.delivery_zones as unknown as string[]) ?? []);
    }, [restaurant]);

    const addZone = () => {
        if (newZone.trim() && !zones.includes(newZone.trim())) {
            setZones(prev => [...prev, newZone.trim()]);
            setNewZone("");
        }
    };

    const removeZone = (zone: string) => {
        setZones(prev => prev.filter(z => z !== zone));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await updateRestaurant({
            delivery_base_fee: Number(form.deliveryBaseFee) || 0,
            delivery_per_km_fee: Number(form.deliveryPerKmFee) || 0,
            max_delivery_radius_km: Number(form.maxDeliveryRadiusKm) || 10,
            min_order_amount: Number(form.minOrderAmount) || 0,
            delivery_zones: zones as unknown as Json,
        });
        if (error) {
            toast.error(`${t.settings.errorPrefix}${error}`);
        } else {
            toast.success(t.settings.deliveryUpdated);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.settings.pricing}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label={t.settings.deliveryBaseFee}
                        type="number"
                        value={form.deliveryBaseFee}
                        onChange={(e) => setForm(prev => ({ ...prev, deliveryBaseFee: e.target.value }))}
                    />
                    <Input
                        label={t.settings.deliveryPerKmFee}
                        type="number"
                        value={form.deliveryPerKmFee}
                        onChange={(e) => setForm(prev => ({ ...prev, deliveryPerKmFee: e.target.value }))}
                    />
                    <Input
                        label={t.settings.maxDeliveryRadiusKm}
                        type="number"
                        value={form.maxDeliveryRadiusKm}
                        onChange={(e) => setForm(prev => ({ ...prev, maxDeliveryRadiusKm: e.target.value }))}
                    />
                    <Input
                        label={t.settings.minOrder}
                        type="number"
                        value={form.minOrderAmount}
                        onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                    />
                </div>
            </Card>

            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.settings.deliveryZones}</h3>
                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder={t.settings.addZone}
                        value={newZone}
                        onChange={(e) => setNewZone(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addZone(); } }}
                    />
                    <Button type="button" variant="outline" leftIcon={<Plus size={16} />} onClick={addZone}>
                        {t.settings.addZoneBtn}
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {zones.map((zone) => (
                        <span key={zone} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 rounded-lg text-sm font-medium text-surface-700 dark:text-surface-300">
                            {zone}
                            <button type="button" onClick={() => removeZone(zone)} className="text-surface-400 hover:text-red-500 transition-colors">
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                    {zones.length === 0 && (
                        <p className="text-sm text-surface-400">{t.settings.noZones}</p>
                    )}
                </div>
            </Card>

            <Card className="border-brand-500/30 bg-brand-500/5">
                <h3 className="font-semibold text-brand-600 dark:text-brand-400 mb-2">{t.settings.deliveryResponsibility}</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                    {t.settings.deliveryResponsibilityNotice}
                </p>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>{t.common.save}</Button>
            </div>
        </form>
    );
}
