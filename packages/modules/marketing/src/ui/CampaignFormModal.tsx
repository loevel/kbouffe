"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Modal, ModalFooter, Button, Input, Toggle, toast } from "@/components/ui";
import { useCampaigns } from "@/hooks/use-data";
import { useLocale } from "@/contexts/locale-context";
import { formatCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdCampaignPackage } from "@/lib/supabase/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const PACKAGES: { id: AdCampaignPackage; days: number; price: number }[] = [
    { id: "basic", days: 7, price: 15000 },
    { id: "premium", days: 14, price: 35000 },
    { id: "elite", days: 30, price: 75000 },
];

export function CampaignFormModal({ isOpen, onClose }: Props) {
    const { t } = useLocale();
    const { createCampaign } = useCampaigns();

    const [selectedPackage, setSelectedPackage] = useState<AdCampaignPackage>("basic");
    const [startsAt, setStartsAt] = useState("");
    const [includePush, setIncludePush] = useState(false);
    const [pushMessage, setPushMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [pushError, setPushError] = useState("");

    function reset() {
        setSelectedPackage("basic");
        setStartsAt("");
        setIncludePush(false);
        setPushMessage("");
        setPushError("");
    }

    async function handleSubmit() {
        if (includePush && !pushMessage.trim()) {
            setPushError("Le message est requis si vous activez la notification push");
            return;
        }
        setSaving(true);
        try {
            await createCampaign({
                package: selectedPackage,
                starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
                include_push: includePush,
                push_message: includePush ? pushMessage.trim() : undefined,
            });
            toast.success(t.ads.created);
            reset();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
        } finally {
            setSaving(false);
        }
    }

    const pkg = PACKAGES.find((p: any) => p.id === selectedPackage)!;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.ads.new} size="lg">
            <div className="space-y-6">
                {/* Package selector */}
                <div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                        {t.ads.package}
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        {PACKAGES.map((p) => {
                            const isSelected = selectedPackage === p.id;
                            const label = p.id === "basic" ? t.ads.packageBasic : p.id === "premium" ? t.ads.packagePremium : t.ads.packageElite;
                            const desc = p.id === "basic" ? t.ads.packageBasicDesc : p.id === "premium" ? t.ads.packagePremiumDesc : t.ads.packageEliteDesc;

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedPackage(p.id)}
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                                        isSelected
                                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                                            : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                        isSelected ? "border-brand-500 bg-brand-500" : "border-surface-300"
                                    )}>
                                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-surface-900 dark:text-white">{label}</span>
                                            <span className="font-bold text-brand-600">{formatCFA(p.price)}</span>
                                        </div>
                                        <p className="text-sm text-surface-500 mt-0.5">{desc}</p>
                                        <p className="text-xs text-surface-400 mt-1">{p.days} jours</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Start date */}
                <Input
                    label={t.ads.startsAt}
                    type="date"
                    value={startsAt}
                    onChange={(e: any) => setStartsAt(e.target.value)}
                    hint={`${t.common.optional} — par défaut: aujourd'hui`}
                    min={new Date().toISOString().slice(0, 10)}
                />

                {/* Push notification option — only for premium/elite or if user opts-in */}
                <div className="space-y-3 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                    <Toggle
                        label={t.ads.includePush}
                        checked={includePush}
                        onChange={(v: any) => { setIncludePush(v); if (!v) setPushError(""); }}
                        description={`+5 000 FCFA — envoi unique à tous vos clients abonnés`}
                    />
                    {includePush && (
                        <Input
                            label={t.ads.pushMessage}
                            value={pushMessage}
                            onChange={(e: any) => { setPushMessage(e.target.value); setPushError(""); }}
                            placeholder={t.ads.pushMessagePlaceholder}
                            error={pushError}
                            maxLength={150}
                        />
                    )}
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4 text-sm space-y-1.5">
                    <div className="flex justify-between">
                        <span className="text-surface-600 dark:text-surface-400">{t.ads.package}</span>
                        <span className="font-medium">{formatCFA(pkg.price)}</span>
                    </div>
                    {includePush && (
                        <div className="flex justify-between">
                            <span className="text-surface-600 dark:text-surface-400">Push notification</span>
                            <span className="font-medium">{formatCFA(5000)}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t border-surface-200 dark:border-surface-700 pt-1.5 mt-1.5">
                        <span className="font-semibold text-surface-900 dark:text-white">{t.common.total}</span>
                        <span className="font-bold text-brand-600">{formatCFA(pkg.price + (includePush ? 5000 : 0))}</span>
                    </div>
                    <p className="text-xs text-surface-400 pt-1">
                        La campagne sera activée après validation par l'équipe kbouffe (24h max).
                    </p>
                </div>
            </div>

            <ModalFooter>
                <Button variant="ghost" onClick={() => { reset(); onClose(); }} disabled={saving}>
                    {t.common.cancel}
                </Button>
                <Button onClick={handleSubmit} isLoading={saving}>
                    {t.common.confirm} — {formatCFA(pkg.price + (includePush ? 5000 : 0))}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
