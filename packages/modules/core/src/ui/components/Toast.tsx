"use client";

import { Toaster, toast as hotToast } from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: "var(--color-surface-50)",
                    color: "var(--color-surface-900)",
                    border: "1px solid var(--color-surface-200)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    fontSize: "0.875rem",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                },
            }}
        />
    );
}

export const toast = {
    success: (message: string) =>
        hotToast(message, {
            icon: <CheckCircle size={18} className="text-green-500 shrink-0" />,
        }),

    error: (message: string) =>
        hotToast(message, {
            icon: <XCircle size={18} className="text-red-500 shrink-0" />,
        }),

    warning: (message: string) =>
        hotToast(message, {
            icon: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
        }),

    info: (message: string) =>
        hotToast(message, {
            icon: <Info size={18} className="text-blue-500 shrink-0" />,
        }),
};
