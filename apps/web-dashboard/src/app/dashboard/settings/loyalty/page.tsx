"use client";

import { useState, useEffect } from "react";
import { SettingsNav } from "@/components/dashboard/settings/SettingsNav";
import { useLocale, Card, Button, Input, Toggle, toast, Badge, Spinner } from "@kbouffe/module-core/ui";
import { Star, Save, Plus, Trash2, Gift, Users } from "lucide-react";
import { useRestaurant } from "@/hooks/use-data";

interface RewardTier {
    id: string;
    points: number;
    reward: string;
}

export default function LoyaltySettingsPage() {
    const { t } = useLocale();
    const { restaurant, isLoading, updateRestaurant } = useRestaurant();
    const [saving, setSaving] = useState(false);
    
    const [enabled, setEnabled] = useState(false);
    const [pointsPerOrder, setPointsPerOrder] = useState("10");
    const [pointsValue, setPointsValue] = useState("1");
    const [minRedeemPoints, setMinRedeemPoints] = useState("100");
    const [tiers, setTiers] = useState<RewardTier[]>([]);

    useEffect(() => {
        if (restaurant) {
            setEnabled(restaurant.loyaltyEnabled ?? false);
            setPointsPerOrder(String(restaurant.loyaltyPointsPerOrder ?? 10));
            setPointsValue(String(restaurant.loyaltyPointValue ?? 1));
            setMinRedeemPoints(String(restaurant.loyaltyMinRedeemPoints ?? 100));
            setTiers(restaurant.loyaltyRewardTiers || []);
        }
    }, [restaurant]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateRestaurant({
                loyaltyEnabled: enabled,
                loyaltyPointsPerOrder: parseInt(pointsPerOrder),
                loyaltyPointValue: parseInt(pointsValue),
                loyaltyMinRedeemPoints: parseInt(minRedeemPoints),
                loyaltyRewardTiers: tiers,
            });
            toast.success(t.loyalty.saved);
        } catch (err: any) {
            toast.error(err.message || "Erreur de sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    const addTier = () => {
        const newTier: RewardTier = {
            id: Math.random().toString(36).substr(2, 9),
            points: 0,
            reward: "",
        };
        setTiers([...tiers, newTier]);
    };

    const removeTier = (id: string) => {
        setTiers(tiers.filter(t => t.id !== id));
    };

    const updateTier = (id: string, field: keyof RewardTier, value: any) => {
        setTiers(tiers.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.settings.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.settings.subtitle}</p>
            </div>
            
            <SettingsNav />

            <div className="max-w-4xl space-y-6">
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="font-bold text-surface-900 dark:text-white">{t.loyalty.title}</h3>
                                <p className="text-sm text-surface-500">{t.loyalty.subtitle}</p>
                            </div>
                        </div>
                        <Toggle checked={enabled} onChange={setEnabled} />
                    </div>

                    <div className={enabled ? "opacity-100" : "opacity-50 pointer-events-none"}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input
                                label={t.loyalty.pointsPerOrder}
                                type="number"
                                value={pointsPerOrder}
                                onChange={(e) => setPointsPerOrder(e.target.value)}
                                hint="Points gagnés par commande"
                            />
                            <Input
                                label={t.loyalty.pointsValue}
                                type="number"
                                value={pointsValue}
                                onChange={(e) => setPointsValue(e.target.value)}
                                hint="1 point = X FCFA"
                            />
                            <Input
                                label={t.loyalty.minRedeemPoints}
                                type="number"
                                value={minRedeemPoints}
                                onChange={(e) => setMinRedeemPoints(e.target.value)}
                                hint="Seuil pour utiliser les points"
                            />
                        </div>
                    </div>
                </Card>

                {enabled && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <h4 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Gift size={18} className="text-brand-500" />
                                    {t.loyalty.rewardTiers}
                                </h4>
                                <div className="space-y-4">
                                    {tiers.map((tier) => (
                                        <div key={tier.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Points"
                                                    type="number"
                                                    value={tier.points.toString()}
                                                    onChange={(e) => updateTier(tier.id, "points", parseInt(e.target.value))}
                                                    className="h-9 text-sm"
                                                />
                                                <Input
                                                    placeholder="Récompense (ex: -500 FCFA)"
                                                    value={tier.reward}
                                                    onChange={(e) => updateTier(tier.id, "reward", e.target.value)}
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeTier(tier.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-dashed"
                                        leftIcon={<Plus size={16} />}
                                        onClick={addTier}
                                    >
                                        {t.loyalty.addTier}
                                    </Button>
                                </div>
                            </Card>

                            <Card>
                                <h4 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Users size={18} className="text-brand-500" />
                                    Statistiques de fidélité
                                </h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-surface-500">{t.loyalty.activeMembers}</p>
                                        <p className="text-xl font-bold text-surface-900 dark:text-white">124</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-surface-500">{t.loyalty.pointsEarned}</p>
                                        <p className="text-xl font-bold text-surface-900 dark:text-white">45,200</p>
                                    </div>
                                    <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
                                        <p className="text-xs text-surface-400 leading-relaxed italic">
                                            Le programme de fidélité augmente la rétention client de 25% en moyenne sur Kbouffe.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                leftIcon={<Save size={18} />}
                                onClick={handleSave}
                                isLoading={saving}
                                className="px-8"
                            >
                                {t.common.save}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
