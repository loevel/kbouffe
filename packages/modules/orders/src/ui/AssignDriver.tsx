"use client";

import { useState, useEffect } from "react";
import { Truck, Loader2 } from "lucide-react";
import { Select, toast, authFetch } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

interface DriverMember {
    id: string;
    userId: string;
    role: string;
    status: string;
    email: string;
    fullName: string | null;
    phone: string | null;
}

interface AssignDriverProps {
    orderId: string;
    currentDriverId?: string | null;
    onAssigned?: () => void;
}

export function AssignDriver({ orderId, currentDriverId, onAssigned }: AssignDriverProps) {
    const { t } = useLocale();
    const [drivers, setDrivers] = useState<DriverMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<string>(currentDriverId || "");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const res = await authFetch("/api/team");
                if (!res.ok) return;
                const data = await res.json();
                const allMembers = Array.isArray(data.members) ? (data.members as DriverMember[]) : [];
                const driverMembers = allMembers
                    .filter((member) => member.role === "driver" && member.status === "active")
                    .sort((left, right) => {
                        const leftLabel = left.fullName || left.email || left.userId;
                        const rightLabel = right.fullName || right.email || right.userId;
                        return leftLabel.localeCompare(rightLabel, "fr", { sensitivity: "base" });
                    });
                setDrivers(driverMembers);
            } catch (error) {
                console.error("Error fetching drivers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDrivers();
    }, []);

    // Sync state if currentDriverId changes from outside
    useEffect(() => {
        setSelectedDriver(currentDriverId || "");
    }, [currentDriverId]);

    const handleAssign = async (nextDriverId: string) => {
        setSaving(true);
        setError(null);
        try {
            const res = await authFetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driver_id: nextDriverId || null }),
            });

            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                const message = body.error ?? t.common.error;
                setError(message);
                setSelectedDriver(currentDriverId || "");
                toast.error(message);
                return;
            }

            toast.success(nextDriverId ? "Livreur assigné avec succès" : "Livreur désassigné avec succès");
            if (onAssigned) onAssigned();
        } catch (error) {
            setError(t.common.error);
            setSelectedDriver(currentDriverId || "");
            toast.error(t.common.error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-surface-500">
                <Loader2 size={14} className="animate-spin" /> Chargement des livreurs...
            </div>
        );
    }

    if (drivers.length === 0) {
        return (
            <div className="text-sm text-surface-500 italic">
                Aucun livreur disponible. Ajoutez-en dans l'onglet Équipe.
            </div>
        );
    }

    const currentDriver = drivers.find((driver) => driver.userId === (currentDriverId || ""));

    return (
        <div className="space-y-3 mt-4 border-t border-surface-100 dark:border-surface-800 pt-4">
            <label className="text-sm font-medium text-surface-900 dark:text-white flex items-center gap-2">
                <Truck size={16} className="text-brand-500" />
                Assigner un Livreur
            </label>
            <div className="space-y-2">
                <Select
                    value={selectedDriver}
                    onChange={(e) => {
                        const nextDriverId = e.target.value;
                        setSelectedDriver(nextDriverId);
                        void handleAssign(nextDriverId);
                    }}
                    disabled={saving}
                    options={[
                        { value: "", label: "-- Non assigné --" },
                        ...drivers.map((driver) => ({
                            value: driver.userId,
                            label: driver.fullName || driver.email || driver.userId,
                        })),
                    ]}
                />
                <div className="min-h-5">
                    {saving ? (
                        <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                            <Loader2 size={12} className="animate-spin" /> Enregistrement de l'assignation...
                        </div>
                    ) : error ? (
                        <p className="text-xs text-red-500">{error}</p>
                    ) : currentDriver ? (
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                            Livreur actuel: <span className="font-medium text-surface-700 dark:text-surface-200">{currentDriver.fullName || currentDriver.email}</span>
                        </p>
                    ) : (
                        <p className="text-xs text-surface-500 dark:text-surface-400">Aucun livreur assigné à cette commande.</p>
                    )}
                </div>
            </div>
            <p className="text-[10px] text-surface-400 italic leading-tight">
                {(t.orders as any).deliveryDisclaimer}
            </p>
        </div>
    );
}
