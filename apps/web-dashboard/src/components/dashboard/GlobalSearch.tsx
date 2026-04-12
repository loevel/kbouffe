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

const ICON_MAP: Record<SearchResult["type"], React.ElementType> = {
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
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const openSearch = useCallback(() => {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    useKeyDown("k", openSearch);

    useEffect(() => {
        if (!open) { setQuery(""); setResults([]); setActiveIdx(-1); }
    }, [open]);

    // Reset active index when results change
    useEffect(() => { setActiveIdx(-1); }, [results]);

    useEffect(() => {
        // Strip leading # so "#A3F2C1" → "A3F2C1" before sending to API
        const cleaned = query.trim().replace(/^#/, "");
        if (cleaned.length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await authFetch(`/api/restaurant/search?q=${encodeURIComponent(cleaned)}`);
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

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") { setOpen(false); return; }
        if (results.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            navigate(results[activeIdx]);
        }
    }

    // Scroll active item into view
    useEffect(() => {
        if (activeIdx < 0 || !listRef.current) return;
        const item = listRef.current.querySelectorAll("[data-result]")[activeIdx] as HTMLElement | undefined;
        item?.scrollIntoView({ block: "nearest" });
    }, [activeIdx]);

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
                        onKeyDown={handleKeyDown}
                        aria-autocomplete="list"
                        aria-controls="search-results"
                        aria-activedescendant={activeIdx >= 0 ? `search-result-${activeIdx}` : undefined}
                    />
                    <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        <X size={16} className="text-surface-400" />
                    </button>
                </div>

                {/* Results */}
                <div ref={listRef} id="search-results" role="listbox" className="max-h-80 overflow-y-auto">
                    {loading && (
                        <div className="p-6 text-center text-sm text-surface-400">Recherche…</div>
                    )}
                    {!loading && query.trim().replace(/^#/, "").length >= 2 && results.length === 0 && (
                        <div className="p-6 text-center text-sm text-surface-400">Aucun résultat pour « {query} »</div>
                    )}
                    {!loading && results.map((r, idx) => {
                        const Icon = ICON_MAP[r.type];
                        const isActive = idx === activeIdx;
                        return (
                            <button
                                key={`${r.type}-${r.id}`}
                                id={`search-result-${idx}`}
                                role="option"
                                aria-selected={isActive}
                                data-result
                                onClick={() => navigate(r)}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isActive ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-surface-50 dark:hover:bg-surface-800"}`}
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
                        <div className="p-6 space-y-4">
                            <div className="text-xs text-surface-400 text-center font-medium">EXEMPLES DE RECHERCHE</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-surface-500 px-2">
                                    <ShoppingBag size={12} />
                                    <span>N° commande : #A3F2C1</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-surface-500 px-2">
                                    <UtensilsCrossed size={12} />
                                    <span>Produit : Pizza, Poulet DG</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-surface-500 px-2">
                                    <Users size={12} />
                                    <span>Client : Jean, +237 6…</span>
                                </div>
                            </div>
                            <div className="text-xs text-surface-500 text-center pt-2 border-t border-surface-100 dark:border-surface-800">
                                Raccourci clavier : <kbd className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-xs">⌘K</kbd>
                                <span className="mx-2">·</span>
                                <kbd className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-xs">↑↓</kbd> naviguer
                                <span className="mx-2">·</span>
                                <kbd className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-xs">↵</kbd> ouvrir
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
