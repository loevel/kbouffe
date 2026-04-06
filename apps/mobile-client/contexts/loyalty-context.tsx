import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { 
    getLoyalty, 
    toggleRestaurantFavorite as apiToggleRestaurantFavorite,
    toggleProductFavorite as apiToggleProductFavorite,
    postReferralReward,
    validateCoupon as apiValidateCoupon,
} from '@/lib/api';
import { useAuth } from './auth-context';

export interface PromotionRule {
    code: string;
    kind: 'percent' | 'fixed';
    value: number;
    maxDiscount?: number;
    minOrder?: number;
    expiresAt: string;
    description: string;
}

interface LoyaltyState {
    favoriteRestaurantIds: string[];
    favoriteProductIds: string[];
    referralCode: string;
    referralInvites: number;
    referralRewards: number;
}

interface LoyaltyContextType extends LoyaltyState {
    toggleRestaurantFavorite: (id: string) => void;
    toggleProductFavorite: (id: string) => void;
    isRestaurantFavorite: (id: string) => boolean;
    isProductFavorite: (id: string) => boolean;
    validatePromotion: (params: { code: string; restaurantId: string; orderTotal: number; deliveryType: string }) => Promise<{ valid: true; discount: number } | { valid: false; reason: string }>;
    registerReferralReward: () => void;
}

const INITIAL_STATE: LoyaltyState = {
    favoriteRestaurantIds: [],
    favoriteProductIds: [],
    referralCode: 'KBOUFFE-INVITE',
    referralInvites: 0,
    referralRewards: 0,
};

const LoyaltyContext = createContext<LoyaltyContextType | null>(null);

export function LoyaltyProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [state, setState] = useState<LoyaltyState>(INITIAL_STATE);
    const hydrated = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setState(INITIAL_STATE);
            hydrated.current = true;
            return;
        }

        getLoyalty()
            .then((data) => {
                setState((prev) => ({
                    ...prev,
                    referralCode: data.referral?.code ?? null,
                    referralInvites: data.referral?.invites ?? 0,
                    referralRewards: data.referral?.rewards ?? 0,
                    favoriteRestaurantIds: data.favorites?.restaurants ?? [],
                    favoriteProductIds: data.favorites?.products ?? [],
                }));
            })
            .catch((err) => {
                console.error("Failed to load loyalty data:", err);
            })
            .finally(() => {
                hydrated.current = true;
            });
    }, [isAuthenticated]);

    const toggleRestaurantFavorite = useCallback(async (id: string) => {
        try {
            const res = await apiToggleRestaurantFavorite(id);
            setState((prev) => ({
                ...prev,
                favoriteRestaurantIds: res.active
                    ? [id, ...prev.favoriteRestaurantIds]
                    : prev.favoriteRestaurantIds.filter((value) => value !== id),
            }));
        } catch (error) {
            console.error('Failed to toggle restaurant favorite:', error);
        }
    }, []);

    const toggleProductFavorite = useCallback(async (id: string) => {
        try {
            const res = await apiToggleProductFavorite(id);
            setState((prev) => ({
                ...prev,
                favoriteProductIds: res.active
                    ? [id, ...prev.favoriteProductIds]
                    : prev.favoriteProductIds.filter((value) => value !== id),
            }));
        } catch (error) {
            console.error('Failed to toggle product favorite:', error);
        }
    }, []);

    const isRestaurantFavorite = useCallback((id: string) => state.favoriteRestaurantIds.includes(id), [state.favoriteRestaurantIds]);
    const isProductFavorite = useCallback((id: string) => state.favoriteProductIds.includes(id), [state.favoriteProductIds]);

    const validatePromotion = useCallback(async (params: { 
        code: string; 
        restaurantId: string; 
        orderTotal: number; 
        deliveryType: string 
    }) => {
        const normalized = params.code.trim().toUpperCase();
        
        try {
            const res = await apiValidateCoupon({
                code:         normalized,
                restaurantId: params.restaurantId,
                orderTotal:   params.orderTotal,
                deliveryType: params.deliveryType,
                customerId:   user?.id ?? null,
            });
            
            return { valid: true as const, discount: res.discount };
        } catch (error: any) {
            return { valid: false as const, reason: error.message || 'Code invalide' };
        }
    }, [user?.id]);




    const registerReferralReward = useCallback(async () => {
        const REFERRAL_REWARD_XAF = 500; // montant fixé côté serveur
        try {
            const res = await postReferralReward();
            if (res.success) {
                setState((prev) => ({
                    ...prev,
                    referralInvites: prev.referralInvites + 1,
                    referralRewards: prev.referralRewards + REFERRAL_REWARD_XAF,
                }));
            }
        } catch (error) {
            console.error('Failed to register referral reward:', error);
        }
    }, []);

    const value = useMemo<LoyaltyContextType>(() => ({
        ...state,
        toggleRestaurantFavorite,
        toggleProductFavorite,
        isRestaurantFavorite,
        isProductFavorite,
        validatePromotion,
        registerReferralReward,
    }), [
        state,
        toggleRestaurantFavorite,
        toggleProductFavorite,
        isRestaurantFavorite,
        isProductFavorite,
        validatePromotion,
        registerReferralReward,
    ]);

    return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
}

export function useLoyalty() {
    const ctx = useContext(LoyaltyContext);
    if (!ctx) throw new Error('useLoyalty must be used within LoyaltyProvider');
    return ctx;
}
