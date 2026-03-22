"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
    Bell,
    Building2,
    CalendarClock,
    ChevronDown,
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
        router.push(`/stores/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
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
            <aside className="hidden lg:flex lg:w-72 lg:flex-col fixed inset-y-0 left-0 z-30 border-r border-surface-100 dark:border-white/5 bg-surface-50/50 dark:bg-surface-900/30 backdrop-blur-xl">
                <div className="h-24 px-8 flex items-center gap-4">
                    <Link href="/stores" className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-2xl shadow-brand-500/30">
                            <KbouffeIcon size={28} className="text-white" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-surface-900 dark:text-white uppercase italic">Kbouffe</span>
                    </Link>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-10">
                    {sectionGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                            <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 dark:text-surface-500 mb-4">{group.title}</p>
                            <nav className="space-y-2">
                                {group.items.map((item) => {
                                    const isActive = activeSection === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={clientSectionPath[item.id]}
                                            className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 ${
                                                isActive
                                                    ? "bg-brand-500 text-white shadow-2xl shadow-brand-500/30 translate-x-1"
                                                    : "text-surface-500 dark:text-surface-400 hover:bg-white dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white hover:shadow-xl hover:translate-x-1"
                                            }`}
                                        >
                                            <div className={`${isActive ? "text-white" : "text-surface-400 group-hover:text-brand-500"} transition-colors`}>
                                                {itemIcon(item.icon)}
                                            </div>
                                            {item.label.toUpperCase()}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
                
                <div className="p-6 border-t border-surface-100 dark:border-white/5">
                     <div className="p-4 rounded-3xl bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-2xl shadow-brand-500/20">
                         <div className="flex items-center gap-2 mb-2 font-black text-xs">
                             <Sparkles size={14} /> EXCELLENCE
                         </div>
                         <p className="text-[10px] font-bold opacity-80 leading-relaxed mb-4">Découvrez les meilleures tables sélectionnées pour vous.</p>
                         <button className="w-full py-2.5 rounded-xl bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">
                             Savoir Plus
                         </button>
                     </div>
                </div>
            </aside>

            {/* Spacer for fixed sidebar */}
            <div className="hidden lg:block lg:w-72 shrink-0" />

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
                <header 
                    className={`fixed top-0 right-0 z-40 transition-all duration-500 h-16 md:h-20 flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 lg:px-10 ${
                        scrolled 
                        ? "w-full lg:w-[calc(100%-18rem)] bg-white/80 dark:bg-surface-950/80 backdrop-blur-2xl border-b border-surface-100 dark:border-white/5 shadow-2xl shadow-black/5" 
                        : "w-full lg:w-[calc(100%-18rem)] bg-transparent"
                    }`}
                >
                    <button
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-white/5 flex items-center justify-center text-surface-700 dark:text-surface-300 lg:hidden shadow-lg shrink-0"
                        onClick={() => setIsAccountDrawerOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    <nav className="hidden md:flex items-center gap-1 md:gap-2 p-1 md:p-1.5 bg-surface-100 dark:bg-surface-900 rounded-xl md:rounded-2xl border border-surface-200 dark:border-white/5 shadow-inner shrink-0">
                        {["delivery", "pickup", "reservation"].map((mode) => (
                            <button 
                                key={mode}
                                onClick={() => updateFilters({ deliveryMode: mode as any })}
                                className={`px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-[0.9rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    filters.deliveryMode === mode 
                                    ? "bg-white dark:bg-surface-800 text-brand-600 shadow-xl" 
                                    : "text-surface-500 hover:text-surface-800 dark:hover:text-white"
                                }`}
                            >
                                {mode === "delivery" ? "Livraison" : mode === "pickup" ? "Ramassage" : "Réservation"}
                            </button>
                        ))}
                    </nav>

                    {/* Mobile delivery mode: compact pill */}
                    <div className="flex md:hidden items-center gap-1 p-1 bg-surface-100 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-white/5 shrink-0 overflow-x-auto scrollbar-hide">
                        {["delivery", "pickup", "reservation"].map((mode) => (
                            <button 
                                key={mode}
                                onClick={() => updateFilters({ deliveryMode: mode as any })}
                                className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                    filters.deliveryMode === mode 
                                    ? "bg-white dark:bg-surface-800 text-brand-600 shadow-md" 
                                    : "text-surface-400"
                                }`}
                            >
                                {mode === "delivery" ? "Livraison" : mode === "pickup" ? "Ramassage" : "Réserv."}
                            </button>
                        ))}
                    </div>

                    <div className="relative shrink-0">
                        <button 
                            onClick={() => setIsCityMenuOpen(!isCityMenuOpen)}
                            className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-2.5 sm:px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest text-surface-700 dark:text-surface-200 bg-white dark:bg-surface-900 border border-surface-100 dark:border-white/5 shadow-md md:shadow-lg hover:shadow-xl transition-all"
                        >
                            <MapPin size={14} className="text-brand-500 shrink-0 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
                            <span className="hidden sm:inline">{filters.city}</span>
                            <span className="sm:hidden">{filters.city?.slice(0, 3)}</span>
                            <ChevronDown size={12} className={`transition-transform duration-300 shrink-0 ${isCityMenuOpen ? "rotate-180" : ""}`} />
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
                                        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-surface-900 rounded-t-3xl shadow-[0_-20px_60px_-12px_rgba(0,0,0,0.2)] p-5 pb-8 max-h-[70vh] overflow-y-auto"
                                    >
                                        <div className="w-10 h-1 bg-surface-200 dark:bg-surface-700 rounded-full mx-auto mb-5" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-4">Localisation</div>
                                        <button onClick={handleAutoDetectLocation} disabled={isDetectingLocation} className="w-full flex items-center justify-center gap-3 px-4 py-4 mb-4 rounded-2xl text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border-2 border-dashed border-brand-200 dark:border-brand-500/20 transition-all active:scale-[0.98]">
                                            {isDetectingLocation ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                                            {isDetectingLocation ? "DÉTECTION..." : "UTILISER MA POSITION"}
                                        </button>
                                        <div className="space-y-1.5">
                                            {CITIES.map((city) => (
                                                <button key={city} onClick={() => { updateFilters({ city }); setIsCityMenuOpen(false); }} className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black transition-all ${filters.city === city ? "bg-brand-500 text-white shadow-lg" : "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"}`}>
                                                    {city.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Desktop: dropdown */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }} 
                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                        className="hidden md:block absolute top-full left-0 mt-3 w-64 bg-white dark:bg-surface-900 rounded-3xl shadow-[0_40px_80px_-16px_rgba(0,0,0,0.3)] border border-surface-100 dark:border-white/5 p-3 z-50 overflow-hidden backdrop-blur-xl"
                                    >
                                        <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-2">Localisation</div>
                                        <button onClick={handleAutoDetectLocation} disabled={isDetectingLocation} className="w-full flex items-center gap-3 px-4 py-4 mb-3 rounded-2xl text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border-2 border-dashed border-brand-200 dark:border-brand-500/20 transition-all hover:scale-[1.02]">
                                            {isDetectingLocation ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                                            {isDetectingLocation ? "DÉTECTION..." : "UTILISER MA POSITION"}
                                        </button>
                                        <div className="space-y-1">
                                            {CITIES.map((city) => (
                                                <button key={city} onClick={() => { updateFilters({ city }); setIsCityMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-black transition-all ${filters.city === city ? "bg-brand-500 text-white shadow-xl" : "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"}`}>
                                                    {city.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto shrink-0">
                        <div className="hidden sm:block">
                            <LanguageSelector />
                        </div>
                        <Link
                            href="/stores/cart"
                            className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200 flex items-center justify-center relative shadow-lg md:shadow-xl hover:shadow-brand-500/20 border border-surface-100 dark:border-white/5 transition-all group"
                        >
                            <ShoppingCart size={18} className="md:w-[22px] md:h-[22px] group-hover:rotate-12 transition-transform" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-brand-500 text-white text-[8px] md:text-[10px] font-black rounded-md md:rounded-lg w-5 h-5 md:w-6 md:h-6 flex items-center justify-center shadow-lg md:shadow-xl border-2 border-white dark:border-surface-900 animate-bounce">
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