"use client";

import { useState } from "react";
import { Megaphone, XCircle } from "lucide-react";
import {
    Card,
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
    Badge, Button, EmptyState, toast,
    formatCFA, formatDate,
    useLocale,
} from "@kbouffe/module-core/ui";
import { useCampaigns } from "../hooks/use-marketing";
import type { AdCampaign, AdCampaignStatus } from "../lib/types";
import { CampaignFormModal } from "./CampaignFormModal";

function statusVariant(status: AdCampaignStatus): "success" | "warning" | "default" | "info" {
    if (status === "active") return "success";
    if (status === "pending") return "warning";
    if (status === "completed") return "info";
    return "default";
}

export function CampaignsTable() {
    const { t } = useLocale();
    const { campaigns, isLoading, cancelCampaign } = useCampaigns();
    const [showModal, setShowModal] = useState(false);

    async function handleCancel(campaign: AdCampaign) {
        if (!confirm(t.ads.cancelConfirm)) return;
        try {
            await cancelCampaign(campaign.id);
            toast.success(t.ads.cancelled);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
        }
    }

    const statusLabel = (s: AdCampaignStatus) =>
        s === "active" ? t.ads.statusActive
        : s === "pending" ? t.ads.statusPending
        : s === "completed" ? t.ads.statusCompleted
        : t.ads.statusCancelled;

    const packageLabel = (pkg: string) =>
        pkg === "basic" ? t.ads.packageBasic
        : pkg === "premium" ? t.ads.packagePremium
        : t.ads.packageElite;

    return (
        <>
            <Card padding="none">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900 dark:text-white">{t.ads.title}</h3>
                    <Button
                        size="sm"
                        leftIcon={<Megaphone size={14} />}
                        onClick={() => setShowModal(true)}
                    >
                        {t.ads.new}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-surface-400">{t.common.loading}</div>
                ) : campaigns.length === 0 ? (
                    <EmptyState
                        icon={<Megaphone size={40} />}
                        title={t.ads.empty}
                        description={t.ads.emptyDesc}
                        action={
                            <Button onClick={() => setShowModal(true)}>{t.ads.new}</Button>
                        }
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.ads.colPackage}</TableHead>
                                <TableHead>{t.ads.colPeriod}</TableHead>
                                <TableHead>{t.ads.colImpressions}</TableHead>
                                <TableHead>{t.ads.colBudget}</TableHead>
                                <TableHead>{t.ads.colStatus}</TableHead>
                                <TableHead>{t.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign: any) => (
                                <TableRow key={campaign.id}>
                                    <TableCell>
                                        <div className="font-medium">{packageLabel(campaign.package)}</div>
                                        {campaign.include_push && (
                                            <div className="text-xs text-brand-500 mt-0.5">+ Push 📣</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-surface-600 dark:text-surface-400">
                                        {formatDate(campaign.starts_at)}
                                        {" → "}
                                        {formatDate(campaign.ends_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div>{campaign.impressions.toLocaleString()}</div>
                                        <div className="text-xs text-surface-400">{campaign.clicks} clics</div>
                                    </TableCell>
                                    <TableCell className="font-medium">{formatCFA(campaign.budget)}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant(campaign.status)}>
                                            {statusLabel(campaign.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(campaign.status === "pending" || campaign.status === "active") && (
                                            <button
                                                onClick={() => handleCancel(campaign)}
                                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                title={t.ads.cancel}
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <CampaignFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    );
}
