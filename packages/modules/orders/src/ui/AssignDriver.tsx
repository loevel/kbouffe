"use client";

import { useState, useEffect } from "react";
import { Truck, Check, Loader2 } from "lucide-react";
import { Button, Select, toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

interface AssignDriverProps {
    orderId: string;
    currentDriverId?: string | null;
    onAssigned?: () => void;
}

export function AssignDriver({ orderId, currentDriverId, onAssigned }: AssignDriverProps) {
    const { t } = useLocale();
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<string>(currentDriverId || "");

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const res = await fetch("/api/team");
                if (!res.ok) return;
                const data = await res.json();
                const allMembers = data.members || [];
                const driverMembers = allMembers.filter((m: any) => m.role === "driver" && m.status === "active");
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

    const handleAssign = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driver_id: selectedDriver || null }),
            });

            if (!res.ok) {
                toast.error(t.common.error);
                return;
            }

            toast.success("Livreur assigné avec succès");
            if (onAssigned) onAssigned();
        } catch (error) {
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

    const hasChanged = selectedDriver !== (currentDriverId || "");

    return (
        <div className="space-y-3 mt-4 border-t border-surface-100 dark:border-surface-800 pt-4">
            <label className="text-sm font-medium text-surface-900 dark:text-white flex items-center gap-2">
                <Truck size={16} className="text-brand-500" />
                Assigner un Livreur
            </label>
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <Select
                        value={selectedDriver}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        options={[
                            { value: "", label: "-- Non assigné --" },
                            ...drivers.map((d) => ({
                                value: d.id, // we save the restaurantMember id
                                label: d.fullName || d.email,
                            })),
                        ]}
                    />
                </div>
                {hasChanged && (
                    <Button size="sm" onClick={handleAssign} isLoading={saving} leftIcon={<Check size={16} />}>
                        Sauver
                    </Button>
                )}
            </div>
            <p className="text-[10px] text-surface-400 italic leading-tight">
                {(t.orders as any).deliveryDisclaimer}
            </p>
        </div>
    );
}
