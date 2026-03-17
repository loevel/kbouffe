"use client";

import { Tag, Megaphone, TrendingUp, Eye } from "lucide-react";
import { Card } from "@/components/ui";
import { useCoupons, useCampaigns } from "@/hooks/use-data";
import { useLocale } from "@/contexts/locale-context";

export function MarketingStats() {
    const { t } = useLocale();
    const { coupons } = useCoupons();
    const { campaigns, activeCampaign } = useCampaigns();

    const now = new Date();
    const activeCoupons = coupons.filter(
        (c: any) =>
            c.is_active &&
            (!c.starts_at || new Date(c.starts_at) <= now) &&
            (!c.expires_at || new Date(c.expires_at) >= now)
    );
    const totalCouponUses = coupons.reduce((acc: number, c: any) => acc + (c.current_uses ?? 0), 0);
    const totalImpressions = campaigns.reduce((acc: number, c: any) => acc + (c.impressions ?? 0), 0);

    const stats = [
        {
            label: t.marketing.activeCoupons,
            value: activeCoupons.length,
            icon: Tag,
            color: "text-brand-500",
            bg: "bg-brand-50 dark:bg-brand-900/20",
        },
        {
            label: t.marketing.totalUses,
            value: totalCouponUses,
            icon: TrendingUp,
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-900/20",
        },
        {
            label: t.marketing.activeCampaign,
            value: activeCampaign ? "1" : t.marketing.noCampaign,
            icon: Megaphone,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900/20",
        },
        {
            label: t.marketing.impressions,
            value: totalImpressions.toLocaleString(),
            icon: Eye,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-900/20",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <Card key={stat.label}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                                {stat.label}
                            </p>
                            <p className="text-xl font-bold text-surface-900 dark:text-white mt-0.5">
                                {stat.value}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
