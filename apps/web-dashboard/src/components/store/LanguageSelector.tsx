"use client";

import { useLocale } from "@/contexts/locale-context";
import { localeLabels, type Locale } from "@/lib/i18n/index";
import { Languages, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSelector() {
    const { locale, setLocale } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleSelect = (l: Locale) => {
        setLocale(l);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={toggleOpen}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                aria-label="Changer de langue"
            >
                <Languages size={18} className="text-brand-500" />
                <span className="hidden sm:inline">{localeLabels[locale]}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 p-2 z-50 overflow-hidden"
                    >
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-1">
                            Langue
                        </div>
                        <div className="space-y-1">
                            {(Object.keys(localeLabels) as Locale[]).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => handleSelect(l)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                        locale === l
                                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                            : "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                                    }`}
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
