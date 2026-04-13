"use client";

import { Calendar, X } from "lucide-react";

export interface DateRange {
    from: string;
    to: string;
}

interface DateRangePickerProps {
    from: string;
    to: string;
    onChange: (range: DateRange) => void;
    label?: string;
}

function getPresetRange(preset: string): DateRange {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    switch (preset) {
        case "today":
            return { from: fmt(today), to: fmt(today) };
        case "7d": {
            const d = new Date(today);
            d.setDate(d.getDate() - 6);
            return { from: fmt(d), to: fmt(today) };
        }
        case "30d": {
            const d = new Date(today);
            d.setDate(d.getDate() - 29);
            return { from: fmt(d), to: fmt(today) };
        }
        case "month": {
            const d = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: fmt(d), to: fmt(today) };
        }
        default:
            return { from: "", to: "" };
    }
}

const PRESETS = [
    { key: "today", label: "Aujourd'hui" },
    { key: "7d", label: "7 jours" },
    { key: "30d", label: "30 jours" },
    { key: "month", label: "Ce mois" },
] as const;

export function DateRangePicker({ from, to, onChange, label = "Période" }: DateRangePickerProps) {
    const hasValue = from || to;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 px-0.5">
                <Calendar size={11} className="text-surface-400" />
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800/50 rounded-xl px-3 py-2.5 border border-surface-200/50 dark:border-surface-700/50">
                    <input
                        type="date"
                        value={from}
                        max={to || undefined}
                        onChange={(e) => onChange({ from: e.target.value, to })}
                        className="text-xs font-bold text-surface-900 dark:text-white bg-transparent border-none outline-none cursor-pointer"
                    />
                    <span className="text-surface-300 dark:text-surface-600 font-bold select-none">—</span>
                    <input
                        type="date"
                        value={to}
                        min={from || undefined}
                        onChange={(e) => onChange({ from, to: e.target.value })}
                        className="text-xs font-bold text-surface-900 dark:text-white bg-transparent border-none outline-none cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-1">
                    {PRESETS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => onChange(getPresetRange(p.key))}
                            className="px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest text-surface-400 hover:text-brand-500 hover:bg-brand-500/5"
                        >
                            {p.label}
                        </button>
                    ))}
                    {hasValue && (
                        <button
                            type="button"
                            onClick={() => onChange({ from: "", to: "" })}
                            className="p-1.5 rounded-lg transition-all text-surface-300 hover:text-rose-500 hover:bg-rose-500/5"
                            title="Effacer les dates"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
