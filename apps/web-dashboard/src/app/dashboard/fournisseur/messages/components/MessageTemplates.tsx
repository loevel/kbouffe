"use client";

/**
 * MessageTemplates -- Dropdown de modeles de reponse predefinies
 *
 * - 5 templates predefinies (prix volume, en stock, delai, confirmation, remboursement)
 * - Option "Custom" pour creer un template personnel
 * - Les templates custom sont sauvegardes en localStorage
 * - Clic sur un template = insere dans le textarea de reponse
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    ChevronDown,
    Plus,
    X,
    Trash2,
    Check,
    BookOpen,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Template {
    id: string;
    label: string;
    text: string;
    isCustom?: boolean;
}

interface MessageTemplatesProps {
    onInsert: (text: string) => void;
}

// ── Predefined templates ──────────────────────────────────────────────────

const PREDEFINED_TEMPLATES: Template[] = [
    {
        id: "prix_volume",
        label: "Prix volume",
        text: "Disponible en quantite. Tarif degressif a partir de 5 unites.",
    },
    {
        id: "en_stock",
        label: "En stock",
        text: "Oui, produit disponible immediatement.",
    },
    {
        id: "delai",
        label: "Delai",
        text: "Delai de livraison: 2-3 jours ouvrables.",
    },
    {
        id: "confirmation",
        label: "Confirmation",
        text: "Commande confirmee et en preparation.",
    },
    {
        id: "remboursement",
        label: "Remboursement",
        text: "Remboursement approuve. Credit sur le prochain achat.",
    },
];

const STORAGE_KEY = "kbouffe_supplier_custom_templates";

function loadCustomTemplates(): Template[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as Template[];
    } catch {
        return [];
    }
}

function saveCustomTemplates(templates: Template[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

// ── Component ─────────────────────────────────────────────────────────────

export function MessageTemplates({ onInsert }: MessageTemplatesProps) {
    const [open, setOpen] = useState(false);
    const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customLabel, setCustomLabel] = useState("");
    const [customText, setCustomText] = useState("");
    const [justInserted, setJustInserted] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load custom templates on mount
    useEffect(() => {
        setCustomTemplates(loadCustomTemplates());
    }, []);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setShowCustomInput(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const allTemplates = [...PREDEFINED_TEMPLATES, ...customTemplates];

    const handleInsert = useCallback(
        (template: Template) => {
            onInsert(template.text);
            setJustInserted(template.id);
            setTimeout(() => setJustInserted(null), 1500);
        },
        [onInsert]
    );

    function handleSaveCustom() {
        if (!customLabel.trim() || !customText.trim()) return;
        const newTemplate: Template = {
            id: `custom_${Date.now()}`,
            label: customLabel.trim(),
            text: customText.trim(),
            isCustom: true,
        };
        const updated = [...customTemplates, newTemplate];
        setCustomTemplates(updated);
        saveCustomTemplates(updated);
        setCustomLabel("");
        setCustomText("");
        setShowCustomInput(false);
    }

    function handleDeleteCustom(id: string) {
        const updated = customTemplates.filter((t) => t.id !== id);
        setCustomTemplates(updated);
        saveCustomTemplates(updated);
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 border border-white/8 text-surface-300 hover:text-white text-xs font-medium transition-all"
                aria-expanded={open}
                aria-haspopup="true"
            >
                <BookOpen size={13} />
                Modeles
                <ChevronDown
                    size={12}
                    className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 bottom-full mb-2 z-50 w-80 max-h-[360px] overflow-y-auto bg-surface-900 border border-white/10 rounded-xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8">
                            <span className="text-xs font-semibold text-surface-300">
                                Modeles de reponse
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    setShowCustomInput(false);
                                }}
                                className="w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-white hover:bg-surface-700 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        {/* Templates list */}
                        <div className="py-1">
                            {allTemplates.map((tpl) => (
                                <div
                                    key={tpl.id}
                                    className="group flex items-start gap-2 px-3 py-2 hover:bg-white/4 transition-colors"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleInsert(tpl)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <FileText size={11} className="text-surface-500 shrink-0" />
                                            <span className="text-xs font-semibold text-surface-200">
                                                {tpl.label}
                                            </span>
                                            {tpl.isCustom && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                                    perso
                                                </span>
                                            )}
                                            {justInserted === tpl.id && (
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-emerald-400"
                                                >
                                                    <Check size={11} />
                                                </motion.span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-2 leading-relaxed">
                                            {tpl.text}
                                        </p>
                                    </button>
                                    {tpl.isCustom && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCustom(tpl.id)}
                                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all shrink-0 mt-0.5"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/8" />

                        {/* Custom template creation */}
                        {!showCustomInput ? (
                            <button
                                type="button"
                                onClick={() => setShowCustomInput(true)}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-brand-400 hover:bg-brand-500/5 transition-colors font-medium"
                            >
                                <Plus size={12} />
                                Creer un modele personnalise
                            </button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 space-y-2"
                            >
                                <input
                                    type="text"
                                    placeholder="Nom du modele"
                                    value={customLabel}
                                    onChange={(e) => setCustomLabel(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                                    autoFocus
                                />
                                <textarea
                                    placeholder="Texte du modele..."
                                    value={customText}
                                    onChange={(e) => setCustomText(e.target.value)}
                                    rows={2}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40 resize-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveCustom}
                                        disabled={!customLabel.trim() || !customText.trim()}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
                                    >
                                        <Check size={11} />
                                        Sauvegarder
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCustomInput(false);
                                            setCustomLabel("");
                                            setCustomText("");
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 text-xs transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
