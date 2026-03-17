"use client";

import { useMemo, useState } from "react";
import { Spinner, toast, useLocale } from "@kbouffe/module-core/ui";
import { 
    useReservations, 
    updateReservation, 
    deleteReservation, 
    useTables 
} from "../hooks/use-reservations";

// Sub-components
import { ReservationsStats } from "./components/ReservationsStats";
import { ReservationsFilters } from "./components/ReservationsFilters";
import { ReservationsTable } from "./components/ReservationsTable";
import { AddReservationModal } from "./components/AddReservationModal";

const ITEMS_PER_PAGE = 15;

export function ReservationsList() {
    const { t } = useLocale();

    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<"time" | "party" | "status">("time");
    const [minParty, setMinParty] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Data fetching with SWR
    const { 
        reservations, 
        total, 
        isLoading, 
        mutate: mutateReservations 
    } = useReservations({
        status: activeTab,
        search,
        date: dateFilter
    });

    // For stats, we fetch all reservations for that day (within limits)
    const { 
        reservations: allForStats,
        mutate: mutateStats
    } = useReservations({
        date: dateFilter
        // No status or search here to get the full picture for stats
    });

    const { tables, mutate: mutateTables } = useTables();

    const refreshData = () => {
        mutateReservations();
        mutateStats();
        mutateTables();
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setProcessingId(id);
        try {
            const result = await updateReservation(id, { status: newStatus as any });
            
            if (!result.success) {
                toast.error(result.error ?? t.common.error);
                return;
            }
            
            toast.success(t.reservations.reservationUpdated);
            refreshData();
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
            const result = await deleteReservation(id);
            
            if (!result.success) {
                toast.error(result.error ?? t.common.error);
                return;
            }
            
            toast.success(t.reservations.reservationDeleted);
            refreshData();
        } catch {
            toast.error(t.common.error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let list = reservations;
        if (minParty) list = list.filter((r) => (r.party_size ?? 0) >= minParty);

        list = [...list].sort((a, b) => {
            if (sort === "party") return (b.party_size ?? 0) - (a.party_size ?? 0);
            if (sort === "status") return (a.status ?? "").localeCompare(b.status ?? "");
            // time sort by date + time
            const aKey = `${a.date} ${a.time}`;
            const bKey = `${b.date} ${b.time}`;
            return aKey.localeCompare(bKey);
        });

        return list;
    }, [reservations, sort, minParty]);

    const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
    const pageReservations = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSorted, page]);
    
    // Calculate counts for badges in filters
    const pendingCount = allForStats.filter((r) => r.status === "pending").length;
    const confirmedCount = allForStats.filter((r) => r.status === "confirmed").length;
    const seatedCount = allForStats.filter((r) => r.status === "seated").length;

    return (
        <div className="space-y-6">
            <ReservationsStats 
                allReservations={allForStats} 
            />

            <ReservationsFilters
                activeTab={activeTab}
                onTabChange={(id) => { setActiveTab(id); setPage(1); }}
                search={search}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                dateFilter={dateFilter}
                onDateFilterChange={(val) => { setDateFilter(val); setPage(1); }}
                onAddClick={() => setShowAddModal(true)}
                pendingCount={pendingCount}
                confirmedCount={confirmedCount}
                seatedCount={seatedCount}
                sort={sort}
                onSortChange={setSort}
                minParty={minParty}
                onMinPartyChange={setMinParty}
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-900 rounded-xl shadow-sm">
                    <Spinner size="lg" />
                    <p className="mt-4 text-surface-500 font-medium">{t.common.loading || "Chargement..."}</p>
                </div>
            ) : (
                <ReservationsTable
                    reservations={pageReservations}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    processingId={processingId}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                />
            )}

            <AddReservationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                tables={tables}
                onCreated={refreshData}
            />
        </div>
    );
}
