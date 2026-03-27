"use client";

import { AnnouncementsManager } from "@/components/dashboard/store/AnnouncementsManager";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";
import { usePremiumCheck } from "@/hooks/use-premium";
import { Loader2 } from "lucide-react";

export default function AnnouncementsPage() {
    const { isPremium, loading } = usePremiumCheck();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-surface-400" />
            </div>
        );
    }

    if (!isPremium) {
        return <PremiumUpgradeCard feature="Annonces" />;
    }

    return <AnnouncementsManager />;
}
