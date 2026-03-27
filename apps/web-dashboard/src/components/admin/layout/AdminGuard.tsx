"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "@/store/client-store";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const session = useUserSession(state => state.session);
    const router = useRouter();

    useEffect(() => {
        // If session is loaded and user is not an admin, redirect
        if (session && session.role !== "admin") {
            router.replace("/dashboard");
        }
        // If no session after initial load, prompt login
        // (Middleware usually handles this, but secondary guard is good)
    }, [session, router]);

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-surface-50 dark:bg-surface-950">
                <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-surface-400">Vérification des accès administrateur...</p>
            </div>
        );
    }

    if (session.role !== "admin") {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-surface-50 dark:bg-surface-950">
                <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-surface-400">Redirection vers votre espace...</p>
            </div>
        );
    }

    return <>{children}</>;
}
