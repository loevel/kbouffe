"use client";

import { Search, Plus, XCircle, Filter } from "lucide-react";
import { Tabs, Input, Button, useLocale, useDashboard } from "@kbouffe/module-core/ui";

interface ReservationsFiltersProps {
    activeTab: string;
    onTabChange: (id: string) => void;
    search: string;
    onSearchChange: (val: string) => void;
    dateFilter: string;
    onDateFilterChange: (val: string) => void;
    onAddClick: () => void;
    pendingCount: number;
    confirmedCount: number;
    seatedCount: number;
    sort: "time" | "party" | "status";
    onSortChange: (val: "time" | "party" | "status") => void;
    minParty: number | null;
    onMinPartyChange: (val: number | null) => void;
}

export function ReservationsFilters({
    activeTab,
    onTabChange,
    search,
    onSearchChange,
    dateFilter,
    onDateFilterChange,
    onAddClick,
    pendingCount,
    confirmedCount,
    seatedCount,
    sort,
    onSortChange,
    minParty,
    onMinPartyChange,
}: ReservationsFiltersProps) {
    const { t } = useLocale();
    const { can } = useDashboard();

    const statusTabs = [
        { id: "all", label: t.reservations.allStatuses },
        { id: "pending", label: t.reservations.pending, count: pendingCount },
        { id: "confirmed", label: t.reservations.confirmed, count: confirmedCount },
        { id: "seated", label: t.reservations.seated, count: seatedCount },
        { id: "completed", label: t.reservations.completed },
        { id: "no_show", label: t.reservations.noShow },
        { id: "cancelled", label: t.reservations.cancelled },
    ];

    return (
        <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="p-4 border-b border-surface-100 dark:border-surface-800">
                <Tabs 
                    tabs={statusTabs} 
                    activeTab={activeTab} 
                    onTabChange={onTabChange} 
                />
            </div>
            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-5">
                    <Input
                        placeholder={t.reservations.searchPlaceholder}
                        leftIcon={<Search size={16} />}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        rightIcon={search && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full"
                            >
                                <XCircle size={14} className="text-surface-400" />
                            </button>
                        )}
                    />
                </div>
                <div className="lg:col-span-3">
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => onDateFilterChange(e.target.value)}
                    />
                </div>
                <div className="lg:col-span-2">
                    <Input
                        type="number"
                        min={1}
                        placeholder={(t.reservations as any).minParty ?? "Taille min"}
                        value={minParty ?? ""}
                        onChange={(e) => onMinPartyChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                        leftIcon={<Filter size={14} />}
                    />
                </div>
                <div className="lg:col-span-2">
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value as any)}
                        className="w-full h-10 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm px-3"
                    >
                        <option value="time">{(t.reservations as any).sortTime ?? "Trier par heure"}</option>
                        <option value="party">{(t.reservations as any).sortParty ?? "Trier par groupe"}</option>
                        <option value="status">{(t.reservations as any).sortStatus ?? "Trier par statut"}</option>
                    </select>
                </div>
                <div className="lg:col-span-3 flex justify-end">
                    {can("reservations:manage") && (
                        <Button 
                            leftIcon={<Plus size={16} />} 
                            onClick={onAddClick}
                            className="bg-brand-500 hover:bg-brand-600 text-white border-none shadow-md"
                        >
                            {t.reservations.addReservation}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
