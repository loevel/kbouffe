"use client";

import { MoreVertical, Users } from "lucide-react";
import { 
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell, 
    TablePagination, Badge, Dropdown, Spinner, useLocale, useDashboard
} from "@kbouffe/module-core/ui";
import { Reservation } from "../../lib/types";

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

    return (
        <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-surface-50 dark:bg-surface-800/50">
                        <TableHead>{t.reservations.colName}</TableHead>
                        <TableHead>{t.reservations.colPartySize}</TableHead>
                        <TableHead>{t.reservations.colTable}</TableHead>
                        <TableHead>{t.reservations.colDateTime}</TableHead>
                        <TableHead>{t.reservations.colStatus}</TableHead>
                        <TableHead className="text-right">{t.reservations.colActions}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reservations.map((r) => {
                        const actions = getActions(r);
                        return (
                            <TableRow key={r.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                <TableCell>
                                    <div>
                                        <p className="font-semibold text-surface-900 dark:text-white">{r.customer_name}</p>
                                        {r.customer_phone && (
                                            <p className="text-xs text-surface-500 font-medium">{r.customer_phone}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-sm font-medium">
                                        <Users size={14} className="text-surface-400" />
                                        {r.party_size}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {(r as any).restaurant_tables ? (
                                        <span className="font-medium">
                                            #{ (r as any).restaurant_tables.number}
                                            { (r as any).restaurant_tables.table_zones && (
                                                <span className="text-xs text-surface-400 ml-1 font-normal">
                                                    ({ (r as any).restaurant_tables.table_zones.name})
                                                </span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-surface-400 italic">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">
                                        <p className="text-sm">{r.date}</p>
                                        <p className="text-xs text-surface-500">{r.time.slice(0, 5)}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`${STATUS_COLORS[r.status as string] ?? ""} font-bold uppercase tracking-wider text-[10px]`}>
                                        {getStatusLabel(r.status as string)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {processingId === r.id ? (
                                        <div className="flex justify-end pr-2"><Spinner size="sm" /></div>
                                    ) : actions.length > 0 && (
                                        <Dropdown
                                            trigger={
                                                <button className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all hover:scale-105 active:scale-95">
                                                    <MoreVertical size={18} className="text-surface-500" />
                                                </button>
                                            }
                                            items={actions}
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            {totalPages > 1 && (
                <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-800/10">
                    <TablePagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
            )}
        </div>
    );
}
