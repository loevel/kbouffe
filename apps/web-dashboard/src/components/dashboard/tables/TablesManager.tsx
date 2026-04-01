"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, MapPin, QrCode, Search, ParkingSquare } from "lucide-react";
import { Card, Button, Badge, Modal, ModalFooter, Input, Select, EmptyState, toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { createClient } from "@/lib/supabase/client";
import { TableCard } from "./TableCard";
import { ZoneManager } from "./ZoneManager";
import { ParkedOrdersPanel } from "@/components/pos/ParkedOrdersPanel";
import { PosOrderPanel } from "@/components/pos/PosOrderPanel";
import { usePosOperator } from "@/contexts/PosOperatorContext";

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
    const { operator } = usePosOperator();
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [zones, setZones] = useState<TableZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showZones, setShowZones] = useState(false);
    const [filterZone, setFilterZone] = useState("all");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<"status" | "capacity" | "number">("status");
    // ── Park & Recall ──────────────────────────────────────────────────────
    const [showParkedPanel, setShowParkedPanel] = useState(false);
    const [parkedCount, setParkedCount] = useState(0);
    const [showParkModal, setShowParkModal] = useState(false);
    // ── POS Order Panel ────────────────────────────────────────────────────
    const [posOpen, setPosOpen] = useState(false);
    const [posTable, setPosTable] = useState<{ tableNumber: string; tableId: string } | null>(null);
    const [posEditingDraft, setPosEditingDraft] = useState<{
        orderId: string;
        draftLabel: string;
        items: Array<{ id: string; name: string; unit_price?: number; price?: number; quantity: number; notes?: string }>;
        covers?: number | null;
        notes?: string | null;
    } | null>(null);

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
        // Include the PDV operator in the payload when occupying a table
        const payload: Record<string, unknown> = { status: newStatus };
        if (newStatus === "occupied" && operator?.memberId) {
            payload.operator_member_id = operator.memberId;
        }

        const res = await authFetch(`/api/tables/${tableId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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

    // ── POS handlers ──────────────────────────────────────────────────────
    const handleOpenPos = (tableNumber: string, tableId: string) => {
        setPosTable({ tableNumber, tableId });
        setPosEditingDraft(null);
        setPosOpen(true);
    };

    const handleEditDraft = async (draftId: string, draftLabel: string) => {
        try {
            const res = await authFetch(`/api/orders/${draftId}`);
            if (!res.ok) { toast.error("Impossible de charger la commande"); return; }
            const data = await res.json() as { items?: any[]; covers?: number | null; notes?: string | null; table_number?: string | null };
            const rawItems: Array<{ id: string; name: string; unit_price?: number; price?: number; quantity: number; notes?: string }> = Array.isArray(data.items) ? data.items : [];
            setPosEditingDraft({ orderId: draftId, draftLabel, items: rawItems, covers: data.covers, notes: data.notes });
            setPosTable(data.table_number ? { tableNumber: data.table_number, tableId: "" } : null);
            setPosOpen(true);
        } catch {
            toast.error("Erreur réseau");
        }
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
                {/* Park & Recall — Commandes Garées button */}
                <button
                    onClick={() => setShowParkedPanel(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-sm font-medium"
                >
                    <ParkingSquare size={16} />
                    <span>Commandes Garées</span>
                    {parkedCount > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                            {parkedCount}
                        </span>
                    )}
                </button>

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
                {/* Garer une commande — secondary action */}
                <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ParkingSquare size={16} />}
                    onClick={() => setShowParkModal(true)}
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                >
                    Garer une commande
                </Button>
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
                            onOrderClick={handleOpenPos}
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

            {/* Park & Recall — Parked orders drawer */}
            <ParkedOrdersPanel
                isOpen={showParkedPanel}
                onClose={() => setShowParkedPanel(false)}
                onCountChange={setParkedCount}
                onEditDraft={handleEditDraft}
            />

            {/* Park & Recall — Park new order modal */}
            <ParkOrderModal
                isOpen={showParkModal}
                onClose={() => setShowParkModal(false)}
                zones={zones}
                tables={tables}
                operatorMemberId={operator?.memberId}
                onParked={() => {
                    setShowParkModal(false);
                    setParkedCount((n) => n + 1);
                }}
            />

            {/* POS Order Panel */}
            <PosOrderPanel
                isOpen={posOpen}
                tableNumber={posTable?.tableNumber ?? ""}
                tableId={posTable?.tableId}
                existingDraft={posEditingDraft}
                onClose={() => {
                    setPosOpen(false);
                    setPosTable(null);
                    setPosEditingDraft(null);
                    setParkedCount((n) => n + 1);
                }}
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

// ─── Park Order Modal ───────────────────────────────────────────────────────
/**
 * Modal for a server to create a new parked (draft) order on the spot.
 * The server enters a label (e.g. "Table 3 - Moussa"), selects a table,
 * and adds items manually before parking the order.
 */
function ParkOrderModal({
    isOpen,
    onClose,
    zones,
    tables,
    operatorMemberId,
    onParked,
}: {
    isOpen: boolean;
    onClose: () => void;
    zones: TableZone[];
    tables: RestaurantTable[];
    operatorMemberId?: string;
    onParked: () => void;
}) {
    const [draftLabel, setDraftLabel] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<Array<{ id: string; name: string; unit_price: number; quantity: number }>>([]);
    const [loading, setLoading] = useState(false);

    // Reset on open
    useEffect(() => {
        if (!isOpen) return;
        setDraftLabel("");
        setTableNumber("");
        setCustomerName("");
        setNotes("");
        setItems([{ id: crypto.randomUUID(), name: "", unit_price: 0, quantity: 1 }]);
    }, [isOpen]);

    const addItem = () => {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), name: "", unit_price: 0, quantity: 1 }]);
    };

    const removeItem = (idx: number) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, field: string, value: string | number) => {
        setItems((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
        );
    };

    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const handleSubmit = async () => {
        if (!draftLabel.trim()) {
            toast.error("Le libellé de commande garée est requis");
            return;
        }
        const validItems = items.filter((it) => it.name.trim() && it.quantity > 0);
        if (validItems.length === 0) {
            toast.error("Ajoutez au moins un article avec un nom et une quantité");
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch("/api/orders/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    draftLabel: draftLabel.trim(),
                    customerName: customerName.trim() || draftLabel.trim(),
                    tableNumber: tableNumber.trim() || null,
                    notes: notes.trim() || null,
                    operatorMemberId: operatorMemberId ?? null,
                    items: validItems.map((it) => ({
                        id: it.id,
                        name: it.name.trim(),
                        unit_price: it.unit_price,
                        quantity: it.quantity,
                    })),
                }),
            });

            const data = await res.json() as { success?: boolean; error?: string };
            if (!res.ok) {
                toast.error(data.error ?? "Erreur lors de la mise en attente");
                return;
            }

            toast.success("Commande garée ✓");
            onParked();
        } catch {
            toast.error("Erreur réseau");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Garer une commande"
            description="Enregistrez une commande en cours sans paiement immédiat"
            size="lg"
        >
            <div className="space-y-4">
                {/* Label */}
                <Input
                    label="Libellé de commande *"
                    placeholder="Ex: Table 3 - Moussa"
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                    {/* Table number */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Numéro de table
                        </label>
                        <select
                            value={tableNumber}
                            onChange={(e) => {
                                const val = e.target.value;
                                setTableNumber(val);
                                if (val && !draftLabel) setDraftLabel(`Table ${val}`);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">— Aucune —</option>
                            {tables.map((tb) => (
                                <option key={tb.id} value={tb.number}>
                                    Table {tb.number}{tb.table_zones ? ` (${tb.table_zones.name})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Customer name */}
                    <Input
                        label="Nom du client (optionnel)"
                        placeholder="Ex: Moussa"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                </div>

                {/* Items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                            Articles
                        </label>
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                        >
                            + Ajouter un article
                        </button>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {items.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Nom de l'article"
                                    value={item.name}
                                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-0"
                                />
                                <input
                                    type="number"
                                    placeholder="Prix"
                                    min={0}
                                    value={item.unit_price || ""}
                                    onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                                    className="w-24 px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Qté"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => updateItem(idx, "quantity", Math.max(1, Number(e.target.value)))}
                                    className="w-16 px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="p-1.5 text-surface-400 hover:text-red-500 transition-colors"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {subtotal > 0 && (
                        <p className="text-right text-sm font-bold text-surface-900 dark:text-white mt-2">
                            Sous-total : {new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(subtotal)}
                        </p>
                    )}
                </div>

                {/* Notes */}
                <Input
                    label="Notes (optionnel)"
                    placeholder="Allergies, préférences..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    Annuler
                </Button>
                <Button
                    onClick={handleSubmit}
                    isLoading={loading}
                    leftIcon={<ParkingSquare size={16} />}
                >
                    Garer la commande
                </Button>
            </ModalFooter>
        </Modal>
    );
}

