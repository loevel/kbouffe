"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, History, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    { href: "/driver", label: "Livraisons", icon: Package },
    { href: "/driver/history", label: "Historique", icon: History },
];

function DriverNavbar() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        const supabase = createClient();
        if (supabase) {
            await supabase.auth.signOut();
            router.push("/login");
        }
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 safe-area-pb">
            <div className="max-w-lg mx-auto flex items-center">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                                isActive
                                    ? "text-orange-500"
                                    : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                            }`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className={`text-[11px] font-medium ${isActive ? "font-semibold" : ""}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}

                <button
                    onClick={handleLogout}
                    className="flex-1 flex flex-col items-center gap-1 py-3 px-2 text-surface-400 hover:text-red-500 transition-colors"
                >
                    <LogOut size={22} strokeWidth={1.8} />
                    <span className="text-[11px] font-medium">Déconnexion</span>
                </button>
            </div>
        </nav>
    );
}

export function DriverShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pb-20">
            {children}
            <DriverNavbar />
        </div>
    );
}
