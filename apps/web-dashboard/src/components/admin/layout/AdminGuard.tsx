"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/providers/AdminProvider";
import { useUserSession } from "@/store/client-store";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { adminRole } = useAdmin();
    const session = useUserSession(state => state.session);
    const router = useRouter();

    useEffect(() => {
        // If session is loaded and user is not an admin, redirect
        if (session && session.role !== "admin") {
            router.push("/dashboard");
        }
        // If no session after initial load, prompt login
        // (Middleware usually handles this, but secondary guard is good)
    }, [session, adminRole, router]);

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-surface-50 dark:bg-surface-950">
                <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-surface-400">Vérification des accès administrateur...</p>
            </div>
        );
    }

    if (session.role !== "admin") {
        return null; // Will redirect
    }

    if (adminRole === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-surface-50 dark:bg-surface-950">
                <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-surface-400">Chargement de votre profil administrateur...</p>
            </div>
        );
    }

    return <>{children}</>;
}
