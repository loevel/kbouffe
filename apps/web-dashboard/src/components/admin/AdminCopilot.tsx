"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Loader2,
    ArrowRight,
    X,
    Sparkles,
    AlertTriangle,
    ExternalLink,
    ChevronRight,
} from "lucide-react";
import { adminFetch } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";

interface CopilotResult {
    intent: string;
    summary: string;
    data: Record<string, any>[];
    count: number | null;
    navigateTo: string | null;
}

const SUGGESTIONS = [
    "Restaurants avec KYC en attente",
    "Tickets support urgents",
    "Virements en attente",
    "Utilisateurs marchands",
    "Statistiques globales",
    "Avis masqués",
    "Restaurants inactifs",
];

function ResultTable({ data }: { data: Record<string, any>[] }) {
    if (!data.length) return null;
    const firstRow = data[0];
    // For get_stats, render as cards
    if ("totalRestaurants" in firstRow) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {Object.entries(firstRow).map(([key, val]) => (
                    <div key={key} className="bg-surface-100 dark:bg-surface-800 rounded-xl p-3 text-center">
                        <div className="text-lg font-extrabold text-surface-900 dark:text-white">
                            {typeof val === "number" && key.toLowerCase().includes("revenue")
                                ? `${val.toLocaleString("fr-FR")} FCFA`
                                : val?.toLocaleString("fr-FR")}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-surface-400 mt-0.5">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const keys = Object.keys(firstRow).filter((k) => k !== "id" && k !== "restaurant_id");
    const displayKeys = keys.slice(0, 4);

    const formatVal = (key: string, val: any) => {
        if (val === null || val === undefined) return <span className="text-surface-300">—</span>;
        if (key.includes("_at") || key === "created_at") {
            return new Date(val).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
        }
        if (key === "amount") return `${Number(val).toLocaleString("fr-FR")} FCFA`;
        if (typeof val === "boolean") return val ? "✅" : "❌";
        return String(val).slice(0, 40);
    };

    return (
        <div className="mt-3 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-surface-100 dark:bg-surface-800">
                        {displayKeys.map((k) => (
                            <th key={k} className="px-3 py-2 text-left font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider whitespace-nowrap">
                                {k.replace(/_/g, " ")}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                            {displayKeys.map((k) => (
                                <td key={k} className="px-3 py-2 text-surface-700 dark:text-surface-300 whitespace-nowrap">
                                    {formatVal(k, row[k])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function AdminCopilot() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CopilotResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // CMD+K / Ctrl+K to open
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery("");
            setResult(null);
            setError(null);
        }
    }, [open]);

    const ask = useCallback(async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const res = await adminFetch("/api/admin/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: trimmed }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
            setResult(json as CopilotResult);
        } catch (err: any) {
            setError(err.message ?? "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        ask(query);
    };

    const goTo = () => {
        if (!result?.navigateTo) return;
        router.push(result.navigateTo);
        setOpen(false);
    };

    return (
        <>
            {/* Trigger button in topbar */}
            <button
                onClick={() => setOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600 transition-all text-xs font-medium"
            >
                <Sparkles size={13} className="text-brand-400" />
                Copilot IA
                <kbd className="ml-1 px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-[10px] font-mono">⌘K</kbd>
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="fixed top-[12%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl mx-4"
                        >
                            <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center gap-2 px-4 py-1 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
                                    <Sparkles size={14} className="text-brand-400 shrink-0" />
                                    <span className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest">Copilot IA</span>
                                    <span className="ml-auto text-[10px] text-surface-300 dark:text-surface-600">Échap pour fermer</span>
                                    <button onClick={() => setOpen(false)} className="p-1 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-lg transition-colors">
                                        <X size={14} className="text-surface-400" />
                                    </button>
                                </div>

                                {/* Search input */}
                                <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3.5">
                                    {loading
                                        ? <Loader2 size={18} className="text-brand-400 animate-spin shrink-0" />
                                        : <Search size={18} className="text-surface-400 shrink-0" />
                                    }
                                    <input
                                        ref={inputRef}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Ex : restaurants avec KYC en attente, tickets urgents…"
                                        className="flex-1 bg-transparent text-sm text-surface-900 dark:text-white placeholder-surface-400 outline-none"
                                        disabled={loading}
                                    />
                                    {query && !loading && (
                                        <button type="submit" className="shrink-0 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                                            Demander <ArrowRight size={12} />
                                        </button>
                                    )}
                                </form>

                                {/* Content */}
                                <div className="max-h-[55vh] overflow-y-auto px-4 pb-4">

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                            <AlertTriangle size={14} className="shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Result */}
                                    {result && (
                                        <div>
                                            {/* Summary */}
                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                <p className="text-sm text-surface-700 dark:text-surface-300 font-medium">
                                                    {result.summary}
                                                    {result.count !== null && (
                                                        <span className="ml-2 text-xs font-normal text-surface-400">
                                                            ({result.count} résultat{result.count !== 1 ? "s" : ""})
                                                        </span>
                                                    )}
                                                </p>
                                                {result.navigateTo && (
                                                    <button
                                                        onClick={goTo}
                                                        className="shrink-0 flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-semibold transition-colors"
                                                    >
                                                        Voir tout <ExternalLink size={11} />
                                                    </button>
                                                )}
                                            </div>

                                            {result.intent === "unknown" ? (
                                                <p className="text-sm text-surface-400 italic py-4 text-center">
                                                    Je n&apos;ai pas compris cette demande. Essayez une formulation différente.
                                                </p>
                                            ) : result.intent === "navigate" ? (
                                                <button
                                                    onClick={goTo}
                                                    className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                                                >
                                                    <ChevronRight size={14} />
                                                    Aller vers {result.navigateTo}
                                                </button>
                                            ) : result.data.length === 0 ? (
                                                <p className="text-sm text-surface-400 italic py-4 text-center">Aucun résultat trouvé.</p>
                                            ) : (
                                                <ResultTable data={result.data} />
                                            )}
                                        </div>
                                    )}

                                    {/* Suggestions (when idle) */}
                                    {!result && !loading && !error && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-2">Suggestions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {SUGGESTIONS.map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => { setQuery(s); ask(s); }}
                                                        className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-sm text-surface-600 dark:text-surface-300 transition-colors"
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
