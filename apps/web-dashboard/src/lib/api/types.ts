// Types de base partagés
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: Pagination;
}

// Auth & User types
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phone?: string;
    acceptTerms: boolean;
    role?: "client";
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: string;
        name?: string;
        phone?: string;
        isVerified: boolean;
        createdAt: string;
        subscriptionStatus?: "active" | "inactive" | "trial";
    };
    session: {
        token: string;
        refreshToken: string;
        expiresAt: string;
    };
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    language?: "fr" | "en";
    dietaryRestrictions?: string[];
    allergies?: string[];
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// Restaurant & Menu types
export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    description: string;
    logoUrl?: string;
    coverUrl?: string;
    cuisineType: string;
    rating: number;
    reviewCount: number;
    orderCount: number;
    city: string;
    district: string;
    address: string;
    phone: string;
    isOpen: boolean;
    openingHours: OpeningHours[];
    deliveryInfo: {
        deliveryFee: number;
        freeDeliveryThreshold: number;
        estimatedTime: number;
        maxDeliveryDistance: number;
    };
    paymentMethods: ("momo" | "orange_money" | "cash")[];
    isPromoted: boolean;
    promoText?: string;
}

export interface OpeningHours {
    dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, etc.
    openTime: string; // Format "HH:MM"
    closeTime: string;
    isClosed: boolean;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    isAvailable: boolean;
    preparationTime: number;
    variants?: MenuItemVariant[];
    options?: MenuItemOption[];
    allergens?: string[];
    nutritionalInfo?: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
    };
}

export interface MenuItemVariant {
    id: string;
    name: string;
    priceAdjustment: number;
}

export interface MenuItemOption {
    id: string;
    name: string;
    isRequired: boolean;
    multiSelect: boolean;
    choices: {
        id: string;
        name: string;
        priceAdjustment: number;
    }[];
}

export interface MenuCategory {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    items: MenuItem[];
}

export interface RestaurantMenu {
    restaurantId: string;
    categories: MenuCategory[];
}

// Search & Filter types
export interface RestaurantSearchRequest {
    query?: string;
    cuisineTypes?: string[];
    city?: string;
    district?: string;
    priceRange?: [number, number];
    minRating?: number;
    maxDeliveryTime?: number;
    sortBy?: "relevance" | "rating" | "delivery_time" | "price" | "distance";
    onlyOpen?: boolean;
    hasPromo?: boolean;
    coordinates?: { lat: number; lng: number };
    page?: number;
    limit?: number;
}

export interface RestaurantSearchResponse extends PaginatedResponse<Restaurant> {
    filters: {
        cuisineTypes: string[];
        priceRanges: { min: number; max: number; count: number }[];
        avgDeliveryTime: number;
    };
}

// Order & Cart types
export interface CartItemRequest {
    menuItemId: string;
    quantity: number;
    variants?: Record<string, string>;
    options?: Record<string, string[]>;
    specialInstructions?: string;
}

export interface CartValidationRequest {
    restaurantId: string;
    items: CartItemRequest[];
    promoCode?: string;
    deliveryAddressId?: string;
}

export interface CartValidationResponse {
    items: {
        menuItemId: string;
        name: string;
        price: number;
        quantity: number;
        subtotal: number;
        isAvailable: boolean;
        variants?: Record<string, string>;
        options?: Record<string, string[]>;
    }[];
    pricing: {
        subtotal: number;
        deliveryFee: number;
        serviceFee: number;
        promoDiscount: number;
        total: number;
    };
    promoValidation?: {
        isValid: boolean;
        discount: number;
        message?: string;
    };
    deliveryValidation: {
        isValid: boolean;
        estimatedTime: number;
        message?: string;
    };
}

export interface CreateOrderRequest {
    restaurantId: string;
    items: CartItemRequest[];
    deliveryAddressId: string;
    paymentMethodId: string;
    deliveryMode: "delivery" | "pickup";
    promoCode?: string;
    specialInstructions?: string;
    scheduledFor?: string; // ISO date pour commande programmée
}

export interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    restaurantId: string;
    restaurant: Pick<Restaurant, "id" | "name" | "logoUrl" | "phone">;
    items: OrderItem[];
    pricing: {
        subtotal: number;
        deliveryFee: number;
        serviceFee: number;
        promoDiscount: number;
        total: number;
    };
    deliveryInfo: {
        mode: "delivery" | "pickup";
        address?: DeliveryAddress;
        estimatedTime: number;
        actualDeliveryTime?: number;
    };
    paymentInfo: {
        method: "momo" | "orange_money" | "cash";
        status: "pending" | "paid" | "failed" | "refunded";
        transactionId?: string;
    };
    timeline: OrderTimelineEvent[];
    specialInstructions?: string;
    createdAt: string;
    updatedAt: string;
}

export type OrderStatus = 
    | "pending_payment"
    | "confirmed"
    | "preparing"
    | "ready_for_pickup"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "failed";

export interface OrderItem {
    id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    variants?: Record<string, string>;
    options?: Record<string, string[]>;
    specialInstructions?: string;
}

export interface OrderTimelineEvent {
    id: string;
    status: OrderStatus;
    message: string;
    timestamp: string;
    details?: Record<string, any>;
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

// Address Management
export interface CreateAddressRequest {
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    coordinates?: { lat: number; lng: number };
    isDefault?: boolean;
    deliveryInstructions?: string;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

// Payment Methods
export interface PaymentMethod {
    id: string;
    type: "momo" | "orange_money" | "cash";
    displayName: string;
    phone?: string;
    isDefault: boolean;
    isActive: boolean;
    addedAt: string;
}

export interface CreatePaymentMethodRequest {
    type: "momo" | "orange_money";
    phone: string;
    isDefault?: boolean;
}

// Favorites
export interface FavoriteRestaurant {
    restaurantId: string;
    restaurant: Restaurant;
    addedAt: string;
}

export interface FavoriteItem {
    menuItemId: string;
    restaurantId: string;
    menuItem: MenuItem & { restaurantName: string };
    addedAt: string;
}

// Promotions
export interface Promotion {
    id: string;
    code: string;
    title: string;
    description: string;
    type: "percentage" | "fixed_amount" | "free_delivery";
    value: number;
    minimumOrder?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usageCount: number;
    applicableRestaurants?: string[];
    isActive: boolean;
}

export interface ValidatePromoRequest {
    code: string;
    restaurantId: string;
    orderAmount: number;
}

export interface ValidatePromoResponse {
    isValid: boolean;
    discount: number;
    message: string;
    promotion?: Promotion;
}

// Wallet & Transactions
export interface WalletBalance {
    balance: number;
    currency: "FCFA";
    lastUpdated: string;
}

export interface WalletTransaction {
    id: string;
    type: "credit" | "debit";
    amount: number;
    description: string;
    reference?: string;
    orderId?: string;
    status: "pending" | "completed" | "failed";
    createdAt: string;
}

export interface TopUpWalletRequest {
    amount: number;
    paymentMethodId: string;
}

// Support & Help
export interface SupportTicket {
    id: string;
    subject: string;
    message: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "urgent";
    category: "order_issue" | "payment" | "delivery" | "refund" | "general";
    orderId?: string;
    attachments?: string[];
    createdAt: string;
    updatedAt: string;
    responses: SupportResponse[];
}

export interface SupportResponse {
    id: string;
    message: string;
    isFromSupport: boolean;
    attachments?: string[];
    createdAt: string;
}

export interface CreateSupportTicketRequest {
    subject: string;
    message: string;
    category: "order_issue" | "payment" | "delivery" | "refund" | "general";
    orderId?: string;
    attachments?: File[];
}

// Notifications
export interface NotificationPreferences {
    orderUpdates: boolean;
    promotions: boolean;
    newRestaurants: boolean;
    email: boolean;
    sms: boolean;
}

export interface UpdateNotificationPreferencesRequest extends NotificationPreferences {}

// API Error Codes
export const API_ERROR_CODES = {
    // Auth
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
    EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
    WEAK_PASSWORD: "WEAK_PASSWORD",
    
    // Orders
    RESTAURANT_CLOSED: "RESTAURANT_CLOSED",
    ITEM_UNAVAILABLE: "ITEM_UNAVAILABLE",
    DELIVERY_AREA_NOT_COVERED: "DELIVERY_AREA_NOT_COVERED",
    MINIMUM_ORDER_NOT_MET: "MINIMUM_ORDER_NOT_MET",
    
    // Payments
    PAYMENT_FAILED: "PAYMENT_FAILED",
    INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
    INVALID_PAYMENT_METHOD: "INVALID_PAYMENT_METHOD",
    
    // Promotions
    PROMO_CODE_INVALID: "PROMO_CODE_INVALID",
    PROMO_CODE_EXPIRED: "PROMO_CODE_EXPIRED",
    PROMO_CODE_ALREADY_USED: "PROMO_CODE_ALREADY_USED",
    PROMO_MINIMUM_NOT_MET: "PROMO_MINIMUM_NOT_MET",
    
    // General
    VALIDATION_ERROR: "VALIDATION_ERROR",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    SERVER_ERROR: "SERVER_ERROR",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];