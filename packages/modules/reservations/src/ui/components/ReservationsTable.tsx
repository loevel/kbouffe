"use client";

import { useState } from "react";
import { MoreVertical, Users, Eye } from "lucide-react";
import { 
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell, 
    TablePagination, Badge, Dropdown, Spinner, useLocale, useDashboard
} from "@kbouffe/module-core/ui";
import { Reservation } from "../../lib/types";
import { ReservationDetailModal } from "./ReservationDetailModal";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    seated: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-300",
    no_show: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
};

interface ReservationsTableProps {
    reservations: Reservation[];
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    processingId: string | null;
    onStatusChange: (id: string, newStatus: string) => void;
    onDelete: (id: string) => void;
}

export function ReservationsTable({
    reservations,
    page,
    totalPages,
    onPageChange,
    processingId,
    onStatusChange,
    onDelete,
}: ReservationsTableProps) {
    const { t } = useLocale();
    const { can } = useDashboard();
    const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            pending: t.reservations.pending,
            confirmed: t.reservations.confirmed,
            seated: t.reservations.seated,
            completed: t.reservations.completed,
            no_show: t.reservations.noShow,
            cancelled: t.reservations.cancelled,
        };
        return map[status] ?? status;
    };

    const getActions = (reservation: Reservation) => {
        const items: { label: string; onClick: () => void; variant?: "danger" }[] = [];
        const s = reservation.status;
        if (s === "pending") {
            items.push({ label: t.reservations.confirmReservation, onClick: () => onStatusChange(reservation.id, "confirmed") });
            items.push({ label: t.reservations.markNoShow, onClick: () => onStatusChange(reservation.id, "no_show") });
        }
        if (s === "confirmed") {
            items.push({ label: t.reservations.seatGuests, onClick: () => onStatusChange(reservation.id, "seated") });
            items.push({ label: t.reservations.markNoShow, onClick: () => onStatusChange(reservation.id, "no_show") });
        }
        if (s === "seated") {
            items.push({ label: t.reservations.completeReservation, onClick: () => onStatusChange(reservation.id, "completed") });
        }
        if (s !== "completed" && s !== "cancelled" && s !== "no_show") {
            items.push({ label: t.reservations.cancelReservation, onClick: () => onStatusChange(reservation.id, "cancelled"), variant: "danger" });
        }
        if (can("reservations:manage")) {
            items.push({ label: t.common.delete, onClick: () => onDelete(reservation.id), variant: "danger" });
        }
        return items;
    };

    const occasionLabels: Record<string, { label: string; icon: string }> = {
        birthday: { label: t.reservations.occasionBirthday, icon: "🎂" },
        dinner: { label: t.reservations.occasionDinner, icon: "🍽️" },
        surprise: { label: t.reservations.occasionSurprise, icon: "🎁" },
        business: { label: t.reservations.occasionBusiness, icon: "💼" },
        anniversary: { label: t.reservations.occasionAnniversary, icon: "💍" },
        date: { label: t.reservations.occasionDate, icon: "❤️" },
        family: { label: t.reservations.occasionFamily, icon: "👨‍👩‍👧‍👦" },
        other: { label: t.reservations.occasionOther, icon: "📌" },
    };

    const renderDesktopRow = (r: Reservation) => {
        const actions = getActions(r);
        const occ = (r as any).occasion ? occasionLabels[(r as any).occasion] : null;
        const zoneData = (r as any).table_zones;
        return (
            <TableRow key={r.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                <TableCell>
                    <div>
                        <p className="font-semibold text-surface-900 dark:text-white text-sm">{r.customer_name}</p>
                        {r.customer_phone && (
                            <p className="text-xs text-surface-500 font-medium">{r.customer_phone}</p>
                        )}
                    </div>
                </TableCell>
                <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-xs font-medium">
                        <Users size={14} className="text-surface-400" />
                        {r.party_size}
                    </span>
                </TableCell>
                <TableCell>
                    {(r as any).restaurant_tables ? (
                        <span className="font-medium text-sm">#{(r as any).restaurant_tables.number}</span>
                    ) : (
                        <span className="text-surface-400 italic text-xs">—</span>
                    )}
                </TableCell>
                <TableCell>
                    {zoneData ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: zoneData.color ?? "#6366f1" }} />
                            {zoneData.name}
                        </span>
                    ) : (
                        <span className="text-surface-400 italic text-xs">—</span>
                    )}
                </TableCell>
                <TableCell>
                    {occ ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-surface-700 dark:text-surface-300">
                            <span>{occ.icon}</span>
                            <span className="hidden sm:inline">{occ.label}</span>
                        </span>
                    ) : (
                        <span className="text-surface-400 italic text-xs">—</span>
                    )}
                </TableCell>
                <TableCell>
                    <div className="font-medium">
                        <p className="text-xs">{r.date}</p>
                        <p className="text-xs text-surface-500">{r.time.slice(0, 5)}{r.duration ? ` · ${r.duration}min` : ""}</p>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge className={`${STATUS_COLORS[r.status as string] ?? ""} font-bold uppercase tracking-wider text-[9px] py-1`}>
                        {getStatusLabel(r.status as string)}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => setDetailReservation(r)}
                            className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 transition-all hover:scale-105 active:scale-95"
                            title="Voir les détails"
                        >
                            <Eye size={16} />
                        </button>
                        {processingId === r.id ? (
                            <div className="p-2"><Spinner size="sm" /></div>
                        ) : actions.length > 0 ? (
                            <Dropdown
                                trigger={
                                    <button className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all hover:scale-105 active:scale-95">
                                        <MoreVertical size={18} className="text-surface-500" />
                                    </button>
                                }
                                items={actions}
                            />
                        ) : null}
                    </div>
                </TableCell>
            </TableRow>
        );
    };

    const renderMobileCard = (r: Reservation) => {
        const actions = getActions(r);
        const occ = (r as any).occasion ? occasionLabels[(r as any).occasion] : null;
        const zoneData = (r as any).table_zones;
        return (
            <div key={r.id} className="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-100 dark:border-surface-800 p-3 space-y-2">
                {/* Header: name + status */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-surface-900 dark:text-white text-sm truncate">{r.customer_name}</p>
                        {r.customer_phone && <p className="text-xs text-surface-500 truncate">{r.customer_phone}</p>}
                    </div>
                    <Badge className={`${STATUS_COLORS[r.status as string] ?? ""} font-bold uppercase text-[9px] py-1 shrink-0`}>
                        {getStatusLabel(r.status as string)}
                    </Badge>
                </div>

                {/* Key info: date, time, party size */}
                <div className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                    <span>{r.date}</span>
                    <span>·</span>
                    <span>{r.time.slice(0, 5)}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                        <Users size={12} />
                        {r.party_size}
                    </span>
                </div>

                {/* Zone + Table + Occasion */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {zoneData && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: zoneData.color ?? "#6366f1" }} />
                            <span className="truncate font-medium">{zoneData.name}</span>
                        </div>
                    )}
                    {(r as any).restaurant_tables && (
                        <div className="font-medium">Table #{(r as any).restaurant_tables.number}</div>
                    )}
                    {occ && (
                        <div className="col-span-2 flex items-center gap-1 text-surface-700 dark:text-surface-300">
                            <span>{occ.icon}</span>
                            <span>{occ.label}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-1 flex gap-2">
                    <button
                        onClick={() => setDetailReservation(r)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/30 dark:text-brand-400 transition-all active:scale-95"
                    >
                        <Eye size={13} />
                        Détails
                    </button>
                    {processingId === r.id ? (
                        <div className="flex-1 flex justify-center"><Spinner size="sm" /></div>
                    ) : actions.length > 0 ? (
                        <div className="flex-1">
                            <Dropdown
                                trigger={
                                    <button className="w-full px-2 py-1.5 rounded-lg text-xs font-bold bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 transition-all active:scale-95">
                                        {actions[0].label.split(" ")[0]}...
                                    </button>
                                }
                                items={actions}
                                align="right"
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* Desktop version: Table */}
            <div className="hidden lg:block bg-white dark:bg-surface-900 rounded-xl shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-surface-50 dark:bg-surface-800/50">
                            <TableHead className="text-xs">{t.reservations.colName}</TableHead>
                            <TableHead className="text-xs">{t.reservations.colPartySize}</TableHead>
                            <TableHead className="text-xs">{t.reservations.colTable}</TableHead>
                            <TableHead className="text-xs">{t.reservations.colZone}</TableHead>
                            <TableHead className="text-xs">{t.reservations.colOccasion}</TableHead>
                            <TableHead className="text-xs">{t.reservations.colDateTime}</TableHead>
                            <TableHead className="text-xs">{t.reservations.colStatus}</TableHead>
                            <TableHead className="text-right text-xs">{t.reservations.colActions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.map((r) => renderDesktopRow(r))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile version: Cards */}
            <div className="lg:hidden space-y-3">
                {reservations.map((r) => renderMobileCard(r))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                    <TablePagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
            )}

            {/* Detail modal */}
            <ReservationDetailModal
                reservation={detailReservation}
                isOpen={detailReservation !== null}
                onClose={() => setDetailReservation(null)}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                processingId={processingId}
            />
        </div>
    );
}
