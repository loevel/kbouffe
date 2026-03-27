import {
    ApiResponse,
    PaginatedResponse,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    RestaurantSearchRequest,
    RestaurantSearchResponse,
    Restaurant,
    RestaurantMenu,
    CartValidationRequest,
    CartValidationResponse,
    CreateOrderRequest,
    Order,
    CreateAddressRequest,
    UpdateAddressRequest,
    DeliveryAddress,
    CreatePaymentMethodRequest,
    PaymentMethod,
    FavoriteRestaurant,
    FavoriteItem,
    ValidatePromoRequest,
    ValidatePromoResponse,
    Promotion,
    WalletBalance,
    WalletTransaction,
    TopUpWalletRequest,
    CreateSupportTicketRequest,
    SupportTicket,
    NotificationPreferences,
    UpdateNotificationPreferencesRequest,
} from "./types";

// Configuration du client API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const API_VERSION = "v1";

// Utilitaire pour construire les URLs d'API
const buildApiUrl = (endpoint: string) => `${API_BASE_URL}/${API_VERSION}${endpoint}`;

// Utilitaire pour les requêtes HTTP avec gestion d'erreurs
async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit & {
        params?: Record<string, any>;
    } = {}
): Promise<ApiResponse<T>> {
    const url = new URL(buildApiUrl(endpoint), window.location.origin);
    
    // Ajouter les paramètres de query
    if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => url.searchParams.append(key, String(v)));
                } else {
                    url.searchParams.set(key, String(value));
                }
            }
        });
    }

    // Configuration par défaut
    const config: RequestInit = {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        credentials: "include",
        ...options,
    };

    // Ne pas ajouter Content-Type pour FormData
    if (options.body instanceof FormData) {
        delete (config.headers as Record<string, string>)["Content-Type"];
    }

    try {
        const response = await fetch(url.toString(), config);
        
        if (!response.ok) {
            // Tenter de parser la réponse d'erreur
            try {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.error || {
                        code: "HTTP_ERROR",
                        message: `HTTP ${response.status}: ${response.statusText}`,
                    },
                };
            } catch {
                return {
                    success: false,
                    error: {
                        code: "HTTP_ERROR",
                        message: `HTTP ${response.status}: ${response.statusText}`,
                    },
                };
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: error instanceof Error ? error.message : "Network request failed",
            },
        };
    }
}

// Client API pour l'authentification
export const authApi = {
    login: (data: LoginRequest) =>
        apiRequest<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    register: (data: RegisterRequest) =>
        apiRequest<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    logout: () =>
        apiRequest("/auth/logout", {
            method: "POST",
        }),

    refreshToken: () =>
        apiRequest<AuthResponse>("/auth/refresh", {
            method: "POST",
        }),

    getCurrentUser: () =>
        apiRequest<AuthResponse["user"]>("/auth/me"),

    updateProfile: (data: UpdateProfileRequest) =>
        apiRequest<AuthResponse["user"]>("/auth/profile", {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    changePassword: (data: ChangePasswordRequest) =>
        apiRequest("/auth/change-password", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    requestPasswordReset: (email: string) =>
        apiRequest("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    verifyEmail: (token: string) =>
        apiRequest("/auth/verify-email", {
            method: "POST",
            body: JSON.stringify({ token }),
        }),
};

// Client API pour les restaurants
export const restaurantApi = {
    search: (params: RestaurantSearchRequest) =>
        apiRequest<RestaurantSearchResponse>("/restaurants/search", {
            params,
        }),

    getById: (id: string) =>
        apiRequest<Restaurant>(`/restaurants/${id}`),

    getBySlug: (slug: string) =>
        apiRequest<Restaurant>(`/restaurants/slug/${slug}`),

    getMenu: (restaurantId: string) =>
        apiRequest<RestaurantMenu>(`/restaurants/${restaurantId}/menu`),

    getCuisineTypes: () =>
        apiRequest<string[]>("/restaurants/cuisine-types"),

    getFeatured: (limit: number = 8) =>
        apiRequest<Restaurant[]>("/restaurants/featured", {
            params: { limit },
        }),

    getNearby: (coordinates: { lat: number; lng: number }, radius: number = 5000) =>
        apiRequest<Restaurant[]>("/restaurants/nearby", {
            params: { lat: coordinates.lat, lng: coordinates.lng, radius },
        }),
};

// Client API pour les commandes
export const orderApi = {
    validateCart: (data: CartValidationRequest) =>
        apiRequest<CartValidationResponse>("/orders/validate-cart", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    create: (data: CreateOrderRequest) =>
        apiRequest<Order>("/orders", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getById: (id: string) =>
        apiRequest<Order>(`/orders/${id}`),

    getMyOrders: (params: { page?: number; limit?: number; status?: string } = {}) =>
        apiRequest<PaginatedResponse<Order>>("/orders/my-orders", {
            params,
        }),

    cancelOrder: (id: string, reason?: string) =>
        apiRequest(`/orders/${id}/cancel`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        }),

    reorder: (id: string) =>
        apiRequest<CartValidationResponse>(`/orders/${id}/reorder`, {
            method: "POST",
        }),

    trackOrder: (id: string) =>
        apiRequest<{
            order: Order;
            liveTracking?: {
                courierLocation?: { lat: number; lng: number };
                estimatedArrival?: string;
                courierPhone?: string;
            };
        }>(`/orders/${id}/track`),
};

// Client API pour les adresses
export const addressApi = {
    getAll: () =>
        apiRequest<DeliveryAddress[]>("/addresses"),

    create: (data: CreateAddressRequest) =>
        apiRequest<DeliveryAddress>("/addresses", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateAddressRequest) =>
        apiRequest<DeliveryAddress>(`/addresses/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiRequest(`/addresses/${id}`, {
            method: "DELETE",
        }),

    setDefault: (id: string) =>
        apiRequest(`/addresses/${id}/set-default`, {
            method: "POST",
        }),

    validateDelivery: (addressId: string, restaurantId: string) =>
        apiRequest<{
            isValid: boolean;
            deliveryFee: number;
            estimatedTime: number;
            message?: string;
        }>("/addresses/validate-delivery", {
            method: "POST",
            body: JSON.stringify({ addressId, restaurantId }),
        }),
};

// Client API pour les moyens de paiement
export const paymentApi = {
    getMethods: () =>
        apiRequest<PaymentMethod[]>("/payment-methods"),

    create: (data: CreatePaymentMethodRequest) =>
        apiRequest<PaymentMethod>("/payment-methods", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiRequest(`/payment-methods/${id}`, {
            method: "DELETE",
        }),

    setDefault: (id: string) =>
        apiRequest(`/payment-methods/${id}/set-default`, {
            method: "POST",
        }),

    verifyPayment: (orderId: string, transactionId: string) =>
        apiRequest<{ status: "success" | "failed"; message?: string }>("/payments/verify", {
            method: "POST",
            body: JSON.stringify({ orderId, transactionId }),
        }),
};

// Client API pour les favoris
export const favoriteApi = {
    getRestaurants: () =>
        apiRequest<FavoriteRestaurant[]>("/favorites/restaurants"),

    addRestaurant: (restaurantId: string) =>
        apiRequest("/favorites/restaurants", {
            method: "POST",
            body: JSON.stringify({ restaurantId }),
        }),

    removeRestaurant: (restaurantId: string) =>
        apiRequest(`/favorites/restaurants/${restaurantId}`, {
            method: "DELETE",
        }),

    getItems: () =>
        apiRequest<FavoriteItem[]>("/favorites/items"),

    addItem: (menuItemId: string) =>
        apiRequest("/favorites/items", {
            method: "POST",
            body: JSON.stringify({ menuItemId }),
        }),

    removeItem: (menuItemId: string) =>
        apiRequest(`/favorites/items/${menuItemId}`, {
            method: "DELETE",
        }),
};

// Client API pour les promotions
export const promoApi = {
    getAvailable: (restaurantId?: string) =>
        apiRequest<Promotion[]>("/promotions/available", {
            params: restaurantId ? { restaurantId } : undefined,
        }),

    validate: (data: ValidatePromoRequest) =>
        apiRequest<ValidatePromoResponse>("/promotions/validate", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getMyPromotions: () =>
        apiRequest<Promotion[]>("/promotions/my-promotions"),
};

// Client API pour le portefeuille
export const walletApi = {
    getBalance: () =>
        apiRequest<WalletBalance>("/wallet/balance"),

    getTransactions: (params: { page?: number; limit?: number } = {}) =>
        apiRequest<PaginatedResponse<WalletTransaction>>("/wallet/transactions", {
            params,
        }),

    topUp: (data: TopUpWalletRequest) =>
        apiRequest<{ transactionId: string; paymentUrl?: string }>("/wallet/top-up", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// Client API pour le support
export const supportApi = {
    createTicket: (data: CreateSupportTicketRequest) => {
        const formData = new FormData();
        formData.append("subject", data.subject);
        formData.append("message", data.message);
        formData.append("category", data.category);
        if (data.orderId) {
            formData.append("orderId", data.orderId);
        }
        if (data.attachments) {
            data.attachments.forEach((file, index) => {
                formData.append(`attachment_${index}`, file);
            });
        }

        return apiRequest<SupportTicket>("/support/tickets", {
            method: "POST",
            body: formData,
        });
    },

    getMyTickets: (params: { page?: number; limit?: number; status?: string } = {}) =>
        apiRequest<PaginatedResponse<SupportTicket>>("/support/tickets", {
            params,
        }),

    getTicket: (id: string) =>
        apiRequest<SupportTicket>(`/support/tickets/${id}`),

    replyToTicket: (id: string, message: string, attachments?: File[]) => {
        const formData = new FormData();
        formData.append("message", message);
        if (attachments) {
            attachments.forEach((file, index) => {
                formData.append(`attachment_${index}`, file);
            });
        }

        return apiRequest(`/support/tickets/${id}/reply`, {
            method: "POST",
            body: formData,
        });
    },

    getFaq: (category?: string) =>
        apiRequest<Array<{ id: string; question: string; answer: string; category: string }>>("/support/faq", {
            params: category ? { category } : undefined,
        }),
};

// Client API pour les préférences
export const preferencesApi = {
    getNotifications: () =>
        apiRequest<NotificationPreferences>("/preferences/notifications"),

    updateNotifications: (data: UpdateNotificationPreferencesRequest) =>
        apiRequest<NotificationPreferences>("/preferences/notifications", {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    updateLanguage: (language: "fr" | "en") =>
        apiRequest("/preferences/language", {
            method: "PATCH",
            body: JSON.stringify({ language }),
        }),
};

// Export du client API complet
export const clientApi = {
    auth: authApi,
    restaurants: restaurantApi,
    orders: orderApi,
    addresses: addressApi,
    payments: paymentApi,
    favorites: favoriteApi,
    promotions: promoApi,
    wallet: walletApi,
    support: supportApi,
    preferences: preferencesApi,
};