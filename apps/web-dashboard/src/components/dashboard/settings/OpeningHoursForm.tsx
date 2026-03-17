"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Card, Button, Input, Toggle } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import type { OpeningHours, DayHours, Json } from "@/lib/supabase/types";

const dayKeys: (keyof OpeningHours)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function OpeningHoursForm() {
    const { restaurant, updateRestaurant } = useDashboard();
    const { t } = useLocale();
    const dayLabels: Record<keyof OpeningHours, string> = {
        monday: t.settings.monday,
        tuesday: t.settings.tuesday,
        wednesday: t.settings.wednesday,
        thursday: t.settings.thursday,
        friday: t.settings.friday,
        saturday: t.settings.saturday,
        sunday: t.settings.sunday,
    };
    const [hours, setHours] = useState<OpeningHours>(
        (restaurant?.opening_hours as unknown as OpeningHours) ?? {
            monday: { isOpen: true, open: "08:00", close: "22:00" },
            tuesday: { isOpen: true, open: "08:00", close: "22:00" },
            wednesday: { isOpen: true, open: "08:00", close: "22:00" },
            thursday: { isOpen: true, open: "08:00", close: "22:00" },
            friday: { isOpen: true, open: "08:00", close: "22:00" },
            saturday: { isOpen: true, open: "09:00", close: "23:00" },
            sunday: { isOpen: false, open: "09:00", close: "20:00" },
        }
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (restaurant?.opening_hours) {
            setHours(restaurant.opening_hours as unknown as OpeningHours);
        }
    }, [restaurant]);

    const updateDay = (day: keyof OpeningHours, field: keyof DayHours, value: unknown) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await updateRestaurant({
            opening_hours: hours as unknown as Json,
        });
        if (error) {
            toast.error(`${t.settings.errorPrefix}${error}`);
        } else {
            toast.success(t.settings.hoursUpdated);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.settings.openingHours}</h3>
                <div className="space-y-3">
                    {dayKeys.map((day) => (
                        <div key={day} className="flex items-center gap-4 py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                            <div className="w-28 shrink-0">
                                <Toggle
                                    checked={hours[day].isOpen}
                                    onChange={(val) => updateDay(day, "isOpen", val)}
                                    label={dayLabels[day]}
                                />
                            </div>
                            {hours[day].isOpen ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        value={hours[day].open}
                                        onChange={(e) => updateDay(day, "open", e.target.value)}
                                        className="w-32"
                                    />
                                    <span className="text-surface-400">{t.settings.to}</span>
                                    <Input
                                        type="time"
                                        value={hours[day].close}
                                        onChange={(e) => updateDay(day, "close", e.target.value)}
                                        className="w-32"
                                    />
                                </div>
                            ) : (
                                <span className="text-sm text-surface-400">{t.settings.closed}</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>{t.common.save}</Button>
                </div>
            </Card>
        </form>
    );
}
