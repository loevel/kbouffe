"use client";

import { useUserSession } from "@/store/client-store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function UserMenu() {
    const { session, logout } = useUserSession();
    const router = useRouter();
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

    const handleSignOut = async () => {
        logout();
        const supabase = createClient();
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push("/login");
        router.refresh();
    };

    if (!session) return null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={toggleOpen}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-all border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
            >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-900 flex items-center justify-center border border-brand-200 dark:border-brand-800 shadow-sm">
                    {session.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                            src={session.avatarUrl} 
                            alt={session.name || "User"} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <User size={18} className="text-brand-600 dark:text-brand-400" />
                    )}
                </div>
                <div className="hidden lg:flex flex-col items-start min-w-0">
                    <span className="text-sm font-bold text-surface-900 dark:text-white truncate max-w-[120px]">
                        {session.name || session.email.split("@")[0]}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-surface-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 p-2 z-50 overflow-hidden"
                    >
                        <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800 mb-1">
                            <p className="text-xs font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-0.5">
                                Connecté en tant que
                            </p>
                            <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                                {session.email}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Link
                                href="/dashboard/profile"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                            >
                                <User size={18} className="text-surface-400" />
                                Mon Profil
                            </Link>
                            <Link
                                href="/stores/preferences"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                            >
                                <Settings size={18} className="text-surface-400" />
                                Paramètres
                            </Link>

                            <div className="h-px bg-surface-100 dark:bg-surface-800 my-1" />

                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                            >
                                <LogOut size={18} />
                                Se déconnecter
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
