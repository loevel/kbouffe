"use client";

import { useState, useRef, useEffect, cloneElement, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";

interface DropdownItem {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
}

interface DropdownProps {
    items: DropdownItem[];
    trigger?: ReactNode;
    align?: "left" | "right";
    className?: string;
}

export function Dropdown({ items, trigger, align = "right", className }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className={cn("relative inline-block", className)}>
            {isValidElement(trigger) ? (
                cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
                    onClick: () => setIsOpen(!isOpen),
                })
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500 dark:text-surface-400"
                >
                    <MoreVertical size={18} />
                </button>
            )}

            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-1 w-48 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg py-1",
                        align === "right" ? "right-0" : "left-0"
                    )}
                >
                    {items.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (!item.disabled) {
                                    item.onClick();
                                    setIsOpen(false);
                                }
                            }}
                            disabled={item.disabled}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors",
                                item.disabled && "opacity-50 cursor-not-allowed",
                                item.variant === "danger"
                                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    : "text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                            )}
                        >
                            {item.icon && (
                                <span className="shrink-0">{item.icon}</span>
                            )}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
