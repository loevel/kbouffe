"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal, ModalFooter, Button, Input, Select, toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { createClient } from "@/lib/supabase/client";
import { useCallback } from "react";

interface TableZone {
    id: string;
    name: string;
    type: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
}

interface ZoneManagerProps {
    isOpen: boolean;
    onClose: () => void;
    zones: TableZone[];
    onUpdated: () => void;
}

const ZONE_TYPES = [
    { value: "indoor", labelKey: "zoneIndoor" },
    { value: "outdoor", labelKey: "zoneOutdoor" },
    { value: "terrace", labelKey: "zoneTerrace" },
    { value: "vip", labelKey: "zoneVip" },
    { value: "air_conditioned", labelKey: "zoneAirCon" },
] as const;

export function ZoneManager({ isOpen, onClose, zones, onUpdated }: ZoneManagerProps) {
    const { t } = useLocale();
    const [name, setName] = useState("");
    const [type, setType] = useState("indoor");
    const [loading, setLoading] = useState(false);

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

    const handleAdd = async () => {
        if (!name.trim()) {
            toast.error(t.tables.zoneNameRequired);
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch("/api/zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), type }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error ?? t.common.error);
                return;
            }
            toast.success(t.tables.zoneCreated);
            setName("");
            setType("indoor");
            onUpdated();
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (zoneId: string) => {
        const res = await authFetch(`/api/zones/${zoneId}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            toast.error(data.error ?? t.common.error);
            return;
        }
        toast.success(t.tables.zoneDeleted);
        onUpdated();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.tables.manageZones} description={t.tables.manageZonesDesc}>
            {/* Existing zones */}
            <div className="space-y-2 mb-6">
                {zones.length === 0 ? (
                    <p className="text-sm text-surface-400 text-center py-4">{t.tables.noZones}</p>
                ) : (
                    zones.map((zone) => (
                        <div
                            key={zone.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800"
                        >
                            <div>
                                <p className="text-sm font-medium text-surface-900 dark:text-white">{zone.name}</p>
                                <p className="text-xs text-surface-500">
                                    {t.tables[`zone${zone.type.charAt(0).toUpperCase()}${zone.type.slice(1)}` as keyof typeof t.tables] ?? zone.type}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(zone.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add new zone */}
            <div className="border-t border-surface-200 dark:border-surface-700 pt-4 space-y-3">
                <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300">{t.tables.addZone}</h4>
                <Input
                    placeholder={t.tables.zoneNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    options={ZONE_TYPES.map((zt) => ({
                        value: zt.value,
                        label: t.tables[zt.labelKey as keyof typeof t.tables] ?? zt.value,
                    }))}
                />
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={onClose}>{t.common.close}</Button>
                <Button leftIcon={<Plus size={16} />} onClick={handleAdd} isLoading={loading}>
                    {t.tables.addZone}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
