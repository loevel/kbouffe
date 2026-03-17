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
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User, Restaurant, Tables } from "@/lib/supabase/types";
import { MOCK_USER, MOCK_RESTAURANT } from "@/lib/mock-data";
import { hasPermission as checkPermission, type TeamRole, type Permission } from "@/lib/permissions";

type RestaurantUpdate = Tables["restaurants"]["Update"];

function mapRestaurantUpdateForApi(data: RestaurantUpdate): Record<string, unknown> {
    const mapped: Record<string, unknown> = { ...data };

    if (data.has_dine_in !== undefined) mapped.hasDineIn = data.has_dine_in;
    if (data.has_reservations !== undefined) mapped.hasReservations = data.has_reservations;
    if (data.corkage_fee_amount !== undefined) mapped.corkageFeeAmount = data.corkage_fee_amount;
    if (data.dine_in_service_fee !== undefined) mapped.dineInServiceFee = data.dine_in_service_fee;
    if (data.total_tables !== undefined) mapped.totalTables = data.total_tables;
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
    if (data.payment_methods !== undefined) mapped.paymentMethods = data.payment_methods;
    if (data.payment_credentials !== undefined) mapped.paymentCredentials = data.payment_credentials;
    if (data.sms_notifications_enabled !== undefined) mapped.smsNotificationsEnabled = data.sms_notifications_enabled;
    if (data.notification_channels !== undefined) mapped.notificationChannels = data.notification_channels;
    if (data.delivery_zones !== undefined) mapped.deliveryZones = data.delivery_zones;
    if (data.postal_code !== undefined) mapped.postalCode = data.postal_code;
    if (data.cuisine_type !== undefined) mapped.cuisineType = data.cuisine_type;
    if (data.price_range !== undefined) mapped.priceRange = data.price_range;
    if (data.delivery_base_fee !== undefined) mapped.deliveryBaseFee = data.delivery_base_fee;
    if (data.delivery_per_km_fee !== undefined) mapped.deliveryPerKmFee = data.delivery_per_km_fee;
    if (data.max_delivery_radius_km !== undefined) mapped.maxDeliveryRadiusKm = data.max_delivery_radius_km;

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
            // Fallback mock data si Supabase n'est pas configuré
            setUser(MOCK_USER);
            setRestaurant(MOCK_RESTAURANT);
            setTeamRole("owner");
            setActiveModules(["hr", "reservations", "marketing"]);
            setLoading(false);
            return;
        }

        const supabase = createClient();
        if (!supabase) {
            setUser(MOCK_USER);
            setRestaurant(MOCK_RESTAURANT);
            setTeamRole("owner");
            setActiveModules(["hr", "reservations", "marketing"]);
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

            // Fetch user profile from Supabase
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
                setTeamRole("owner");
                // Active modules by default for Supabase
                setActiveModules(["hr", "reservations", "marketing"]);
            } else {
                // C'est potentiellement un membre de l'équipe
                const { data: member } = await supabase
                    .from("restaurant_members")
                    .select("*, restaurant:restaurants(*)")
                    .eq("user_id", authUser.id)
                    .eq("status", "active")
                    .single();
                    
                if (member && (member as any).restaurant) {
                    setRestaurant((member as any).restaurant);
                    setTeamRole((member as any).role as TeamRole);
                    setActiveModules(["hr", "reservations", "marketing"]);
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
    }, [user]);

    const updateRestaurant = useCallback(
        async (data: RestaurantUpdate): Promise<{ error: string | null }> => {
            if (!restaurant) return { error: "Aucun restaurant trouvé" };

            // Optimistic update
            const previousRestaurant = restaurant;
            setRestaurant((prev) => (prev ? { ...prev, ...data } : prev));

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
