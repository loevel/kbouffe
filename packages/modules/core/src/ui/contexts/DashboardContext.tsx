"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../lib/supabase-client";
import type { Restaurant, Tables } from "../lib/supabase-types";
import { hasPermission as checkPermission, type TeamRole, type Permission } from "../lib/permissions";

// Re-define User to match API response which may include extra roles
type User = {
    id: string;
    email: string | null;
    phone: string | null;
    full_name: string;
    role: string; // Widened from UserRole to string to allow "admin", "support"
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

type RestaurantUpdate = Tables["restaurants"]["Update"];

function mapRestaurantUpdateForApi(data: RestaurantUpdate): Record<string, unknown> {
    const mapped: Record<string, unknown> = { ...data };

    if (data.has_dine_in !== undefined) mapped.hasDineIn = data.has_dine_in;
    if (data.has_reservations !== undefined) mapped.hasReservations = data.has_reservations;
    if (data.corkage_fee_amount !== undefined) mapped.corkageFeeAmount = data.corkage_fee_amount;
    if (data.dine_in_service_fee !== undefined) mapped.dineInServiceFee = data.dine_in_service_fee;
    if (data.total_tables !== undefined) mapped.totalTables = data.total_tables;
    if ((data as any).reservation_slot_duration !== undefined) mapped.reservationSlotDuration = (data as any).reservation_slot_duration;
    if ((data as any).reservation_open_time !== undefined) mapped.reservationOpenTime = (data as any).reservation_open_time;
    if ((data as any).reservation_close_time !== undefined) mapped.reservationCloseTime = (data as any).reservation_close_time;
    if ((data as any).reservation_slot_interval !== undefined) mapped.reservationSlotInterval = (data as any).reservation_slot_interval;
    if (data.reservation_cancel_policy !== undefined) mapped.reservationCancelPolicy = data.reservation_cancel_policy;
    if (data.reservation_cancel_notice_minutes !== undefined) mapped.reservationCancelNoticeMinutes = data.reservation_cancel_notice_minutes;
    if (data.reservation_cancellation_fee_amount !== undefined) mapped.reservationCancellationFeeAmount = data.reservation_cancellation_fee_amount;
    if (data.order_cancel_policy !== undefined) mapped.orderCancelPolicy = data.order_cancel_policy;
    if (data.order_cancel_notice_minutes !== undefined) mapped.orderCancelNoticeMinutes = data.order_cancel_notice_minutes;
    if (data.order_cancellation_fee_amount !== undefined) mapped.orderCancellationFeeAmount = data.order_cancellation_fee_amount;
    if (data.logo_url !== undefined) mapped.logoUrl = data.logo_url;
    if (data.banner_url !== undefined) mapped.coverUrl = data.banner_url;
    if (data.min_order_amount !== undefined) mapped.minOrderAmount = data.min_order_amount;
    if (data.opening_hours !== undefined) mapped.openingHours = data.opening_hours;
    if (data.is_published !== undefined) mapped.isActive = data.is_published;
    if ((data as any).cuisine_type !== undefined) mapped.cuisineType = (data as any).cuisine_type;
    if ((data as any).price_range !== undefined) mapped.priceRange = (data as any).price_range;

    return mapped;
}

interface DashboardContextValue {
    user: User | null;
    restaurant: Restaurant | null;
    loading: boolean;
    /** Rôle de l'utilisateur dans l'équipe du restaurant */
    teamRole: TeamRole;
    /** Vérifie si l'utilisateur a une permission donnée */
    can: (permission: Permission) => boolean;
    /** Liste des ID de modules activés pour ce restaurant */
    activeModules: string[];
    /** Vérifie si un module spécifique est activé */
    hasModule: (moduleId: string) => boolean;
    /** Recharge les données du restaurant depuis Supabase */
    refreshRestaurant: () => Promise<void>;
    /** Met à jour le restaurant localement (optimistic update) et en DB */
    updateRestaurant: (data: RestaurantUpdate) => Promise<{ error: string | null }>;
    /** Déconnexion */
    signOut: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue>({
    user: null,
    restaurant: null,
    loading: true,
    teamRole: "owner",
    can: () => true,
    activeModules: [],
    hasModule: () => true,
    refreshRestaurant: async () => { },
    updateRestaurant: async () => ({ error: null }),
    signOut: async () => { },
});

export function useDashboard() {
    return useContext(DashboardContext);
}

export function DashboardProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [teamRole, setTeamRole] = useState<TeamRole>("owner");
    const [activeModules, setActiveModules] = useState<string[]>([]);

    const can = useCallback(
        (permission: Permission) => checkPermission(teamRole, permission),
        [teamRole]
    );

    const hasModule = useCallback(
        (moduleId: string) => activeModules.includes(moduleId),
        [activeModules]
    );

    const fetchData = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            // Supabase not configured: leave user/restaurant null (dev-only path)
            setLoading(false);
            return;
        }

        const supabase = createClient();
        if (!supabase) {
            setLoading(false);
            return;
        }

        try {
            // Récupérer la session
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                setLoading(false);
                return;
            }

            // Essayer de récupérer les données depuis Cloudflare D1
            try {
                const response = await fetch("/api/sync-user");
                const data = await response.json() as any;

                if (response.ok && data.user) {
                    setUser(data.user);
                    if (data.restaurant) {
                        setRestaurant(data.restaurant);
                    }
                    if (data.teamRole) {
                        setTeamRole(data.teamRole as TeamRole);
                    }
                    if (data.activeModules) {
                        setActiveModules(data.activeModules);
                    }
                    setLoading(false);
                    return;
                }

                // Si l'utilisateur n'existe pas dans D1, le synchroniser
                if (data.needsSync) {
                    const syncResponse = await fetch("/api/sync-user", {
                        method: "POST",
                    });
                    const syncData = await syncResponse.json() as any;

                    if (syncResponse.ok && syncData.user) {
                        setUser(syncData.user);
                        // Récupérer le restaurant si créé
                        if (syncData.restaurantId) {
                            const restaurantResponse = await fetch("/api/sync-user");
                            const restaurantData = await restaurantResponse.json() as any;
                            if (restaurantData.restaurant) {
                                setRestaurant(restaurantData.restaurant);
                            }
                            if (restaurantData.teamRole) {
                                setTeamRole(restaurantData.teamRole as TeamRole);
                            }
                        }
                    }
                }
            } catch (d1Error) {
                console.warn("D1 non disponible, fallback Supabase:", d1Error);
                // Fallback vers Supabase si D1 n'est pas disponible (dev local)
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();

                if (profile) {
                    setUser(profile);
                }

                const { data: resto } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("owner_id", authUser.id)
                    .single();

                if (resto) {
                    setRestaurant(resto);
                }
            }
        } catch (err) {
            console.error("Erreur lors du chargement des données dashboard:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refreshRestaurant = useCallback(async () => {
        if (!user) return;

        try {
            // Essayer D1 d'abord
            const response = await fetch("/api/sync-user");
            const data = await response.json() as any;

            if (response.ok && data.restaurant) {
                setRestaurant(data.restaurant);
                return;
            }
        } catch {
            // Fallback Supabase
            if (!isSupabaseConfigured()) return;

            const supabase = createClient();
            if (!supabase) return;

            const { data: resto } = await supabase
                .from("restaurants")
                .select("*")
                .eq("owner_id", user.id)
                .single();

            if (resto) {
                setRestaurant(resto);
            }
        }
    }, [user]);

    const updateRestaurant = useCallback(
        async (data: RestaurantUpdate): Promise<{ error: string | null }> => {
            if (!restaurant) return { error: "Aucun restaurant trouvé" };

            // Optimistic update
            const previousRestaurant = restaurant;
            setRestaurant((prev) => (prev ? { ...prev, ...data } : prev));

            try {
                // Essayer D1 d'abord
                const response = await fetch("/api/restaurant", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(mapRestaurantUpdateForApi(data)),
                });

                if (response.ok) {
                    const result = await response.json() as any;
                    if (result.restaurant) {
                        setRestaurant(result.restaurant);
                    }
                    return { error: null };
                }

                const errorData = await response.json() as any;
                throw new Error(errorData.error || "Erreur de mise à jour");
            } catch (d1Error) {
                // Fallback Supabase
                if (!isSupabaseConfigured()) {
                    // En mode mock, pas de rollback
                    return { error: null };
                }

                const supabase = createClient();
                if (!supabase) {
                    setRestaurant(previousRestaurant);
                    return { error: "Impossible de se connecter" };
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await (supabase as any)
                    .from("restaurants")
                    .update(data)
                    .eq("id", restaurant.id);

                if (error) {
                    setRestaurant(previousRestaurant);
                    return { error: error.message };
                }

                return { error: null };
            }
        },
        [restaurant]
    );

    const signOut = useCallback(async () => {
        if (isSupabaseConfigured()) {
            const supabase = createClient();
            if (supabase) {
                await supabase.auth.signOut();
            }
        }
        setUser(null);
        setRestaurant(null);
        router.push("/login");
    }, [router]);

    return (
        <DashboardContext.Provider
            value={{
                user,
                restaurant,
                loading,
                teamRole,
                can,
                activeModules,
                hasModule,
                refreshRestaurant,
                updateRestaurant,
                signOut,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}
