"use client";

import { useTheme, type Theme } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/contexts/locale-context";

export function ThemeSelector({ className }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { t } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const themes: { id: Theme; label: string; icon: any }[] = [
        { id: "light", label: t.theme?.light || "Light", icon: Sun },
        { id: "dark", label: t.theme?.dark || "Dark", icon: Moon },
        { id: "system", label: t.theme?.system || "System", icon: Laptop },
    ];

    const ActiveIcon = resolvedTheme === "dark" ? Moon : Sun;

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-surface-400 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 transition-all outline-none"
                aria-label="Select Theme"
            >
                <ActiveIcon size={14} className="opacity-70" />
                <ChevronDown size={12} className={cn("transition-transform duration-300 opacity-50", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-44 bg-white dark:bg-surface-900 border border-surface-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl"
                    >
                        <div className="p-1.5">
                            {themes.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setTheme(item.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 w-full px-3 py-2 text-sm font-bold rounded-xl transition-all text-left",
                                        theme === item.id
                                            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                                            : "text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-white/5 hover:text-surface-900 dark:hover:text-white"
                                    )}
                                >
                                    <item.icon size={16} className={cn(theme === item.id ? "text-white" : "opacity-70")} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
