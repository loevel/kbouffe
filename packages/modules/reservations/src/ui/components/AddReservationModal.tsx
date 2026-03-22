"use client";

import { useState } from "react";
import { 
    Button, Input, Modal, ModalFooter, Select, Textarea, toast, useLocale 
} from "@kbouffe/module-core/ui";
import { createReservation } from "../../hooks/use-reservations";
import type { RestaurantTable, TableZone, ReservationOccasion } from "../../lib/types";

const OCCASION_OPTIONS = [
    { value: "", labelKey: "noOccasion", icon: "" },
    { value: "birthday", labelKey: "occasionBirthday", icon: "🎂" },
    { value: "dinner", labelKey: "occasionDinner", icon: "🍽️" },
    { value: "surprise", labelKey: "occasionSurprise", icon: "🎁" },
    { value: "business", labelKey: "occasionBusiness", icon: "💼" },
    { value: "anniversary", labelKey: "occasionAnniversary", icon: "💍" },
    { value: "date", labelKey: "occasionDate", icon: "❤️" },
    { value: "family", labelKey: "occasionFamily", icon: "👨‍👩‍👧‍👦" },
    { value: "other", labelKey: "occasionOther", icon: "📌" },
] as const;

interface AddReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    tables: RestaurantTable[];
    zones?: TableZone[];
    onCreated: () => void;
}

export function AddReservationModal({
    isOpen,
    onClose,
    tables,
    zones = [],
    onCreated,
}: AddReservationModalProps) {
    const { t } = useLocale();
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [partySize, setPartySize] = useState(2);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState("12:00");
    const [duration, setDuration] = useState(90);
    const [tableId, setTableId] = useState("");
    const [zoneId, setZoneId] = useState("");
    const [occasion, setOccasion] = useState<ReservationOccasion | "">("");
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
        setZoneId("");
        setOccasion("");
        setSpecialRequests("");
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        
        // Basic validation
        if (partySize < 1 || partySize > 20) {
            toast.error("Le nombre de personnes doit être entre 1 et 20");
            return;
        }

        setLoading(true);
        try {
            const result = await createReservation({
                customer_name: name.trim(),
                customer_phone: phone.trim() || null,
                customer_email: email.trim() || null,
                party_size: partySize,
                date,
                time,
                duration,
                table_id: tableId || null,
                zone_id: zoneId || null,
                occasion: occasion || null,
                special_requests: specialRequests.trim() || null,
                status: "pending"
            });

            if (!result.success) {
                toast.error(result.error ?? t.common.error);
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
                label: `#${tb.number} (${tb.capacity} ${t.tables.seats})${ (tb as any).table_zones ? ` — ${ (tb as any).table_zones.name}` : ""}`,
            })),
    ];

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={t.reservations.addReservation} 
            description={t.reservations.addReservationDesc}
        >
            <div className="space-y-4 py-2">
                <Input
                    label={t.reservations.customerName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jean Dupont"
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t.reservations.customerPhone}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="06 12 34 56 78"
                    />
                    <Input
                        label={t.reservations.customerEmail}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jean.dupont@example.com"
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
                {zones.length > 0 && (
                    <Select
                        label={t.reservations.zone}
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                        options={[
                            { value: "", label: t.reservations.noZonePreference },
                            ...zones.map((z) => ({ value: z.id, label: z.name })),
                        ]}
                    />
                )}
                <div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">{t.reservations.occasion}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {OCCASION_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setOccasion(opt.value)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium ${
                                    occasion === opt.value
                                        ? "bg-brand-500 text-white border-brand-500"
                                        : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-brand-300"
                                }`}
                            >
                                {"icon" in opt ? `${opt.icon} ` : ""}{t.reservations[opt.labelKey as keyof typeof t.reservations] ?? opt.value}
                            </button>
                        ))}
                    </div>
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
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    {t.common.cancel}
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    isLoading={loading} 
                    disabled={!name.trim()}
                    className="bg-brand-500 hover:bg-brand-600 text-white border-none"
                >
                    {t.common.create}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
