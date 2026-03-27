// Types d'événements analytics pour le parcours client
export interface BaseAnalyticsEvent {
    event: string;
    timestamp: number;
    sessionId: string;
    userId?: string;
    userRole?: string;
    page?: string;
    source?: string;
}

// Événements de découverte & recherche
export interface SearchEvent extends BaseAnalyticsEvent {
    event: "search";
    query: string;
    filters?: {
        cuisineTypes?: string[];
        priceRange?: [number, number];
        rating?: number;
        deliveryTime?: number;
        location?: string;
    };
    resultsCount: number;
    searchDuration?: number;
}

export interface RestaurantViewEvent extends BaseAnalyticsEvent {
    event: "restaurant_view";
    restaurantId: string;
    restaurantName: string;
    cuisineType: string;
    source: "search" | "featured" | "recommended" | "favorites" | "direct";
    searchQuery?: string;
}

export interface MenuItemViewEvent extends BaseAnalyticsEvent {
    event: "menu_item_view";
    restaurantId: string;
    restaurantName: string;
    menuItemId: string;
    menuItemName: string;
    price: number;
    category: string;
}

// Événements de panier & achat
export interface AddToCartEvent extends BaseAnalyticsEvent {
    event: "add_to_cart";
    restaurantId: string;
    restaurantName: string;
    menuItemId: string;
    menuItemName: string;
    price: number;
    quantity: number;
    variants?: Record<string, string>;
    cartValue: number;
    cartItemCount: number;
}

export interface RemoveFromCartEvent extends BaseAnalyticsEvent {
    event: "remove_from_cart";
    restaurantId: string;
    menuItemId: string;
    menuItemName: string;
    price: number;
    quantity: number;
    cartValue: number;
    cartItemCount: number;
}

export interface CartViewEvent extends BaseAnalyticsEvent {
    event: "cart_view";
    restaurantId?: string;
    cartValue: number;
    cartItemCount: number;
    deliveryFee: number;
}

export interface PromoCodeAppliedEvent extends BaseAnalyticsEvent {
    event: "promo_code_applied";
    promoCode: string;
    discount: number;
    cartValue: number;
    orderValue: number;
}

// Événements de checkout
export interface CheckoutStartEvent extends BaseAnalyticsEvent {
    event: "checkout_start";
    restaurantId: string;
    restaurantName: string;
    cartValue: number;
    cartItemCount: number;
    deliveryFee: number;
    serviceFee: number;
    totalValue: number;
}

export interface CheckoutStepEvent extends BaseAnalyticsEvent {
    event: "checkout_step";
    step: "address" | "payment" | "review" | "confirmation";
    stepIndex: number;
    cartValue: number;
}

export interface PaymentMethodSelectedEvent extends BaseAnalyticsEvent {
    event: "payment_method_selected";
    paymentMethod: "momo" | "orange_money" | "cash" | "wallet";
    cartValue: number;
}

// Événements de commande
export interface OrderSuccessEvent extends BaseAnalyticsEvent {
    event: "order_success";
    orderId: string;
    orderNumber: string;
    restaurantId: string;
    restaurantName: string;
    orderValue: number;
    deliveryFee: number;
    serviceFee: number;
    promoDiscount: number;
    totalValue: number;
    paymentMethod: string;
    deliveryMode: "delivery" | "pickup";
    itemCount: number;
    isFirstOrder: boolean;
}

export interface OrderStatusEvent extends BaseAnalyticsEvent {
    event: "order_status_change";
    orderId: string;
    orderNumber: string;
    previousStatus?: string;
    newStatus: string;
    restaurantId: string;
    deliveryEstimate?: number;
}

// Événements d'engagement
export interface FavoriteEvent extends BaseAnalyticsEvent {
    event: "favorite_added" | "favorite_removed";
    type: "restaurant" | "menu_item";
    restaurantId: string;
    restaurantName?: string;
    menuItemId?: string;
    menuItemName?: string;
}

export interface ShareEvent extends BaseAnalyticsEvent {
    event: "share";
    contentType: "restaurant" | "menu_item" | "order";
    contentId: string;
    shareMethod: "link" | "whatsapp" | "facebook" | "twitter" | "sms";
}

export interface ReferralEvent extends BaseAnalyticsEvent {
    event: "referral_sent" | "referral_signup";
    referralCode?: string;
    referredUserId?: string;
}

// Événements de support
export interface SupportEvent extends BaseAnalyticsEvent {
    event: "support_ticket_created" | "help_viewed" | "faq_viewed";
    category?: string;
    orderId?: string;
    helpTopic?: string;
    faqId?: string;
}

// Union de tous les événements
export type AnalyticsEvent =
    | SearchEvent
    | RestaurantViewEvent
    | MenuItemViewEvent
    | AddToCartEvent
    | RemoveFromCartEvent
    | CartViewEvent
    | PromoCodeAppliedEvent
    | CheckoutStartEvent
    | CheckoutStepEvent
    | PaymentMethodSelectedEvent
    | OrderSuccessEvent
    | OrderStatusEvent
    | FavoriteEvent
    | ShareEvent
    | ReferralEvent
    | SupportEvent;

// Configuration analytics
export interface AnalyticsConfig {
    providers: AnalyticsProvider[];
    enableDebug: boolean;
    enableConsoleLog: boolean;
    sessionTimeout: number;
    batchSize: number;
    flushInterval: number;
}

export interface AnalyticsProvider {
    name: string;
    enabled: boolean;
    track: (event: AnalyticsEvent) => void | Promise<void>;
    identify?: (userId: string, traits?: Record<string, any>) => void | Promise<void>;
    page?: (name: string, properties?: Record<string, any>) => void | Promise<void>;
}

// Classe principale d'analytics
class Analytics {
    private config: AnalyticsConfig;
    private sessionId: string;
    private queue: AnalyticsEvent[] = [];
    private flushTimer?: NodeJS.Timeout;
    private lastActivity: number = Date.now();

    constructor(config: AnalyticsConfig) {
        this.config = config;
        this.sessionId = this.generateSessionId();
        this.startFlushTimer();

        // Détecter l'inactivité pour renouveler la session
        setInterval(() => {
            if (Date.now() - this.lastActivity > this.config.sessionTimeout) {
                this.renewSession();
            }
        }, 60000); // Vérifier chaque minute
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private renewSession() {
        this.sessionId = this.generateSessionId();
        this.lastActivity = Date.now();
    }

    private startFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    private async flush() {
        if (this.queue.length === 0) return;

        const events = this.queue.splice(0);
        const promises = this.config.providers
            .filter(provider => provider.enabled)
            .map(provider => {
                try {
                    return Promise.resolve(
                        events.map(event => provider.track(event))
                    );
                } catch (error) {
                    if (this.config.enableDebug) {
                        console.error(`Analytics provider ${provider.name} error:`, error);
                    }
                    return Promise.resolve();
                }
            });

        try {
            await Promise.all(promises);
        } catch (error) {
            if (this.config.enableDebug) {
                console.error("Analytics flush error:", error);
            }
        }
    }

    // Méthode principale pour tracker un événement
    track(eventData: Omit<AnalyticsEvent, "timestamp" | "sessionId">): void {
        this.lastActivity = Date.now();

        const event: AnalyticsEvent = {
            ...eventData,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            page: typeof window !== "undefined" ? window.location.pathname : undefined,
        } as AnalyticsEvent;

        if (this.config.enableConsoleLog) {
            console.log("Analytics Event:", event);
        }

        this.queue.push(event);

        // Flush immédiatement si la queue est pleine
        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        }
    }

    // Identifier un utilisateur
    identify(userId: string, traits?: Record<string, any>): void {
        const promises = this.config.providers
            .filter(provider => provider.enabled && provider.identify)
            .map(provider => provider.identify!(userId, traits));

        Promise.all(promises).catch(error => {
            if (this.config.enableDebug) {
                console.error("Analytics identify error:", error);
            }
        });
    }

    // Tracker une page view
    page(name: string, properties?: Record<string, any>): void {
        const promises = this.config.providers
            .filter(provider => provider.enabled && provider.page)
            .map(provider => provider.page!(name, properties));

        Promise.all(promises).catch(error => {
            if (this.config.enableDebug) {
                console.error("Analytics page error:", error);
            }
        });
    }

    // Flush manuel
    flushNow(): Promise<void> {
        return this.flush();
    }

    // Cleanup
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
}

// Provider pour l'API interne
export const createInternalProvider = (): AnalyticsProvider => ({
    name: "internal",
    enabled: true,
    track: async (event) => {
        try {
            await fetch("/api/v1/analytics/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(event),
            });
        } catch (error) {
            console.error("Internal analytics provider error:", error);
        }
    },
});

// Provider pour Google Analytics (exemple)
export const createGoogleAnalyticsProvider = (measurementId: string): AnalyticsProvider => ({
    name: "google_analytics",
    enabled: !!measurementId,
    track: (event) => {
        if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", event.event, {
                event_category: "ecommerce",
                event_label: event.event,
                custom_map: event,
            });
        }
    },
    identify: (userId, traits) => {
        if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("config", measurementId, {
                user_id: userId,
                custom_map: traits,
            });
        }
    },
    page: (name, properties) => {
        if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", "page_view", {
                page_title: name,
                ...properties,
            });
        }
    },
});

// Configuration par défaut
const defaultConfig: AnalyticsConfig = {
    providers: [createInternalProvider()],
    enableDebug: process.env.NODE_ENV === "development",
    enableConsoleLog: process.env.NODE_ENV === "development",
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    batchSize: 10,
    flushInterval: 5000, // 5 secondes
};

// Instance globale d'analytics
let analyticsInstance: Analytics | null = null;

export const initializeAnalytics = (config: Partial<AnalyticsConfig> = {}) => {
    if (typeof window !== "undefined") {
        analyticsInstance = new Analytics({ ...defaultConfig, ...config });
    }
    return analyticsInstance;
};

export const getAnalytics = (): Analytics | null => {
    return analyticsInstance;
};

// Fonctions utilitaires pour les événements courants
export const trackSearch = (query: string, filters: any, resultsCount: number) => {
    analyticsInstance?.track({
        event: "search",
        query,
        filters,
        resultsCount,
    } as SearchEvent);
};

export const trackAddToCart = (item: any, cart: any) => {
    analyticsInstance?.track({
        event: "add_to_cart",
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        menuItemId: item.id,
        menuItemName: item.name,
        price: item.price,
        quantity: item.quantity,
        variants: item.variants,
        cartValue: cart.total,
        cartItemCount: cart.itemCount,
    } as AddToCartEvent);
};

export const trackCheckoutStart = (cart: any, restaurant: any) => {
    analyticsInstance?.track({
        event: "checkout_start",
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        cartValue: cart.subtotal,
        cartItemCount: cart.itemCount,
        deliveryFee: cart.deliveryFee,
        serviceFee: cart.serviceFee,
        totalValue: cart.total,
    } as CheckoutStartEvent);
};

export const trackOrderSuccess = (order: any, isFirstOrder: boolean = false) => {
    analyticsInstance?.track({
        event: "order_success",
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant?.name,
        orderValue: order.pricing.subtotal,
        deliveryFee: order.pricing.deliveryFee,
        serviceFee: order.pricing.serviceFee,
        promoDiscount: order.pricing.promoDiscount,
        totalValue: order.pricing.total,
        paymentMethod: order.paymentInfo.method,
        deliveryMode: order.deliveryInfo.mode,
        itemCount: order.items.length,
        isFirstOrder,
    } as OrderSuccessEvent);
};