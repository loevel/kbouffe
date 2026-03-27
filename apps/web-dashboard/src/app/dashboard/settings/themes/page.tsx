"use client";

import { SettingsNav } from "@/components/dashboard/settings/SettingsNav";
import { ThemePickerForm } from "@/components/dashboard/settings/ThemePickerForm";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";
import { usePremiumCheck } from "@/hooks/use-premium";
import { Loader2 } from "lucide-react";

export default function ThemesSettingsPage() {
    const { isPremium, loading } = usePremiumCheck();

    return (
        <div className="space-y-6">
            <SettingsNav />
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-surface-400" />
                </div>
            ) : !isPremium ? (
                <PremiumUpgradeCard feature="Themes" />
            ) : (
                <ThemePickerForm />
            )}
        </div>
    );
}
