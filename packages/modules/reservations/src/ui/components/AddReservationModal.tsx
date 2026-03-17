"use client";

import { useState } from "react";
import { 
    Button, Input, Modal, ModalFooter, Select, Textarea, toast, useLocale 
} from "@kbouffe/module-core/ui";
import { createReservation } from "../../hooks/use-reservations";
import { RestaurantTable } from "../../lib/types";

interface AddReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    tables: RestaurantTable[];
    onCreated: () => void;
}

export function AddReservationModal({
    isOpen,
    onClose,
    tables,
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
