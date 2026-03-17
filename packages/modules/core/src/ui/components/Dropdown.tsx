"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

export interface DropdownItem {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    variant?: "default" | "danger";
    disabled?: boolean;
}

interface DropdownProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: "left" | "right";
    className?: string;
}

export function Dropdown({
    trigger,
    items,
    align = "right",
    className
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-2 w-56 rounded-xl bg-white dark:bg-surface-900 shadow-xl border border-surface-100 dark:border-surface-800 py-2 focus:outline-none animate-in fade-in zoom-in duration-200",
                        align === "right" ? "right-0" : "left-0"
                    )}
                >
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                item.onClick();
                                setIsOpen(false);
                            }}
                            disabled={item.disabled}
                            className={cn(
                                "flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                item.variant === "danger"
                                    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                    : "text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800",
                                item.disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {item.icon && <item.icon size={16} />}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
