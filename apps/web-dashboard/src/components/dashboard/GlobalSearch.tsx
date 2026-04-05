"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, UtensilsCrossed, Users, X, ArrowRight } from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";

interface SearchResult {
    type: "order" | "product" | "customer";
    id: string;
    title: string;
    subtitle?: string;
    href: string;
}

function useKeyDown(key: string, callback: () => void) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === key) {
                e.preventDefault();
                callback();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [key, callback]);
}

const ICON_MAP: Record<SearchResult["type"], any> = {
    order: ShoppingBag,
    product: UtensilsCrossed,
    customer: Users,
};
const LABEL_MAP: Record<SearchResult["type"], string> = {
    order: "Commande",
    product: "Produit",
    customer: "Client",
};

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const openSearch = useCallback(() => {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    useKeyDown("k", openSearch);

    useEffect(() => {
        if (!open) { setQuery(""); setResults([]); }
    }, [open]);

    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await authFetch(`/api/restaurant/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const json = await res.json();
                    setResults(json.results ?? []);
                }
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    function navigate(result: SearchResult) {
        router.push(result.href);
        setOpen(false);
    }

    if (!open) {
        return (
            <button
                onClick={openSearch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-500 dark:text-surface-400 text-sm hover:border-brand-500 transition-colors"
                title="Recherche rapide (⌘K)"
            >
                <Search size={15} />
                <span className="hidden sm:inline">Rechercher…</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
            <div className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Input */}
                <div className="flex items-center gap-3 p-4 border-b border-surface-100 dark:border-surface-800">
                    <Search size={18} className="text-surface-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Chercher commande #, produit, client…"
                        className="flex-1 text-sm bg-transparent outline-none text-surface-900 dark:text-white placeholder:text-surface-400"
                        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
                    />
                    <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        <X size={16} className="text-surface-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {loading && (
                        <div className="p-6 text-center text-sm text-surface-400">Recherche…</div>
                    )}
                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="p-6 text-center text-sm text-surface-400">Aucun résultat pour « {query} »</div>
                    )}
                    {!loading && results.map((r) => {
                        const Icon = ICON_MAP[r.type];
                        return (
                            <button
                                key={`${r.type}-${r.id}`}
                                onClick={() => navigate(r)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                                    <Icon size={16} className="text-brand-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{r.title}</p>
                                    {r.subtitle && <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{r.subtitle}</p>}
                                </div>
                                <span className="text-xs text-surface-400 shrink-0">{LABEL_MAP[r.type]}</span>
                                <ArrowRight size={14} className="text-surface-400 shrink-0" />
                            </button>
                        );
                    })}
                    {!query && (
                        <div className="p-4 text-xs text-surface-400 text-center">
                            Tapez le n° de commande, nom d'un produit ou d'un client
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
