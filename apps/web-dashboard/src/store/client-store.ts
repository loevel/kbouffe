import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Types de base pour le store client
export interface UserSession {
    id: string;
    email: string;
    role: "client" | "customer" | "admin" | "merchant" | "livreur";
    adminRole?: string;
    name?: string;
    phone?: string;
    avatarUrl?: string;
    isVerified: boolean;
    subscriptionStatus?: "active" | "inactive" | "trial";
    preferences?: UserPreferences;
}

export interface DeliveryAddress {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
    deliveryInstructions?: string;
}

export interface CartItem {
    id: string;
    restaurantId: string;
    restaurantName: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    variants?: Record<string, string>;
    imageUrl?: string;
    specialInstructions?: string;
}

export interface CartState {
    items: CartItem[];
    restaurantId?: string;
    promoCode?: string;
    promoDiscount: number;
    deliveryFee: number;
    serviceFee: number;
    subtotal: number;
    total: number;
}

export interface UserPreferences {
    language: "fr" | "en" | string;
    currency: "FCFA" | "XAF" | string;
    defaultDeliveryMode: "delivery" | "pickup" | "reservation";
    dietaryRestrictions: string[];
    allergies: string[];
    favoriteRestaurants: string[];
    notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
        orderUpdates: boolean;
        promotions: boolean;
        newRestaurants?: boolean;
    };
    theme: "light" | "dark" | "system";
}

export interface SearchFilters {
    query: string;
    cuisineTypes: string[];
    priceRange: [number, number];
    rating: number;
    deliveryTime: number;
    sortBy: "recommended" | "rating" | "orders" | "newest";
    onlyOpen: boolean;
    hasPromo: boolean;
    deliveryMode: "delivery" | "pickup" | "reservation";
    city: string;
}

// Store de session utilisateur
interface UserSessionStore {
    session: UserSession | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setSession: (session: UserSession | null) => void;
    updateProfile: (updates: Partial<UserSession>) => void;
    logout: () => void;
}

export const useUserSession = create<UserSessionStore>()(
    subscribeWithSelector(
        persist(
            immer((set) => ({
                session: null,
                isAuthenticated: false,
                isLoading: false,

                setSession: (session) =>
                    set((state) => {
                        state.session = session;
                        state.isAuthenticated = !!session;
                    }),

                updateProfile: (updates) =>
                    set((state) => {
                        if (state.session) {
                            Object.assign(state.session, updates);
                        }
                    }),

                logout: () =>
                    set((state) => {
                        state.session = null;
                        state.isAuthenticated = false;
                    }),
            })),
            { name: "user-session" }
        )
    )
);

// Store du panier
interface CartStore extends CartState {
    addItem: (item: Omit<CartItem, "id">) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateSpecialInstructions: (itemId: string, instructions: string) => void;
    applyPromoCode: (code: string, discount: number) => void;
    removePromoCode: () => void;
    clearCart: () => void;
    calculateTotals: () => void;
}

export const useCartStore = create<CartStore>()(
    subscribeWithSelector(
        persist(
            immer((set, get) => ({
                items: [],
                restaurantId: undefined,
                promoCode: undefined,
                promoDiscount: 0,
                deliveryFee: 0,
                serviceFee: 0,
                subtotal: 0,
                total: 0,

                addItem: (newItem) =>
                    set((state) => {
                        // Si c'est un nouveau restaurant, vider le panier
                        if (state.restaurantId && state.restaurantId !== newItem.restaurantId) {
                            state.items = [];
                        }
                        state.restaurantId = newItem.restaurantId;

                        // Chercher si l'item existe déjà
                        const existingItemIndex = state.items.findIndex(
                            (item: CartItem) =>
                                item.name === newItem.name &&
                                JSON.stringify(item.variants) === JSON.stringify(newItem.variants)
                        );

                        if (existingItemIndex >= 0) {
                            state.items[existingItemIndex].quantity += newItem.quantity;
                        } else {
                            state.items.push({
                                ...newItem,
                                id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            });
                        }
                        get().calculateTotals();
                    }),

                removeItem: (itemId) =>
                    set((state) => {
                        state.items = state.items.filter((item: CartItem) => item.id !== itemId);
                        if (state.items.length === 0) {
                            state.restaurantId = undefined;
                        }
                        get().calculateTotals();
                    }),

                updateQuantity: (itemId, quantity) =>
                    set((state) => {
                        if (quantity <= 0) {
                            state.items = state.items.filter((item: CartItem) => item.id !== itemId);
                            if (state.items.length === 0) {
                                state.restaurantId = undefined;
                            }
                        } else {
                            const item = state.items.find((item: CartItem) => item.id === itemId);
                            if (item) {
                                item.quantity = quantity;
                            }
                        }
                        get().calculateTotals();
                    }),

                updateSpecialInstructions: (itemId, instructions) =>
                    set((state) => {
                        const item = state.items.find((item: CartItem) => item.id === itemId);
                        if (item) {
                            item.specialInstructions = instructions;
                        }
                    }),

                applyPromoCode: (code, discount) =>
                    set((state) => {
                        state.promoCode = code;
                        state.promoDiscount = discount;
                        get().calculateTotals();
                    }),

                removePromoCode: () =>
                    set((state) => {
                        state.promoCode = undefined;
                        state.promoDiscount = 0;
                        get().calculateTotals();
                    }),

                clearCart: () =>
                    set((state) => {
                        state.items = [];
                        state.restaurantId = undefined;
                        state.promoCode = undefined;
                        state.promoDiscount = 0;
                        state.subtotal = 0;
                        state.total = 0;
                    }),

                calculateTotals: () =>
                    set((state) => {
                        const subtotal = state.items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
                        state.subtotal = subtotal;

                        // Frais de livraison basiques (à calculer depuis l'API plus tard)
                        state.deliveryFee = subtotal > 5000 ? 0 : 1500;
                        state.serviceFee = Math.floor(subtotal * 0.05);

                        let total = subtotal + state.deliveryFee + state.serviceFee;
                        if (state.promoDiscount > 0) {
                            total = Math.max(0, total - state.promoDiscount);
                        }
                        state.total = total;
                    }),
            })),
            { name: "cart-store" }
        )
    )
);

// Store des préférences utilisateur
interface PreferencesStore {
    preferences: UserPreferences;
    addresses: DeliveryAddress[];
    lastUsedAddress?: DeliveryAddress;
    updatePreferences: (updates: Partial<UserPreferences>) => void;
    setAddresses: (addresses: DeliveryAddress[]) => void;
    addAddress: (address: Omit<DeliveryAddress, "id">) => void;
    updateAddress: (id: string, updates: Partial<DeliveryAddress>) => void;
    removeAddress: (id: string) => void;
    setDefaultAddress: (id: string) => void;
    setLastUsedAddress: (address: DeliveryAddress) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
    persist(
        immer((set) => ({
            preferences: {
                language: "fr",
                currency: "FCFA",
                defaultDeliveryMode: "delivery",
                dietaryRestrictions: [],
                allergies: [],
                favoriteRestaurants: [],
                notifications: {
                    push: true,
                    orderUpdates: true,
                    promotions: true,
                    newRestaurants: false,
                    email: true,
                    sms: true,
                },
                theme: "system",
            },
            addresses: [],
            lastUsedAddress: undefined,

            updatePreferences: (updates) =>
                set((state) => {
                    Object.assign(state.preferences, updates);
                }),

            setAddresses: (addresses) =>
                set((state) => {
                    state.addresses = addresses;
                }),

            addAddress: (newAddress) =>
                set((state) => {
                    const address: DeliveryAddress = {
                        ...newAddress,
                        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    };

                    // Si c'est la première adresse, la marquer par défaut
                    if (state.addresses.length === 0) {
                        address.isDefault = true;
                    } else if (address.isDefault) {
                        // Retirer le statut par défaut des autres adresses
                        state.addresses.forEach((addr: DeliveryAddress) => {
                            addr.isDefault = false;
                        });
                    }

                    state.addresses.push(address);
                }),

            updateAddress: (id, updates) =>
                set((state) => {
                    const addressIndex = state.addresses.findIndex((addr: DeliveryAddress) => addr.id === id);
                    if (addressIndex >= 0) {
                        Object.assign(state.addresses[addressIndex], updates);

                        // Si on marque cette adresse par défaut, retirer le statut des autres
                        if (updates.isDefault) {
                            state.addresses.forEach((addr: DeliveryAddress, index: number) => {
                                if (index !== addressIndex) {
                                    addr.isDefault = false;
                                }
                            });
                        }
                    }
                }),

            removeAddress: (id) =>
                set((state) => {
                    const addressIndex = state.addresses.findIndex((addr: DeliveryAddress) => addr.id === id);
                    if (addressIndex >= 0) {
                        const wasDefault = state.addresses[addressIndex].isDefault;
                        state.addresses.splice(addressIndex, 1);

                        // Si on supprime l'adresse par défaut, marquer la première restante
                        if (wasDefault && state.addresses.length > 0) {
                            state.addresses[0].isDefault = true;
                        }
                    }
                }),

            setDefaultAddress: (id) =>
                set((state) => {
                    state.addresses.forEach((addr: DeliveryAddress) => {
                        addr.isDefault = addr.id === id;
                    });
                }),

            setLastUsedAddress: (address) =>
                set((state) => {
                    state.lastUsedAddress = address;
                }),
        })),
        { name: "preferences-store" }
    )
);

// Store des filtres de recherche
interface SearchStore {
    filters: SearchFilters;
    recentSearches: string[];
    updateFilters: (updates: Partial<SearchFilters>) => void;
    resetFilters: () => void;
    addRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchStore>()(
    persist(
        immer((set) => ({
            filters: {
                query: "",
                cuisineTypes: [],
                priceRange: [0, 50000],
                rating: 0,
                deliveryTime: 60,
                sortBy: "recommended",
                onlyOpen: true,
                hasPromo: false,
                deliveryMode: "delivery",
                city: "Douala",
            },
            recentSearches: [],

            updateFilters: (updates) =>
                set((state) => {
                    Object.assign(state.filters, updates);
                }),

            resetFilters: () =>
                set((state) => {
                    state.filters = {
                        query: "",
                        cuisineTypes: [],
                        priceRange: [0, 50000],
                        rating: 0,
                        deliveryTime: 60,
                        sortBy: "recommended",
                        onlyOpen: true,
                        hasPromo: false,
                        deliveryMode: "delivery",
                        city: "Douala",
                    };
                }),

            addRecentSearch: (query) =>
                set((state) => {
                    if (query.trim() && !state.recentSearches.includes(query.trim())) {
                        state.recentSearches.unshift(query.trim());
                        // Garder seulement les 10 recherches les plus récentes
                        state.recentSearches = state.recentSearches.slice(0, 10);
                    }
                }),

            clearRecentSearches: () =>
                set((state) => {
                    state.recentSearches = [];
                }),
        })),
        { name: "search-store" }
    )
);

// Hook utilitaire pour les données panier calculées
export const useCartTotals = () => {
    const { items, subtotal, deliveryFee, serviceFee, promoDiscount, total } = useCartStore();
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
        itemCount,
        subtotal,
        deliveryFee,
        serviceFee,
        promoDiscount,
        total,
        isEmpty: items.length === 0,
        hasMultipleItems: items.length > 1,
    };
};

// Hook pour adresses avec logique métier
export const useAddresses = () => {
    const { addresses, lastUsedAddress } = usePreferencesStore();
    const defaultAddress = addresses.find((addr) => addr.isDefault);
    const deliveryAddress = lastUsedAddress || defaultAddress || addresses[0];

    return {
        addresses,
        defaultAddress,
        deliveryAddress,
        hasAddresses: addresses.length > 0,
    };
};

// ── Store commandes récentes (client) ─────────────────────────────────────────
export interface RecentOrder {
    id: string;
    restaurantId: string;
    restaurantName: string;
    restaurantSlug: string;
    total: number;
    itemCount: number;
    status: "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
    deliveryType: "delivery" | "pickup" | "dine_in";
    createdAt: string; // ISO
}

interface RecentOrdersStore {
    orders: RecentOrder[];
    addOrder: (order: RecentOrder) => void;
    updateOrderStatus: (id: string, status: RecentOrder["status"]) => void;
    removeOrder: (id: string) => void;
    clearAll: () => void;
}

export const useRecentOrders = create<RecentOrdersStore>()(
    persist(
        (set) => ({
            orders: [],

            addOrder: (order) =>
                set((state) => {
                    // Déduplique par id, met en tête du tableau
                    const existing = state.orders.filter((o) => o.id !== order.id);
                    return { orders: [order, ...existing].slice(0, 20) };
                }),

            updateOrderStatus: (id, status) =>
                set((state) => ({
                    orders: state.orders.map((o) =>
                        o.id === id ? { ...o, status } : o,
                    ),
                })),

            removeOrder: (id) =>
                set((state) => ({
                    orders: state.orders.filter((o) => o.id !== id),
                })),

            clearAll: () => set({ orders: [] }),
        }),
        { name: "recent-orders" }
    )
);