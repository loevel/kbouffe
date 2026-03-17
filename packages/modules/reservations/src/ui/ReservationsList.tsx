"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, CalendarDays, Users, CheckCircle2, Clock, XCircle, UserX, MoreVertical } from "lucide-react";
import {
    Card, Button, Input, Select, Tabs, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
    TablePagination, EmptyState, Modal, ModalFooter, Badge, Spinner, Dropdown, Textarea, toast,
} from "@/components/ui";
import { useLocale } from "@/contexts/locale-context";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

interface Reservation {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    table_id: string | null;
    zone_preference: string | null;
    date: string;
    time: string;
    duration: number;
    party_size: number;
    status: string;
    special_requests: string | null;
    created_at: string;
    restaurant_tables?: {
        number: number;
        capacity: number;
        table_zones?: { name: string } | null;
    } | null;
}

interface TableOption {
    id: string;
    number: number;
    capacity: number;
    status: string;
    zone?: { name: string } | null;
}

const ITEMS_PER_PAGE = 15;

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    seated: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-300",
    no_show: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
};

export function ReservationsList() {
    const { t } = useLocale();
    const { can } = useDashboard();

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<TableOption[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
    const [page, setPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);

    // Stats
    const [allReservations, setAllReservations] = useState<Reservation[]>([]);

    const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const supabase = createClient();
        const headers: Record<string, string> = { 
            "Content-Type": "application/json",
            ...(options.headers as any) 
        };
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }
        }
        return fetch(url, { ...options, headers });
    }, []);

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== "all") params.set("status", activeTab);
            if (dateFilter) params.set("date", dateFilter);
            if (search.trim()) params.set("search", search.trim());
            params.set("page", String(page));
            params.set("limit", String(ITEMS_PER_PAGE));

            const res = await authFetch(`/api/reservations?${params}`);
            const data = (await res.json()) as any;
            setReservations(data.reservations ?? []);
            setTotal(data.total ?? 0);
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, dateFilter, search, page, t.common.error]);

    const fetchAllForStats = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (dateFilter) params.set("date", dateFilter);
            params.set("limit", "200");
            const res = await authFetch(`/api/reservations?${params}`);
            const data = (await res.json()) as any;
            setAllReservations(data.reservations ?? []);
        } catch { /* ignore */ }
    }, [dateFilter]);

    const fetchTables = useCallback(async () => {
        try {
            const res = await authFetch("/api/tables");
            const data = (await res.json()) as any;
            setTables((data.tables ?? []).map((t: any) => ({
                id: t.id,
                number: t.number,
                capacity: t.capacity,
                status: t.status,
                zone: t.table_zones,
            })));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchReservations();
        fetchAllForStats();
    }, [fetchReservations, fetchAllForStats]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setProcessingId(id);
        try {
            const res = await authFetch(`/api/reservations/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const data = (await res.json()) as any;
                toast.error(data.error ?? t.common.error);
                return;
            }
            toast.success(t.reservations.reservationUpdated);
            fetchReservations();
            fetchAllForStats();
            fetchTables();
        } catch {
            toast.error(t.common.error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.common.deleteConfirm)) return;
        setProcessingId(id);
        try {
            const res = await authFetch(`/api/reservations/${id}`, { method: "DELETE" });
            if (!res.ok) {
                toast.error(t.common.error);
                return;
            }
            toast.success(t.reservations.reservationDeleted);
            fetchReservations();
            fetchAllForStats();
            fetchTables();
        } catch {
            toast.error(t.common.error);
        } finally {
            setProcessingId(null);
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const pendingCount = allReservations.filter((r) => r.status === "pending").length;
    const confirmedCount = allReservations.filter((r) => r.status === "confirmed").length;
    const seatedCount = allReservations.filter((r) => r.status === "seated").length;
    const completedCount = allReservations.filter((r) => r.status === "completed").length;

    const statusTabs = [
        { id: "all", label: t.reservations.allStatuses },
        { id: "pending", label: t.reservations.pending, count: pendingCount },
        { id: "confirmed", label: t.reservations.confirmed, count: confirmedCount },
        { id: "seated", label: t.reservations.seated, count: seatedCount },
        { id: "completed", label: t.reservations.completed },
        { id: "no_show", label: t.reservations.noShow },
        { id: "cancelled", label: t.reservations.cancelled },
    ];

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
            items.push({ label: t.reservations.confirmReservation, onClick: () => handleStatusChange(reservation.id, "confirmed") });
            items.push({ label: t.reservations.markNoShow, onClick: () => handleStatusChange(reservation.id, "no_show") });
        }
        if (s === "confirmed") {
            items.push({ label: t.reservations.seatGuests, onClick: () => handleStatusChange(reservation.id, "seated") });
            items.push({ label: t.reservations.markNoShow, onClick: () => handleStatusChange(reservation.id, "no_show") });
        }
        if (s === "seated") {
            items.push({ label: t.reservations.completeReservation, onClick: () => handleStatusChange(reservation.id, "completed") });
        }
        if (s !== "completed" && s !== "cancelled" && s !== "no_show") {
            items.push({ label: t.reservations.cancelReservation, onClick: () => handleStatusChange(reservation.id, "cancelled"), variant: "danger" });
        }
        if (can("reservations:manage")) {
            items.push({ label: t.common.delete, onClick: () => handleDelete(reservation.id), variant: "danger" });
        }
        return items;
    };

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card className="p-4 text-center">
                    <CalendarDays className="mx-auto text-brand-500 mb-1" size={20} />
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{allReservations.length}</p>
                    <p className="text-sm text-surface-500">{t.reservations.statsTotal}</p>
                </Card>
                <Card className="p-4 text-center">
                    <Clock className="mx-auto text-yellow-500 mb-1" size={20} />
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{pendingCount}</p>
                    <p className="text-sm text-surface-500">{t.reservations.statsPending}</p>
                </Card>
                <Card className="p-4 text-center">
                    <CheckCircle2 className="mx-auto text-blue-500 mb-1" size={20} />
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{confirmedCount}</p>
                    <p className="text-sm text-surface-500">{t.reservations.confirmed}</p>
                </Card>
                <Card className="p-4 text-center">
                    <Users className="mx-auto text-green-500 mb-1" size={20} />
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{seatedCount}</p>
                    <p className="text-sm text-surface-500">{t.reservations.statsSeated}</p>
                </Card>
                <Card className="p-4 text-center lg:col-span-1 col-span-2">
                    <div className="text-surface-400 mb-1 flex justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{completedCount}</p>
                    <p className="text-sm text-surface-500">{t.reservations.statsCompleted}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="p-4 border-b border-surface-100 dark:border-surface-800">
                    <Tabs tabs={statusTabs} activeTab={activeTab} onTabChange={(id: string) => { setActiveTab(id); setPage(1); }} />
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-5">
                        <Input
                            placeholder={t.reservations.searchPlaceholder}
                            leftIcon={<Search size={16} />}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            rightIcon={search && (
                                <button
                                    onClick={() => { setSearch(""); setPage(1); }}
                                    className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full"
                                >
                                    <XCircle size={14} className="text-surface-400" />
                                </button>
                            )}
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="lg:col-span-3 flex justify-end">
                        {can("reservations:manage") && (
                            <Button leftIcon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
                                {t.reservations.addReservation}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                ) : reservations.length === 0 ? (
                    <EmptyState title={t.reservations.noReservations} description={t.reservations.noReservationsDesc} />
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
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
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-surface-900 dark:text-white">{r.customer_name}</p>
                                                    {r.customer_phone && (
                                                        <p className="text-xs text-surface-500">{r.customer_phone}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1">
                                                    <Users size={14} className="text-surface-400" />
                                                    {r.party_size}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {r.restaurant_tables ? (
                                                    <span>
                                                        #{r.restaurant_tables.number}
                                                        {r.restaurant_tables.table_zones && (
                                                            <span className="text-xs text-surface-400 ml-1">
                                                                ({r.restaurant_tables.table_zones.name})
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-surface-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm">{r.date}</p>
                                                    <p className="text-xs text-surface-500">{r.time.slice(0, 5)}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_COLORS[r.status] ?? ""}>
                                                    {getStatusLabel(r.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {processingId === r.id ? (
                                                    <div className="flex justify-end pr-2"><Spinner size="sm" /></div>
                                                ) : actions.length > 0 && (
                                                    <Dropdown
                                                        trigger={
                                                            <button className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                                                                <MoreVertical size={16} />
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
                            <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                        )}
                    </>
                )}
            </Card>

            {/* Add Reservation Modal */}
            <AddReservationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                tables={tables}
                onCreated={() => { fetchReservations(); fetchAllForStats(); }}
                authFetch={authFetch}
            />
        </>
    );
}

function AddReservationModal({
    isOpen,
    onClose,
    tables,
    onCreated,
    authFetch,
}: {
    isOpen: boolean;
    onClose: () => void;
    tables: TableOption[];
    onCreated: () => void;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}) {
    const { t } = useLocale();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [partySize, setPartySize] = useState(2);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState("12:00");
    const [duration, setDuration] = useState(90);
    const [tableId, setTableId] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");

    const reset = () => {
        setName("");
        setPhone("");
        setEmail("");
        setPartySize(2);
        setDate(new Date().toISOString().split("T")[0]);
        setTime("12:00");
        setDuration(90);
        setTableId("");
        setSpecialRequests("");
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        if (partySize < 1 || partySize > 20) {
            toast.error("Le nombre de personnes doit être entre 1 et 20");
            return;
        }
        if (phone.trim() && phone.trim().length < 6) {
            toast.error("Le numéro de téléphone est trop court");
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch("/api/reservations", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: name.trim(),
                    customer_phone: phone.trim() || null,
                    customer_email: email.trim() || null,
                    party_size: partySize,
                    date,
                    time,
                    duration,
                    table_id: tableId || null,
                    special_requests: specialRequests.trim() || null,
                }),
            });
            const data = (await res.json()) as any;
            if (!res.ok) {
                toast.error(data.error ?? t.common.error);
                return;
            }
            toast.success(t.reservations.reservationCreated);
            reset();
            onClose();
            onCreated();
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const tableOptions = [
        { value: "", label: t.reservations.noTablePreference },
        ...tables
            .filter((tb) => tb.status === "available")
            .map((tb) => ({
                value: tb.id,
                label: `#${tb.number} (${tb.capacity} ${t.tables.seats})${tb.zone ? ` — ${tb.zone.name}` : ""}`,
            })),
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.reservations.addReservation} description={t.reservations.addReservationDesc}>
            <div className="space-y-4">
                <Input
                    label={t.reservations.customerName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t.reservations.customerPhone}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <Input
                        label={t.reservations.customerEmail}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        label={t.reservations.partySize}
                        type="number"
                        min={1}
                        max={50}
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                    />
                    <Input
                        label={t.reservations.date}
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <Input
                        label={t.reservations.time}
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t.reservations.duration}
                        type="number"
                        min={15}
                        max={480}
                        step={15}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    />
                    <Select
                        label={t.reservations.table}
                        value={tableId}
                        onChange={(e) => setTableId(e.target.value)}
                        options={tableOptions}
                    />
                </div>
                <Textarea
                    label={t.reservations.specialRequests}
                    placeholder={t.reservations.specialRequestsPlaceholder}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={2}
                />
            </div>
            <ModalFooter>
                <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
                <Button onClick={handleSubmit} isLoading={loading} disabled={!name.trim()}>
                    {t.common.create}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
