"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, MapPin, QrCode } from "lucide-react";
import { Card, Button, Badge, Modal, ModalFooter, Input, Select, EmptyState, toast } from "@/components/ui";
import { useLocale } from "@/contexts/locale-context";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/contexts/dashboard-context";
import { TableCard } from "./TableCard";
import { ZoneManager } from "./ZoneManager";

interface TableZone {
    id: string;
    name: string;
    type: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
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

    const filteredTables = filterZone === "all"
        ? tables
        : tables.filter((t) => t.zone_id === filterZone);

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <Select
                    value={filterZone}
                    onChange={(e) => setFilterZone(e.target.value)}
                    options={[
                        { value: "all", label: t.tables.allZones },
                        ...zones.map((z) => ({ value: z.id, label: z.name })),
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

    const handleSubmit = async () => {
        if (!number.trim()) {
            toast.error(t.tables.numberRequired);
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
                />
                <Input
                    label={t.tables.capacity}
                    type="number"
                    min={1}
                    max={20}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                />
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
