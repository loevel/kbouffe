"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import {
    Bell,
    Building2,
    CalendarClock,
    ChevronDown,
    Clock,
    CreditCard,
    Heart,
    HelpCircle,
    Home,
    LifeBuoy,
    Loader2,
    Lock,
    LogOut,
    MapPin,
    Menu,
    Navigation,
    Receipt,
    Search,
    Shield,
    ShoppingBag,
    ShoppingCart,
    SlidersHorizontal,
    Tag,
    User,
    X,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { KbouffeIcon } from "@/components/brand/Logo";
import { useUserSession, useCartTotals, useSearchStore } from "@/store/client-store";
import {
    clientSectionPath,
    sectionGroups,
    type ClientSectionIcon,
    type ClientSectionId,
} from "@/components/store/client-sections";

import { getCurrentCoordinates, getCityFromCoordinates } from "@/lib/location-utils";
import { toast } from "react-hot-toast";
import { LanguageSelector } from "./LanguageSelector";
import { UserMenu } from "./UserMenu";

const CITIES = ["Douala", "Yaoundé", "Garoua", "Kribi", "Bafoussam"];

const HISTORY_KEY = "kbouffe_search_history";
const MAX_HISTORY = 8;
function getHistory(): string[] {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(q: string) {
    const prev = getHistory().filter((h) => h !== q);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)));
}
function deleteHistoryItem(q: string) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter((h) => h !== q)));
}

function itemIcon(icon: ClientSectionIcon) {
    switch (icon) {
        case "home": return <Home size={20} />;
        case "orders": return <ShoppingBag size={20} />;
        case "reservations": return <CalendarClock size={20} />;
        case "promotions": return <Tag size={20} />;
        case "favorites": return <Heart size={20} />;
        case "addresses": return <MapPin size={20} />;
        case "payments": return <CreditCard size={20} />;
        case "preferences": return <SlidersHorizontal size={20} />;
        case "notifications": return <Bell size={20} />;
        case "security": return <Shield size={20} />;
        case "profile": return <User size={20} />;
        case "support": return <LifeBuoy size={20} />;
        default: return <HelpCircle size={20} />;
    }
}

export function ClientStoresChrome({
    activeSection,
    children,
}: {
    activeSection: ClientSectionId;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
    const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [modeOpen, setModeOpen] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const searchDropdownRef = useRef<HTMLDivElement>(null);
    const { logout } = useUserSession();
    const { itemCount } = useCartTotals();
    const { filters, updateFilters } = useSearchStore();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (q) saveHistory(q);
        setSearchOpen(false);
        router.push(`/stores/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    };

    const pickSearch = (q: string) => {
        setSearchQuery(q);
        saveHistory(q);
        setSearchOpen(false);
        router.push(`/stores/search?q=${encodeURIComponent(q)}`);
    };

    const removeHistoryItem = (q: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteHistoryItem(q);
        setSearchHistory(getHistory());
    };

    const flatItems = useMemo(() => sectionGroups.flatMap((group) => group.items), []);

    async function handleSignOut() {
        logout();
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    const handleAutoDetectLocation = async () => {
        setIsDetectingLocation(true);
        try {
            const coords = await getCurrentCoordinates();
            const result = await getCityFromCoordinates(coords);
            updateFilters({ city: result.city });
            toast.success(`Position détectée : ${result.city}`);
            setIsCityMenuOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Impossible de détecter votre position");
        } finally {
            setIsDetectingLocation(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 flex transition-colors duration-500">
            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 left-0 z-30 border-r border-surface-100 dark:border-white/5 bg-white dark:bg-surface-950">
                {/* Logo */}
                <div className="h-16 px-5 flex items-center border-b border-surface-100 dark:border-white/5">
                    <Link href="/stores" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                            <KbouffeIcon size={18} className="text-white" />
                        </div>
                        <span className="text-lg font-black tracking-tight text-surface-900 dark:text-white uppercase italic">Kbouffe</span>
                    </Link>
                </div>

                {/* Nav */}
                <div className="px-3 py-4 overflow-y-auto flex-1 space-y-6">
                    {sectionGroups.map((group) => (
                        <div key={group.title}>
                            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-600">
                                {group.title}
                            </p>
                            <nav className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = activeSection === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={clientSectionPath[item.id]}
                                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                                isActive
                                                    ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                                    : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-900 hover:text-surface-900 dark:hover:text-white"
                                            }`}
                                        >
                                            <div className={`shrink-0 transition-colors ${isActive ? "text-brand-500" : "text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300"}`}>
                                                {itemIcon(item.icon)}
                                            </div>
                                            <span className="truncate">{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Bottom card */}
                <div className="p-3 border-t border-surface-100 dark:border-white/5">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 text-white">
                        <div className="flex items-center gap-1.5 mb-1.5 font-bold text-xs">
                            <Sparkles size={13} /> KBouffe+
                        </div>
                        <p className="text-[11px] opacity-85 leading-relaxed mb-3">
                            Accédez aux offres exclusives et à la livraison prioritaire.
                        </p>
                        <button className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 text-[11px] font-bold transition-colors">
                            Découvrir
                        </button>
                    </div>
                </div>
            </aside>

            {/* Spacer for fixed sidebar */}
            <div className="hidden lg:block lg:w-64 shrink-0" />

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
                <header
                    className={`fixed top-0 right-0 z-40 transition-all duration-300 h-14 flex items-center gap-3 px-4 lg:px-8 ${
                        scrolled
                            ? "w-full lg:w-[calc(100%-16rem)] bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-white/5"
                            : "w-full lg:w-[calc(100%-16rem)] bg-white dark:bg-surface-950"
                    }`}
                >
                    {/* Mobile menu button */}
                    <button
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors lg:hidden shrink-0"
                        onClick={() => setIsAccountDrawerOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    {/* Mode dropdown */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setModeOpen((o) => !o)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-surface-900 dark:text-white hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                        >
                            {filters.deliveryMode === "pickup" ? "Ramassage" : filters.deliveryMode === "reservation" ? "Réservation" : "Livraison"}
                            <ChevronDown size={15} className={`text-surface-400 transition-transform duration-200 ${modeOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                            {modeOpen && (
                                <>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setModeOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute top-full left-0 mt-2 w-44 bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-white/5 shadow-xl z-50 py-1.5 overflow-hidden"
                                    >
                                        {([
                                            { id: "delivery", label: "Livraison" },
                                            { id: "pickup", label: "Ramassage" },
                                            { id: "reservation", label: "Réservation" },
                                        ] as const).map(({ id, label }) => (
                                            <button
                                                key={id}
                                                onClick={() => { updateFilters({ deliveryMode: id as any }); setModeOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                                    filters.deliveryMode === id
                                                        ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10"
                                                        : "text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-5 bg-surface-200 dark:bg-surface-700 shrink-0" />

                    {/* City selector */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsCityMenuOpen(!isCityMenuOpen)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:text-surface-900 dark:hover:text-white transition-colors"
                        >
                            <MapPin size={15} className="text-brand-500 shrink-0" />
                            <span className="hidden sm:inline">{filters.city}</span>
                            <span className="sm:hidden">{filters.city?.slice(0, 3)}</span>
                            <ChevronDown size={14} className={`text-surface-400 transition-transform duration-200 ${isCityMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                            {isCityMenuOpen && (
                                <>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none" onClick={() => setIsCityMenuOpen(false)} />
                                    
                                    {/* Mobile: bottom sheet */}
                                    <motion.div
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        exit={{ y: "100%" }}
                                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                                        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-surface-900 rounded-t-2xl shadow-2xl p-4 pb-8 max-h-[70vh] overflow-y-auto"
                                    >
                                        <div className="w-8 h-1 bg-surface-200 dark:bg-surface-700 rounded-full mx-auto mb-4" />
                                        <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-3 px-1">Choisir une ville</p>
                                        <button onClick={handleAutoDetectLocation} disabled={isDetectingLocation} className="w-full flex items-center gap-2.5 px-4 py-3 mb-3 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 transition-colors active:opacity-80">
                                            {isDetectingLocation ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                                            {isDetectingLocation ? "Détection..." : "Utiliser ma position"}
                                        </button>
                                        <div className="space-y-1">
                                            {CITIES.map((city) => (
                                                <button key={city} onClick={() => { updateFilters({ city }); setIsCityMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${filters.city === city ? "bg-brand-500 text-white" : "text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"}`}>
                                                    {city}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Desktop: dropdown */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="hidden md:block absolute top-full left-0 mt-2 w-52 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-100 dark:border-white/5 py-2 z-50"
                                    >
                                        <p className="px-4 py-2 text-xs font-semibold text-surface-400 dark:text-surface-500">Choisir une ville</p>
                                        <button onClick={handleAutoDetectLocation} disabled={isDetectingLocation} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                            {isDetectingLocation ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
                                            {isDetectingLocation ? "Détection..." : "Ma position"}
                                        </button>
                                        <div className="my-1.5 border-t border-surface-100 dark:border-white/5" />
                                        {CITIES.map((city) => (
                                            <button key={city} onClick={() => { updateFilters({ city }); setIsCityMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filters.city === city ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10" : "text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"}`}>
                                                {city}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Search icon (mobile only) — dans les actions droite ─────── */}

                    {/* ── Search bar (desktop) ──────────────────────────────────── */}
                    <div className="relative flex-1 max-w-sm hidden md:block" ref={searchDropdownRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => { setSearchHistory(getHistory()); setSearchOpen(true); }}
                                onBlur={(e) => {
                                    if (!searchDropdownRef.current?.contains(e.relatedTarget as Node)) setSearchOpen(false);
                                }}
                                type="search"
                                placeholder="Rechercher dans KBouffe"
                                className={`w-full pl-9 pr-4 py-2 text-sm bg-surface-100 dark:bg-surface-900 border border-transparent focus:border-surface-300 dark:focus:border-surface-600 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:bg-white dark:focus:bg-surface-800 transition-all ${searchOpen ? "rounded-t-xl rounded-b-none" : "rounded-xl"}`}
                            />
                        </form>

                        {searchOpen && (
                            <div className="absolute left-0 right-0 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 border-t-0 rounded-b-xl shadow-lg z-50 overflow-hidden">
                                {searchHistory.length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between px-4 pt-3 pb-1">
                                            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Récent</span>
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => { localStorage.removeItem(HISTORY_KEY); setSearchHistory([]); }}
                                                className="text-[11px] text-surface-400 hover:text-surface-600 transition-colors"
                                            >Tout effacer</button>
                                        </div>
                                        {searchHistory.map((q) => (
                                            <div
                                                key={q}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => pickSearch(q)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group cursor-pointer"
                                            >
                                                <Clock size={14} className="text-surface-400 shrink-0" />
                                                <span className="flex-1 text-sm text-surface-700 dark:text-surface-200">{q}</span>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={(e) => removeHistoryItem(q, e)}
                                                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
                                                >
                                                    <X size={11} className="text-surface-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <p className="px-4 py-4 text-sm text-surface-400 text-center">Aucune recherche récente</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
                        <div className="hidden sm:block">
                            <LanguageSelector />
                        </div>
                        {/* Search icon — mobile only */}
                        <Link
                            href="/stores/search"
                            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            <Search size={20} />
                        </Link>
                        <Link
                            href="/stores/cart"
                            className="relative w-9 h-9 rounded-full flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors group"
                        >
                            <ShoppingCart size={20} className="group-hover:text-surface-900 dark:group-hover:text-white transition-colors" />
                            {itemCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white dark:border-surface-950">
                                    {itemCount > 9 ? "9+" : itemCount}
                                </span>
                            )}
                        </Link>
                        <UserMenu />
                    </div>
                </header>

                <main className="w-full max-w-7xl px-4 sm:px-6 lg:px-10 pt-24 md:pt-32 pb-20">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* ── Mobile Drawer ────────────────────────────────────────────── */}
            <AnimatePresence>
                {isAccountDrawerOpen && (
                    <div className="fixed inset-0 z-[60] lg:hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAccountDrawerOpen(false)} />
                        <motion.aside 
                            initial={{ x: "-100%" }} 
                            animate={{ x: 0 }} 
                            exit={{ x: "-100%" }} 
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 h-full w-[340px] max-w-[85vw] bg-white dark:bg-surface-950 p-6 flex flex-col shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <Link href="/stores" className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                                        <KbouffeIcon size={24} className="text-white" />
                                    </div>
                                    <span className="text-2xl font-black text-surface-900 dark:text-white uppercase italic">Kbouffe</span>
                                </Link>
                                <button onClick={() => setIsAccountDrawerOpen(false)} className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-900 flex items-center justify-center"><X size={20} /></button>
                            </div>

                            {/* City selector in drawer */}
                            <div className="mb-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-3">Ville</p>
                                <div className="flex flex-wrap gap-2">
                                    {CITIES.map((city) => (
                                        <button
                                            key={city}
                                            onClick={() => { updateFilters({ city }); }}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                                filters.city === city
                                                    ? "bg-brand-500 text-white shadow-md"
                                                    : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300"
                                            }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language selector in drawer (visible on sm:hidden) */}
                            <div className="mb-6 sm:hidden">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-3">Langue</p>
                                <LanguageSelector />
                            </div>

                            <div className="space-y-8 flex-1 overflow-y-auto pr-2">
                                {sectionGroups.map((group) => (
                                    <div key={group.title}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-4">{group.title}</p>
                                        <div className="space-y-2">
                                            {group.items.map((item) => (
                                                <Link key={item.id} href={clientSectionPath[item.id]} onClick={() => setIsAccountDrawerOpen(false)} className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black transition-all ${activeSection === item.id ? "bg-brand-500 text-white shadow-xl" : "text-surface-700 dark:text-surface-300 hover:bg-surface-100"}`}>
                                                    {itemIcon(item.icon)} {item.label.toUpperCase()}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-surface-100 dark:border-white/5 space-y-4">
                                <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-sm font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 transition-all hover:scale-[1.02]">
                                    <LogOut size={20} /> DÉCONNEXION
                                </button>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}