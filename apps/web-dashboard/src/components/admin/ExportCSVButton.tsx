"use client";

import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/export-csv";

interface ExportCSVButtonProps {
    data: object[];
    filename: string;
    label?: string;
    disabled?: boolean;
}

export function ExportCSVButton({
    data,
    filename,
    label = "Exporter CSV",
    disabled = false,
}: ExportCSVButtonProps) {
    const handleClick = () => {
        exportToCSV(data, filename);
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || data.length === 0}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-brand-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <Download size={14} />
            {label}
        </button>
    );
}
