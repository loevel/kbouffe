"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, MapPin, QrCode, Search, Shuffle } from "lucide-react";
import { Card, Button, Badge, Modal, ModalFooter, Input, Select, EmptyState, toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@kbouffe/module-core/ui";
import { TableCard } from "./TableCard";
import { ZoneManager } from "./ZoneManager";

interface TableZone {
    id: string;
    name: string;
    type: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    image_url: string | null;
    color: string | null;
    capacity: number;
    min_party_size: number;
    amenities: string[];
    pricing_note: string | null;
}

interface RestaurantTable {
    id: string;
    number: string;
    zone_id: string | null;
    capacity: number;
    status: string;
    qr_code: string | null;
    is_active: boolean;
    sort_order: number;
    table_zones: { name: string; type: string } | null;
}

export function TablesManager() {
    const { t } = useLocale();
    const { can } = useDashboard();
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [zones, setZones] = useState<TableZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showZones, setShowZones] = useState(false);
    const [filterZone, setFilterZone] = useState("all");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<"status" | "capacity" | "number">("status");

    const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const supabase = createClient();
        const headers: Record<string, string> = { ...(options.headers as any) };
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }
        }
        return fetch(url, { ...options, headers });
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const res = await authFetch(`/api/tables?t=${Date.now()}`);
            if (!res.ok) return;
            const data = await res.json();
            setTables(data.tables ?? []);
            setZones(data.zones ?? []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusChange = async (tableId: string, newStatus: string) => {
        const res = await authFetch(`/api/tables/${tableId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
            const data = await res.json();
            toast.error(data.error ?? t.common.error);
            return;
        }
        toast.success(t.tables.statusUpdated);
        fetchData();
    };

    const handleDelete = async (tableId: string) => {
        const res = await authFetch(`/api/tables/${tableId}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            toast.error(data.error ?? t.common.error);
            return;
        }
        toast.success(t.tables.tableDeleted);
        fetchData();
    };

    const filteredTables = useMemo(() => {
        let list = filterZone === "all"
            ? tables
            : tables.filter((t) => t.zone_id === filterZone);

        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter((t) =>
                t.number.toLowerCase().includes(q) ||
                (t.table_zones?.name?.toLowerCase().includes(q))
            );
        }

        list = [...list].sort((a, b) => {
            if (sort === "capacity") return b.capacity - a.capacity;
            if (sort === "number") return a.number.localeCompare(b.number);
            // status sort: available > reserved > occupied > cleaning
            const order: Record<string, number> = { available: 0, reserved: 1, occupied: 2, cleaning: 3 };
            return (order[a.status] ?? 9) - (order[b.status] ?? 9);
        });

        return list;
    }, [filterZone, tables, query, sort]);

    const statusCounts = {
        available: tables.filter((t) => t.status === "available").length,
        occupied: tables.filter((t) => t.status === "occupied").length,
        reserved: tables.filter((t) => t.status === "reserved").length,
        cleaning: tables.filter((t) => t.status === "cleaning").length,
    };

    if (loading) {
        return (
            <Card className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </Card>
        );
    }

    return (
        <>
            {/* Stats bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" aria-live="polite">
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-500">{statusCounts.available}</p>
                    <p className="text-sm text-surface-500">{t.tables.available}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-500">{statusCounts.occupied}</p>
                    <p className="text-sm text-surface-500">{t.tables.occupied}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{statusCounts.reserved}</p>
                    <p className="text-sm text-surface-500">{t.tables.reserved}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">{statusCounts.cleaning}</p>
                    <p className="text-sm text-surface-500">{t.tables.cleaning}</p>
                </Card>
            </div>

            {/* Zone overview cards */}
            {zones.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} className="text-brand-500" />
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white">Zones du restaurant</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {zones.map((zone) => {
                            const zoneTables = tables.filter((t) => t.zone_id === zone.id);
                            const availCount = zoneTables.filter((t) => t.status === "available").length;
                            return (
                                <button
                                    key={zone.id}
                                    onClick={() => setFilterZone(filterZone === zone.id ? "all" : zone.id)}
                                    className={`text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                                        filterZone === zone.id
                                            ? "border-brand-500 shadow-md"
                                            : "border-surface-200 dark:border-surface-700"
                                    }`}
                                >
                                    {/* Zone image or color header */}
                                    <div
                                        className="h-16 relative"
                                        style={{ backgroundColor: zone.color ?? "#6366f1" }}
                                    >
                                        {zone.image_url && (
                                            <img src={zone.image_url} alt={zone.name} className="w-full h-full object-cover absolute inset-0" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <div className="absolute bottom-2 left-3 right-3">
                                            <p className="text-sm font-bold text-white truncate">{zone.name}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-surface-900">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-surface-500">
                                                {zoneTables.length} table{zoneTables.length !== 1 ? "s" : ""}
                                            </span>
                                            <span className={`font-bold ${availCount > 0 ? "text-green-500" : "text-red-500"}`}>
                                                {availCount} dispo.
                                            </span>
                                        </div>
                                        {zone.amenities?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {zone.amenities.slice(0, 4).map((a) => (
                                                    <span key={a} className="text-[10px] px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 rounded-full text-surface-500">
                                                        {a === "wifi" ? "📶" : a === "ac" ? "❄️" : a === "view" ? "🌅" : a === "private" ? "🔒" : a === "music" ? "🎵" : a === "tv" ? "📺" : a === "outdoor" ? "🌿" : a === "parking" ? "🅿️" : a}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {zone.pricing_note && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium truncate">{zone.pricing_note}</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 w-full md:w-auto">
                    <Search size={16} className="text-surface-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher une table ou zone"
                        className="bg-transparent w-full outline-none text-sm"
                    />
                </div>
                <Select
                    value={filterZone}
                    onChange={(e) => setFilterZone(e.target.value)}
                    options={[
                        { value: "all", label: t.tables.allZones },
                        ...zones.map((z) => ({ value: z.id, label: `${z.name} (${tables.filter(t => t.zone_id === z.id).length})` })),
                    ]}
                />
                <Select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                    options={[
                        { value: "status", label: "Trier par statut" },
                        { value: "capacity", label: "Capacité" },
                        { value: "number", label: "Numéro" },
                    ]}
                />
                {can("tables:manage") && (
                    <>
                        <Button size="sm" leftIcon={<MapPin size={16} />} variant="outline" onClick={() => setShowZones(true)}>
                            {t.tables.manageZones}
                        </Button>
                        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
                            {t.tables.addTable}
                        </Button>
                    </>
                )}
            </div>

            {/* Tables grid */}
            {filteredTables.length === 0 ? (
                <EmptyState title={t.tables.noTables} description={t.tables.noTablesDesc} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTables.map((table) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            canManage={can("tables:manage")}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Add table modal */}
            <AddTableModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={fetchData}
                zones={zones}
            />

            {/* Zone manager modal */}
            <ZoneManager
                isOpen={showZones}
                onClose={() => setShowZones(false)}
                zones={zones}
                onUpdated={fetchData}
            />
        </>
    );
}

// ─── Add Table Modal ────────────────────────────────────────────────────
function AddTableModal({
    isOpen,
    onClose,
    onCreated,
    zones,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    zones: TableZone[];
}) {
    const { t } = useLocale();
    const [number, setNumber] = useState("");
    const [capacity, setCapacity] = useState("4");
    const [zoneId, setZoneId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // auto-suggest next number
    useEffect(() => {
        if (!isOpen) return;
        if (number) return;
        // Suggest based on zone selection
        const list = zones
            .filter((z) => !zoneId || z.id === zoneId)
            .map((z) => z.id);
        if (list.length === 0) return;
        // will be computed outside with fetchData normally; fallback T{count+1}
        setNumber((prev) => prev || `T${Math.floor(Math.random() * 900 + 100)}`);
    }, [isOpen, zoneId, zones, number]);

    const handleSubmit = async () => {
        setError(null);
        if (!number.trim()) {
            const msg = t.tables.numberRequired;
            setError(msg);
            toast.error(msg);
            return;
        }
        if (parseInt(capacity, 10) < 1) {
            const msg = "Capacité minimum 1";
            setError(msg);
            toast.error(msg);
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (supabase) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }
            }

            const res = await fetch("/api/tables", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    number: number.trim(),
                    capacity: parseInt(capacity, 10) || 4,
                    zone_id: zoneId || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error ?? t.common.error);
                setError(data.error ?? t.common.error);
                return;
            }

            toast.success(t.tables.tableCreated);
            setNumber("");
            setCapacity("4");
            setZoneId("");
            onClose();
            onCreated();
        } catch {
            toast.error(t.common.error);
            setError(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.tables.addTable} description={t.tables.addTableDesc}>
            <div className="space-y-4">
                <Input
                    label={t.tables.tableNumber}
                    placeholder="T1, VIP-1..."
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    leftIcon={<QrCode size={16} />}
                    error={error ?? undefined}
                />
                <Input
                    label={t.tables.capacity}
                    type="number"
                    min={1}
                    max={20}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                />
                <div className="flex gap-2">
                    {[2, 4, 6, 8].map((c) => (
                        <Button key={c} size="sm" variant={capacity === c.toString() ? "primary" : "outline"} onClick={() => setCapacity(c.toString())}>
                            {c} {t.tables.seats}
                        </Button>
                    ))}
                </div>
                {zones.length > 0 && (
                    <Select
                        label={t.tables.zone}
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                        options={[
                            { value: "", label: t.tables.noZone },
                            ...zones.map((z) => ({ value: z.id, label: z.name })),
                        ]}
                    />
                )}
            </div>
            <ModalFooter>
                <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
                <Button onClick={handleSubmit} isLoading={loading}>{t.common.create}</Button>
            </ModalFooter>
        </Modal>
    );
}
