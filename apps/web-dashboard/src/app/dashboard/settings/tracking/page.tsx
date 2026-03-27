"use client";

import { SettingsNav } from "@/components/dashboard/settings/SettingsNav";
import { TrackingPixelsForm } from "@/components/dashboard/settings/TrackingPixelsForm";
import { ProductFeedCard } from "@/components/dashboard/settings/ProductFeedCard";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";
import { usePremiumCheck } from "@/hooks/use-premium";
import { Loader2 } from "lucide-react";

export default function TrackingSettingsPage() {
    const { isPremium, loading } = usePremiumCheck();

    return (
        <div className="space-y-6">
            <SettingsNav />
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-surface-400" />
                </div>
            ) : !isPremium ? (
                <PremiumUpgradeCard feature="Pixels & Analytics" />
            ) : (
                <>
                    <TrackingPixelsForm />
                    <ProductFeedCard />
                </>
            )}
        </div>
    );
}
