"use client";

import { useState } from "react";
import { Users, MoreVertical, QrCode, X, Download, ExternalLink } from "lucide-react";
import { Card, Badge, Dropdown, Button } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

interface TableCardProps {
    table: {
        id: string;
        number: string;
        capacity: number;
        status: string;
        zone_id: string | null;
        table_zones: { name: string; type: string } | null;
    };
    canManage: boolean;
    onStatusChange: (id: string, status: string) => void;
    onDelete: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    available: "bg-green-500/10 border-green-500/30 text-green-600",
    occupied: "bg-red-500/10 border-red-500/30 text-red-600",
    reserved: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
    cleaning: "bg-blue-500/10 border-blue-500/30 text-blue-600",
};

const STATUS_BADGE: Record<string, "success" | "default" | "warning" | "info" | "brand"> = {
    available: "success",
    occupied: "default",
    reserved: "warning",
    cleaning: "info",
};

export function TableCard({ table, canManage, onStatusChange, onDelete }: TableCardProps) {
    const { t } = useLocale();
    const { restaurant } = useDashboard();
    const [showQr, setShowQr] = useState(false);

    const statusLabel = t.tables[table.status as keyof typeof t.tables] ?? table.status;
    const statusKey = (table.status ?? "available") as string;

    const menuUrl = restaurant?.slug
        ? `https://kbouffe.com/r/${restaurant.slug}/table/${table.number}`
        : null;
    const qrImageUrl = menuUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(menuUrl)}&size=250x250&margin=10`
        : null;

    const statusActions = [
        { key: "available", label: t.tables.markAvailable },
        { key: "occupied", label: t.tables.markOccupied },
        { key: "reserved", label: t.tables.markReserved },
        { key: "cleaning", label: t.tables.markCleaning },
    ].filter((a) => a.key !== table.status);

    const dropdownItems = [
        ...statusActions.map((a) => ({
            label: a.label,
            onClick: () => onStatusChange(table.id, a.key),
        })),
        {
            label: t.tables.showQr ?? "Code QR",
            onClick: () => setShowQr(true),
            icon: <QrCode size={14} />,
        },
        {
            label: t.common.delete,
            onClick: () => onDelete(table.id),
            variant: "danger" as const,
        },
    ];

    return (
        <>
            <Card
                className={`relative p-4 border-2 transition-all ${STATUS_COLORS[statusKey] ?? STATUS_COLORS.available}`}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                            {table.number}
                        </h3>
                        {table.table_zones && (
                            <p className="text-xs text-surface-500 mt-0.5">{table.table_zones.name}</p>
                        )}
                    </div>
                    {canManage && (
                        <Dropdown
                            items={dropdownItems}
                            trigger={
                                <button className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            }
                        />
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-surface-500">
                        <Users size={14} />
                        <span>{table.capacity} {t.tables.seats}</span>
                    </div>
                    <Badge variant={STATUS_BADGE[statusKey] ?? "default"}>
                        {statusLabel}
                    </Badge>
                </div>

                {/* QR hint button */}
                {qrImageUrl && (
                    <button
                        onClick={() => setShowQr(true)}
                        className="mt-3 flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-500 transition-colors"
                    >
                        <QrCode size={13} />
                        <span>{t.tables.showQr ?? "Code QR"}</span>
                    </button>
                )}
            </Card>

            {/* QR Modal */}
            {showQr && qrImageUrl && menuUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQr(false)}>
                    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-surface-900 dark:text-white">
                                {t.tables.showQr ?? "Code QR"} — {table.number}
                            </h3>
                            <button onClick={() => setShowQr(false)} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                                <X size={20} />
                            </button>
                        </div>

                        {/* QR Image */}
                        <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrImageUrl}
                                alt={`QR ${table.number}`}
                                width={200}
                                height={200}
                                className="block"
                            />
                        </div>

                        <p className="text-xs text-surface-400 mb-4 break-all">{menuUrl}</p>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => window.open(menuUrl, "_blank")}
                            >
                                <ExternalLink size={13} />
                                {t.common.open ?? "Ouvrir"}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => {
                                    const a = document.createElement("a");
                                    a.href = qrImageUrl;
                                    a.download = `qr-table-${table.number}.png`;
                                    a.click();
                                }}
                            >
                                <Download size={13} />
                                {t.common.download ?? "Télécharger"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

