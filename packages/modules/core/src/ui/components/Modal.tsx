"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    description?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};

export function Modal({
    isOpen,
    onClose,
    children,
    title,
    description,
    size = "md",
    className,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Content */}
            <div
                className={cn(
                    "relative w-full bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800",
                    sizeStyles[size],
                    className
                )}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="px-6 pt-6 pb-4 border-b border-surface-100 dark:border-surface-800">
                        <div className="flex items-start justify-between">
                            <div>
                                {title && (
                                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors p-1 -m-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

interface ModalFooterProps {
    children: ReactNode;
    className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800",
                className
            )}
        >
            {children}
        </div>
    );
}
