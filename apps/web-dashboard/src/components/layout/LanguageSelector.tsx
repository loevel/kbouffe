"use client";

import { useLocale } from "@kbouffe/module-core/ui";
import { localeLabels, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Globe, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSelector({ className }: { className?: string }) {
    const { locale, setLocale } = useLocale();
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

    const handleSelect = (l: Locale) => {
        setLocale(l);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] font-bold text-surface-400 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 transition-all outline-none"
                aria-label="Select Language"
            >
                <Globe size={14} className="opacity-70" />
                <span className="uppercase tracking-wider">{locale}</span>
                <ChevronDown size={12} className={cn("transition-transform duration-300 opacity-50", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-36 bg-white dark:bg-surface-900 border border-surface-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl"
                    >
                        <div className="p-1.5">
                            {(Object.keys(localeLabels) as Locale[]).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => handleSelect(l)}
                                    className={cn(
                                        "flex items-center w-full px-3 py-2 text-sm font-bold rounded-xl transition-all",
                                        locale === l
                                            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                                            : "text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-white/5 hover:text-surface-900 dark:hover:text-white"
                                    )}
                                >
                                    {localeLabels[l]}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
