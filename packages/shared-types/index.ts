// ============================================================
// Types partagés entre web-dashboard et mobile-client
// Alignés avec le schéma Supabase (snake_case → camelCase)
// ============================================================

// --- Enums ---

export type UserRole = 'merchant' | 'customer';

export type OrderStatus =
    | 'scheduled'   // Commande programmée pour une heure future
    | 'pending'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'completed'
    | 'cancelled';

export type PaymentMethod =
    | 'mobile_money_mtn'
    | 'mobile_money_orange'
    | 'cash';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type DeliveryType = 'delivery' | 'pickup' | 'dine_in';

// --- Table / Reservation statuses ---

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export type TableZoneType = 'indoor' | 'outdoor' | 'terrace' | 'vip' | 'air_conditioned';

export type ReservationStatus =
    | 'pending'
    | 'confirmed'
    | 'seated'
    | 'completed'
    | 'no_show'
    | 'cancelled';

// --- User ---

export interface User {
    id: string;
    email: string | null;
    phone: string | null;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
    restaurantId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    profile?: {
        onboardingCompleted?: boolean;
        themePreference?: string;
        preferredLang?: string;
        notificationsEnabled?: boolean;
        loyaltyPoints?: number;
    };
}

// --- Restaurant ---

export interface Restaurant {
    id: string;
    ownerId?: string;
    name: string;
    slug?: string;
    description: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    coverImage?: string;
    primaryColor?: string;
    isPublished?: boolean;
    isActive?: boolean;
    rating?: number;
    reviewCount?: number;
    estimatedDeliveryTime?: number;
    openingHours?: OpeningHours | null;
    deliveryZones?: string[] | null;
    minOrderAmount?: number;
    deliveryFee: number;
    cuisineType?: string;
    // Dine-in capabilities
    hasDineIn?: boolean;
    hasReservations?: boolean;
    corkageFeeAmount?: number;   // FCFA per external drink
    dineInServiceFee?: number;   // percentage (e.g. 10 = 10%)
    totalTables?: number;
    // Sponsored / advertising
    isSponsored?: boolean;
    sponsoredRank?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Address {
    id: string;
    label: string;
    address: string;
    city: string;
    isDefault: boolean;
}

// --- Category ---

export interface Category {
    id: string;
    restaurantId: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
}

// --- Product ---

export interface Product {
    id: string;
    restaurantId: string;
    categoryId?: string | null;
    name: string;
    description: string | null;
    price: number;
    compareAtPrice?: number | null;
    image?: string;
    imageUrl?: string | null;
    isAvailable: boolean;
    sortOrder?: number;
    category?: string;
    options?: ProductOption[] | null;
    // Health and dietary info
    allergens?: string | null;
    isHalal?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductOption {
    name: string;
    required?: boolean;
    choices: ProductOptionChoice[];
}

export interface ProductOptionChoice {
    label: string;
    extraPrice: number;
}

// --- Order ---

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    selectedOptions?: Record<string, string>;
    specialInstructions?: string;
}

export interface Order {
    id: string;
    restaurantId: string;
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    serviceFee?: number;
    corkageFee?: number;
    tipAmount?: number;
    total: number;
    status: OrderStatus;
    deliveryType: DeliveryType;
    deliveryAddress: string | null;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes: string | null;
    // Dine-in specific
    tableNumber?: string | null;
    covers?: number | null;
    externalDrinksCount?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

// --- Review ---

export interface Review {
    id: string;
    orderId: string;
    restaurantId: string;
    customerId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
}

// --- Payout ---

export interface Payout {
    id: string;
    restaurantId: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    periodStart: Date;
    periodEnd: Date;
    paidAt: Date | null;
    createdAt: Date;
}

// --- Horaires ---

export interface OpeningHours {
    monday: DayHours;
    tuesday: DayHours;
    wednesday: DayHours;
    thursday: DayHours;
    friday: DayHours;
    saturday: DayHours;
    sunday: DayHours;
}

export interface DayHours {
    isOpen: boolean;
    open: string;  // "08:00"
    close: string; // "22:00"
}

// --- Analytics Dashboard ---

export interface DashboardStats {
    revenue: {
        today: number;
        week: number;
        month: number;
    };
    orders: {
        today: number;
        pending: number;
        active: number;
    };
    averageOrderValue: number;
    totalCustomers: number;
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

// --- Table (restaurant floor plan) ---

export interface RestaurantTable {
    id: string;
    number: string;           // "T1", "T2", "VIP-1"
    zoneId?: string | null;
    capacity: number;         // max seats
    status: TableStatus;
    qrCode?: string | null;   // QR code data / URL
    isActive: boolean;
    sortOrder?: number;
    createdAt?: Date;
}

export interface TableZone {
    id: string;
    name: string;             // "Terrasse", "Interieur", "VIP"
    type: TableZoneType;
    description?: string | null;
    sortOrder?: number;
    isActive: boolean;
}

// --- Reservation ---

export interface Reservation {
    id: string;
    restaurantId: string;
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    tableId?: string | null;
    zonePreference?: TableZoneType | null;
    date: string;             // "2026-03-15"
    time: string;             // "19:30"
    duration: number;         // minutes (default 90)
    partySize: number;        // number of guests
    status: ReservationStatus;
    specialRequests?: string | null;
    depositAmount?: number;   // for large parties
    depositPaid?: boolean;
    preOrderId?: string | null; // linked pre-order
    confirmedAt?: Date | null;
    seatedAt?: Date | null;
    cancellationReason?: string | null;
    createdAt: Date;
    updatedAt?: Date;
}

// --- Dine-in settings (per restaurant) ---

export interface DineInSettings {
    enabled: boolean;
    reservationsEnabled: boolean;
    corkageFeeEnabled: boolean;
    corkageFeeAmount: number;   // FCFA per bottle/drink
    serviceFeePercent: number;  // e.g. 10 for 10%
    tipEnabled: boolean;
    tipSuggestions: number[];   // e.g. [5, 10, 15]
    defaultReservationDuration: number; // minutes
    maxPartySize: number;
    cancellationDeadlineHours: number; // free cancel before X hours
    qrOrderingEnabled: boolean;
    callWaiterEnabled: boolean;
    splitBillEnabled: boolean;
    dineInOnlyMenuEnabled: boolean;
}
