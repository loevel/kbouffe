"use client";

import {
    Modal,
    Badge,
    useLocale,
    useDashboard,
    Spinner,
} from "@kbouffe/module-core/ui";
import {
    CalendarDays,
    Clock,
    Users,
    MapPin,
    Phone,
    Mail,
    MessageSquare,
    Hash,
    Tag,
    CircleDot,
    BanknoteIcon,
    CheckCircle2,
    UserCircle2,
} from "lucide-react";
import { Reservation } from "../../lib/types";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    seated: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-300",
    no_show: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
};

interface ReservationDetailModalProps {
    reservation: Reservation | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: (id: string, newStatus: string) => void;
    onDelete: (id: string) => void;
    processingId: string | null;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-surface-100 dark:border-surface-800 last:border-0">
            <div className="mt-0.5 text-surface-400 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-surface-500 font-medium mb-0.5">{label}</p>
                <div className="text-sm font-semibold text-surface-900 dark:text-white">{value}</div>
            </div>
        </div>
    );
}

export function ReservationDetailModal({
    reservation: r,
    isOpen,
    onClose,
    onStatusChange,
    onDelete,
    processingId,
}: ReservationDetailModalProps) {
    const { t } = useLocale();
    const { can } = useDashboard();

    if (!r) return null;

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

    const occ = r.occasion ? occasionLabels[r.occasion] : null;
    const zoneData = (r as any).table_zones;
    const tableData = (r as any).restaurant_tables;
    const isProcessing = processingId === r.id;
    const s = r.status;

    const actionButtons: { label: string; status: string; className: string }[] = [];
    if (s === "pending") {
        actionButtons.push({ label: t.reservations.confirmReservation, status: "confirmed", className: "bg-blue-600 hover:bg-blue-700 text-white" });
    }
    if (s === "confirmed") {
        actionButtons.push({ label: t.reservations.seatGuests, status: "seated", className: "bg-green-600 hover:bg-green-700 text-white" });
    }
    if (s === "seated") {
        actionButtons.push({ label: t.reservations.completeReservation, status: "completed", className: "bg-surface-700 hover:bg-surface-800 text-white dark:bg-surface-600 dark:hover:bg-surface-500" });
    }
    if (["pending", "confirmed"].includes(s as string)) {
        actionButtons.push({ label: t.reservations.markNoShow, status: "no_show", className: "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400" });
    }
    if (s !== "completed" && s !== "cancelled" && s !== "no_show") {
        actionButtons.push({ label: t.reservations.cancelReservation, status: "cancelled", className: "bg-surface-100 hover:bg-surface-200 text-surface-700 dark:bg-surface-700 dark:hover:bg-surface-600 dark:text-surface-300" });
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Détails de la réservation">
            <div className="space-y-4">
                {/* Status header */}
                <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
                    <div>
                        <p className="text-xs text-surface-500 font-mono">#{r.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-surface-400 mt-0.5">
                            Créée le {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                    <Badge className={`${STATUS_COLORS[s as string] ?? ""} font-bold uppercase tracking-wider text-[10px] py-1.5 px-3`}>
                        {getStatusLabel(s as string)}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-surface-100 dark:divide-surface-800">
                    {/* Column 1: Contact */}
                    <div>
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Client</p>
                        <DetailRow
                            icon={<UserCircle2 size={16} />}
                            label="Nom"
                            value={r.customer_name}
                        />
                        <DetailRow
                            icon={<Phone size={16} />}
                            label="Téléphone"
                            value={r.customer_phone}
                        />
                        <DetailRow
                            icon={<Mail size={16} />}
                            label="Email"
                            value={r.customer_email}
                        />
                        <DetailRow
                            icon={<Hash size={16} />}
                            label="ID client"
                            value={r.customer_id ? (
                                <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
                                    {r.customer_id.slice(-12)}
                                </span>
                            ) : (
                                <span className="text-surface-400 italic text-xs">Client non connecté</span>
                            )}
                        />
                    </div>

                    {/* Column 2: Reservation */}
                    <div>
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Réservation</p>
                        <DetailRow
                            icon={<CalendarDays size={16} />}
                            label="Date"
                            value={new Date(r.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        />
                        <DetailRow
                            icon={<Clock size={16} />}
                            label="Heure · Durée"
                            value={`${r.time.slice(0, 5)}${r.duration ? ` · ${r.duration} min` : ""}`}
                        />
                        <DetailRow
                            icon={<Users size={16} />}
                            label="Personnes"
                            value={`${r.party_size} personne${r.party_size > 1 ? "s" : ""}`}
                        />
                        {occ && (
                            <DetailRow
                                icon={<Tag size={16} />}
                                label="Occasion"
                                value={`${occ.icon} ${occ.label}`}
                            />
                        )}
                    </div>
                </div>

                {/* Location */}
                {(zoneData || tableData) && (
                    <div className="border-t border-surface-100 dark:border-surface-800 pt-3">
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Emplacement</p>
                        <div className="flex items-center gap-4">
                            {zoneData && (
                                <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2">
                                    <CircleDot size={14} style={{ color: zoneData.color ?? "#6366f1" }} />
                                    <span className="text-sm font-semibold">{zoneData.name}</span>
                                    {zoneData.type && (
                                        <span className="text-xs text-surface-500 capitalize">{zoneData.type}</span>
                                    )}
                                </div>
                            )}
                            {tableData && (
                                <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2">
                                    <MapPin size={14} className="text-surface-400" />
                                    <span className="text-sm font-semibold">Table #{tableData.number}</span>
                                    {tableData.capacity && (
                                        <span className="text-xs text-surface-500">{tableData.capacity} places</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Special requests */}
                {r.special_requests && (
                    <div className="border-t border-surface-100 dark:border-surface-800 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare size={14} className="text-surface-400" />
                            <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Demandes spéciales</p>
                        </div>
                        <p className="text-sm text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 rounded-lg p-3 leading-relaxed italic">
                            "{r.special_requests}"
                        </p>
                    </div>
                )}

                {/* Deposit */}
                {(r.deposit_amount ?? 0) > 0 && (
                    <div className="border-t border-surface-100 dark:border-surface-800 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BanknoteIcon size={14} className="text-surface-400" />
                            <span className="text-sm text-surface-600 dark:text-surface-400">Acompte</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{r.deposit_amount?.toLocaleString("fr-FR")} FCFA</span>
                            {r.deposit_paid && (
                                <CheckCircle2 size={14} className="text-green-500" />
                            )}
                            <Badge className={r.deposit_paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                {r.deposit_paid ? "Payé" : "En attente"}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Cancellation reason */}
                {r.cancellation_reason && (
                    <div className="border-t border-surface-100 dark:border-surface-800 pt-3">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Motif d'annulation</p>
                        <p className="text-sm text-surface-700 dark:text-surface-300">{r.cancellation_reason}</p>
                    </div>
                )}

                {/* Action buttons */}
                {actionButtons.length > 0 && (
                    <div className="border-t border-surface-100 dark:border-surface-800 pt-3">
                        {isProcessing ? (
                            <div className="flex justify-center py-2"><Spinner size="sm" /></div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {actionButtons.map((btn) => (
                                    <button
                                        key={btn.status}
                                        onClick={() => {
                                            onStatusChange(r.id, btn.status);
                                            onClose();
                                        }}
                                        className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${btn.className}`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                                {can("reservations:manage") && (
                                    <button
                                        onClick={() => {
                                            onDelete(r.id);
                                            onClose();
                                        }}
                                        className="py-2 px-3 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        {t.common.delete}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
