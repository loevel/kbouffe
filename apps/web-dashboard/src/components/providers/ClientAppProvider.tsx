"use client";

import { useEffect } from "react";
import { useUserSession, useCartStore } from "@/store/client-store";
import { initializeAnalytics, createInternalProvider } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

interface ClientAppProviderProps {
    children: React.ReactNode;
}

export function ClientAppProvider({ children }: ClientAppProviderProps) {
    const { setSession, isAuthenticated } = useUserSession();
    const { calculateTotals } = useCartStore();

    useEffect(() => {
        // Initialiser l'analytics
        const analytics = initializeAnalytics({
            providers: [createInternalProvider()],
            enableDebug: process.env.NODE_ENV === "development",
        });

        // Initialiser la session Supabase
        const supabase = createClient();

        const initializeAuth = async () => {
            if (!supabase) return;

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setSession({
                        id: session.user.id,
                        email: session.user.email || "",
                        role: (session.user.user_metadata?.role || "client") as any,
                        adminRole: session.user.user_metadata?.admin_role,
                        name: session.user.user_metadata?.name,
                        phone: session.user.user_metadata?.phone,
                        avatarUrl: session.user.user_metadata?.avatar_url,
                        isVerified: !!session.user.email_confirmed_at,
                        subscriptionStatus: session.user.user_metadata?.subscription_status as "active" | "inactive" | "trial",
                    });

                    // Identifier l'utilisateur pour l'analytics
                    analytics?.identify(session.user.id, {
                        email: session.user.email,
                        role: session.user.user_metadata?.role || "client",
                        name: session.user.user_metadata?.name,
                    });
                } else {
                    setSession(null);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setSession(null);
            }
        };

        initializeAuth();

        // Écouter les changements de session
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
                setSession({
                    id: session.user.id,
                    email: session.user.email || "",
                    role: (session.user.user_metadata?.role || "client") as any,
                    adminRole: session.user.user_metadata?.admin_role,
                    name: session.user.user_metadata?.name,
                    phone: session.user.user_metadata?.phone,
                    avatarUrl: session.user.user_metadata?.avatar_url,
                    isVerified: !!session.user.email_confirmed_at,
                    subscriptionStatus: session.user.user_metadata?.subscription_status as "active" | "inactive" | "trial",
                });

                analytics?.identify(session.user.id, {
                    email: session.user.email,
                    role: session.user.user_metadata?.role || "client",
                });
            } else if (event === "SIGNED_OUT") {
                setSession(null);
            }
        });

        return () => {
            subscription.unsubscribe();
            analytics?.destroy();
        };
    }, [setSession]);

    // Recalculer les totaux du panier au montage pour synchroniser l'état
    useEffect(() => {
        calculateTotals();
    }, [calculateTotals]);

    // Tracker les page views
    useEffect(() => {
        const analytics = initializeAnalytics();
        if (typeof window !== "undefined") {
            analytics?.page(window.location.pathname, {
                title: document.title,
                referrer: document.referrer,
            });
        }
    }, []);

    return <>{children}</>;
}

// Hook pour accéder aux données analytics facilement
export function useClientTracking() {
    const session = useUserSession((state) => state.session);
    const isAuthenticated = useUserSession((state) => state.isAuthenticated);

    return {
        trackEvent: (event: any) => {
            const analytics = initializeAnalytics();
            analytics?.track({
                ...event,
                userId: session?.id,
                userRole: session?.role,
            });
        },
        identify: (traits?: Record<string, any>) => {
            if (session) {
                const analytics = initializeAnalytics();
                analytics?.identify(session.id, {
                    email: session.email,
                    role: session.role,
                    ...traits,
                });
            }
        },
        isAuthenticated,
        session,
    };
}