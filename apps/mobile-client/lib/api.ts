/**
 * lib/api.ts
 * Typed API client for mobile-client — wraps the Next.js backend at EXPO_PUBLIC_API_URL.
 * All responses are mapped to the shapes expected by the mobile app.
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';

function phoneToAuthEmail(phone: string) {
    const digits = phone.replace(/\D/g, '');
    return `mobile-${digits}@auth.kbouffe.app`;
}

function resolveBaseUrl() {
    const rawBase = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

    // Android emulators cannot reach the host machine via localhost.
    if (Platform.OS === 'android') {
        return rawBase.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2');
    }

    return rawBase;
}

const BASE = resolveBaseUrl();

// ── Error type ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            ...headers,
            ...(init?.headers ?? {}),
        },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(res.status, (json as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return json as T;
}


export interface Address {
    id: string;
    label: string;
    address: string;
    city: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    instructions?: string;
    isDefault: boolean;
}

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: string;
    restaurant_id?: string;
    order_id?: string;
}

// ── Mobile-mapped restaurant type ─────────────────────────────────────────────
export interface MobileRestaurant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    logoUrl: string | null;
    city: string | null;
    address: string | null;
    cuisineType: string | null;
    rating: number | null;
    reviewCount: number | null;
    estimatedDeliveryTime: number;
    deliveryFee: number;
    /** Whether this restaurant accepts online reservations */
    hasReservations: boolean;
    deliveryBaseFee: number;
    deliveryPerKmFee: number;
    maxDeliveryRadiusKm: number;
    isActive: boolean;
    isVerified: boolean;
    isPremium: boolean;
    isSponsored: boolean;
    sponsoredRank: number | null;
}

export interface MobileCategory {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
}

export interface MobileProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    is_available: boolean;
    category_id: string | null;
    category?: string;
    image?: string;
    images?: string[];
    sort_order: number;
    // Health and dietary info
    allergens?: string | null;
    is_halal?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    // compat fields for existing mobile components
    options?: {
        name: string;
        required?: boolean;
        choices: { label: string; extraPrice: number }[];
    }[];
}

export interface MobileReview {
    id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    created_at: string;
    customerName?: string;
}

// ── /api/stores ───────────────────────────────────────────────────────────────
interface StoresParams {
    q?: string;
    cuisine?: string;
    city?: string;
    sort?: 'recommended' | 'rating' | 'orders' | 'newest';
    limit?: number;
}

interface StoresResponse {
    restaurants: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logoUrl: string | null;
        coverUrl: string | null;
        address: string | null;
        city: string | null;
        cuisineType: string | null;
        priceRange: number | null;
        rating: number | null;
        reviewCount: number | null;
        orderCount: number | null;
        estimatedDeliveryMinutes: number | null;
        deliveryFee: number | null;
        isActive: boolean;
        isVerified: boolean;
        isPremium: boolean;
        isSponsored: boolean;
        sponsoredRank: number | null;
        delivery_base_fee: number | null;
        delivery_per_km_fee: number | null;
        max_delivery_radius_km: number | null;
        hasReservations?: boolean;
    }[];
}

function mapRestaurant(r: StoresResponse['restaurants'][0]): MobileRestaurant {
    return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        coverImage: r.coverUrl,
        logoUrl: r.logoUrl,
        city: r.city,
        address: r.address,
        cuisineType: r.cuisineType,
        rating: r.rating,
        reviewCount: r.reviewCount,
        estimatedDeliveryTime: r.estimatedDeliveryMinutes ?? 30,
        deliveryFee: r.deliveryFee ?? 1000,
        deliveryBaseFee: r.delivery_base_fee ?? 1000,
        deliveryPerKmFee: r.delivery_per_km_fee ?? 0,
        maxDeliveryRadiusKm: r.max_delivery_radius_km ?? 10,
        hasReservations: r.hasReservations ?? false,
        isActive: r.isActive,
        isVerified: r.isVerified,
        isPremium: r.isPremium,
        isSponsored: r.isSponsored,
        sponsoredRank: r.sponsoredRank,
    };
}

export async function getRestaurants(params: StoresParams = {}): Promise<MobileRestaurant[]> {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.cuisine) qs.set('cuisine', params.cuisine);
    if (params.city) qs.set('city', params.city);
    if (params.sort) qs.set('sort', params.sort);
    if (params.limit) qs.set('limit', String(params.limit));

    const data = await apiFetch<StoresResponse>(`/api/stores?${qs.toString()}`);
    return (data.restaurants ?? []).map(mapRestaurant);
}

// ── /api/store/[slug] ─────────────────────────────────────────────────────────
interface StoreResponse {
    restaurant: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logoUrl: string | null;
        coverUrl: string | null;
        address: string | null;
        city: string | null;
        cuisineType: string | null;
        rating: number | null;
        reviewCount: number | null;
        orderCount: number | null;
        isVerified: boolean;
        isPremium: boolean;
        hasReservations?: boolean;
        delivery_base_fee?: number | null;
        delivery_per_km_fee?: number | null;
        max_delivery_radius_km?: number | null;
    };
    categories: MobileCategory[];
    products: {
        id: string;
        name: string;
        description: string | null;
        price: number;
        compare_at_price: number | null;
        image_url: string | null;
        is_available: boolean;
        category_id: string | null;
        sort_order: number;
        allergens: string | null;
        is_halal: boolean;
        is_vegan: boolean;
        is_gluten_free: boolean;
        delivery_base_fee?: number | null;
        delivery_per_km_fee?: number | null;
        max_delivery_radius_km?: number | null;
    }[];
    reviews: MobileReview[];
}

export interface StoreDetail {
    restaurant: MobileRestaurant;
    categories: MobileCategory[];
    products: MobileProduct[];
    reviews: MobileReview[];
}

export async function getStore(slug: string): Promise<StoreDetail> {
    const data = await apiFetch<StoreResponse>(`/api/store/${encodeURIComponent(slug)}`);
    return {
        restaurant: {
            ...mapRestaurant({
                ...data.restaurant,
                coverUrl: data.restaurant.coverUrl,
                priceRange: null,
                orderCount: data.restaurant.orderCount,
                estimatedDeliveryMinutes: null,
                deliveryFee: null,
                delivery_base_fee: data.restaurant.delivery_base_fee ?? null,
                delivery_per_km_fee: data.restaurant.delivery_per_km_fee ?? null,
                max_delivery_radius_km: data.restaurant.max_delivery_radius_km ?? null,
                hasReservations: data.restaurant.hasReservations ?? false,
                isActive: true,
                isSponsored: false,
                sponsoredRank: null,
            }),
        },
        categories: data.categories ?? [],
        products: (data.products ?? []).map((p) => ({
            ...p,
            category: data.categories.find((c) => c.id === p.category_id)?.name,
            image: p.image_url ?? undefined,
            images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
        })),
        reviews: data.reviews ?? [],
    };
}

// ── /api/store/order ──────────────────────────────────────────────────────────
export interface PlaceOrderParams {
    restaurantId: string;
    items: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        options?: {
            optionId?: string;
            valueId?: string;
            name: string;
            value: string;
            priceAdjustment: number;
        }[];
    }[];
    deliveryType: 'delivery' | 'pickup' | 'dine_in';
    deliveryAddress?: string;
    tableNumber?: string;
    customerName: string;
    customerPhone: string;
    paymentMethod: 'cash' | 'mobile_money_mtn' | 'mobile_money_orange';
    subtotal: number;
    deliveryFee: number;
    total: number;
    notes?: string;
}

export interface PlaceOrderResponse {
    success: boolean;
    orderId: string;
    payment?: {
        provider: 'mtn_momo';
        referenceId: string;
        status: 'pending' | 'failed';
        error?: string;
    } | null;
}

export async function placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResponse> {
    const data = await apiFetch<{
        success: boolean;
        orderId?: string;
        id?: string;
        order?: { id: string };
        payment?: PlaceOrderResponse['payment'];
    }>(
        '/api/store/order',
        { method: 'POST', body: JSON.stringify(params) }
    );
    const orderId = data.orderId ?? data.id ?? data.order?.id ?? '';
    return { success: data.success ?? true, orderId, payment: data.payment ?? null };
}

// ── /api/store/orders/[id] ────────────────────────────────────────────────────
export interface OrderTracking {
    id: string;
    status: string;
    payment_status: string;
    restaurant_id?: string | null;
    restaurant_name?: string | null;
    delivery_type: string;
    delivery_address: string | null;
    customer_name: string;
    customer_phone: string;
    items: { productId: string; name: string; price: number; quantity: number }[];
    subtotal: number;
    delivery_fee: number;
    service_fee: number;
    total: number;
    created_at: string;
    updated_at: string;
    notes: string | null;
    table_number: string | null;
}

export async function trackOrder(orderId: string): Promise<OrderTracking> {
    const data = await apiFetch<{ order: OrderTracking }>(`/api/store/orders/${orderId}`);
    return data.order;
}

// ── /api/coupons/validate ─────────────────────────────────────────────────────
export interface ValidateCouponParams {
    code: string;
    restaurantId: string | null;
    orderTotal: number;
    deliveryType: string;
    customerId?: string | null;
}

export async function validateCoupon(params: ValidateCouponParams): Promise<{ discount: number }> {
    // Map camelCase → snake_case attendu par l'API
    return apiFetch<{ discount: number }>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
            code:          params.code,
            restaurant_id: params.restaurantId,
            order_subtotal: params.orderTotal,
            delivery_type:  params.deliveryType,
            customer_id:    params.customerId ?? null,
        }),
    });
}

// ── Loyalty & Wallet ─────────────────────────────────────────────────────────

export interface LoyaltyData {
    referral: {
        code: string;
        invites: number;
        rewards: number;
    };
    favorites: {
        restaurants: string[];
        products: string[];
    };
    profile?: {
        fullName: string | null;
        phone: string | null;
        avatarUrl: string | null;
        preferredLang: string | null;
        notificationsEnabled: boolean;
        onboardingCompleted: boolean;
        themePreference: 'light' | 'dark' | 'system';
    };
}

export async function getLoyalty(): Promise<LoyaltyData> {
    return apiFetch<LoyaltyData>('/api/account/loyalty');
}


export async function toggleRestaurantFavorite(restaurantId: string): Promise<{ active: boolean }> {
    return apiFetch<{ active: boolean }>('/api/account/favorites/restaurant', {
        method: 'POST',
        body: JSON.stringify({ restaurantId }),
    });
}

export async function toggleProductFavorite(productId: string): Promise<{ active: boolean }> {
    return apiFetch<{ active: boolean }>('/api/account/favorites/product', {
        method: 'POST',
        body: JSON.stringify({ productId }),
    });
}

export async function postReferralReward(): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/account/referral/reward', {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

// ── Addresses & Profile ───────────────────────────────────────────────────────

export async function getAddresses(): Promise<Address[]> {
    const data = await apiFetch<{ addresses: any[] }>('/api/account/addresses');
    return data.addresses.map(a => ({
        id: a.id,
        label: a.label,
        address: a.address,
        city: a.city,
        postalCode: a.postal_code,
        lat: a.lat,
        lng: a.lng,
        instructions: a.instructions,
        isDefault: a.is_default
    }));
}

export async function createAddress(params: Partial<Address>): Promise<{ success: boolean; address: Address }> {
    return apiFetch<{ success: boolean; address: Address }>('/api/account/addresses', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export async function updateAddress(id: string, params: Partial<Address>): Promise<{ success: boolean; address: Address }> {
    return apiFetch<{ success: boolean; address: Address }>(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(params),
    });
}

export async function deleteAddress(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/account/addresses/${id}`, {
        method: 'DELETE',
    });
}

export async function updateProfile(params: any): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify(params),
    });
}

/**
 * Permanently deletes the authenticated user's account.
 * Calls: DELETE /api/account/profile
 * Removes both the public profile row and the Supabase Auth user.
 */
export async function deleteAccount(): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/account/profile', {
        method: 'DELETE',
    });
}

export async function registerCustomer(params: {
    fullName: string;
    phone: string;
    password: string;
}): Promise<{ success: boolean; userId: string; email: string }> {
    return apiFetch<{ success: boolean; userId: string; email: string }>('/api/auth/customer-register', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

// ── Support ──────────────────────────────────────────────────────────────────

export async function getSupportTickets(): Promise<SupportTicket[]> {
    const data = await apiFetch<{ tickets: any[] }>('/api/account/support/tickets');
    return data.tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        createdAt: t.created_at,
        restaurant_id: t.restaurant_id,
        order_id: t.order_id
    }));
}

export async function createSupportTicket(params: Partial<SupportTicket>): Promise<{ success: boolean; ticket: SupportTicket }> {
    return apiFetch<{ success: boolean; ticket: SupportTicket }>('/api/account/support/tickets', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * A single message in a support ticket thread.
 * `senderType` can be "customer" (the mobile user), "admin" (KBouffe support),
 * or "restaurant" (legacy tickets opened from the restaurant dashboard).
 */
export interface TicketMessage {
    id: string;
    ticketId: string;
    senderId: string | null;
    senderType: 'customer' | 'admin' | 'restaurant' | string;
    senderName: string | null;
    senderAvatar: string | null;
    content: string;
    isRead: boolean;
    createdAt: string;
}

/**
 * Fetches all messages for a support ticket (including the synthesised
 * initial message derived from the ticket description).
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const data = await apiFetch<{ messages: TicketMessage[] }>(
        `/api/account/support/tickets/${encodeURIComponent(ticketId)}/messages`
    );
    return data.messages ?? [];
}

/**
 * Sends a new message from the logged-in customer on an existing ticket.
 */
export async function sendTicketMessage(
    ticketId: string,
    message: string
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(
        `/api/account/support/tickets/${encodeURIComponent(ticketId)}/messages`,
        {
            method: 'POST',
            body: JSON.stringify({ content: message }),
        }
    );
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export interface SubmitReviewParams {
    orderId?: string;
    restaurantId: string;
    rating: number;
    comment?: string;
}

export async function submitReview(params: SubmitReviewParams): Promise<{ success: boolean; review: MobileReview }> {
    return apiFetch<{ success: boolean; review: MobileReview }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export async function getMyReviews(): Promise<(MobileReview & { restaurantName: string | null; order_id: string | null; restaurant_id: string })[]> {
    const data = await apiFetch<{ reviews: any[] }>('/api/reviews/mine');
    return data.reviews ?? [];
}

// ── Product Reviews ──────────────────────────────────────────────────────────

export interface ProductReview {
    id: string;
    rating: number;
    comment: string | null;
    customerName: string;
    created_at: string;
}

export interface ProductReviewStats {
    count: number;
    average: number;
}

export async function getProductReviews(productId: string): Promise<{ reviews: ProductReview[]; stats: ProductReviewStats }> {
    return apiFetch<{ reviews: ProductReview[]; stats: ProductReviewStats }>(`/api/store/products/${encodeURIComponent(productId)}/reviews`);
}

export async function submitProductReview(params: { productId: string; restaurantId: string; rating: number; comment?: string }): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/reviews/product', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

// ── Restaurant Reviews ──────────────────────────────────────────────

export interface RestaurantReview {
    id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    customerName: string;
    created_at: string;
}

export interface RestaurantReviewStats {
    count: number;
    average: number;
    distribution: Record<number, number>;
}

export async function getRestaurantReviews(restaurantId: string): Promise<{ reviews: RestaurantReview[]; stats: RestaurantReviewStats }> {
    return apiFetch<{ reviews: RestaurantReview[]; stats: RestaurantReviewStats }>(`/api/store/restaurants/${encodeURIComponent(restaurantId)}/reviews`);
}

export async function submitRestaurantReview(params: { restaurantId: string; rating: number; comment?: string }): Promise<{ success: boolean; review: MobileReview }> {
    return apiFetch<{ success: boolean; review: MobileReview }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

// ── Account Orders ───────────────────────────────────────────────────────────

export async function getAccountOrders(): Promise<OrderTracking[]> {
    const data = await apiFetch<{ orders: OrderTracking[] }>('/api/account/orders');
    return data.orders || [];
}

/**
 * Cancel an order by its ID.
 * The backend only allows cancellation when the order status is "pending".
 * Requires the user to be authenticated (uses the Supabase session token).
 * POST /api/auth/orders/{orderId}/cancel
 */
export async function cancelOrder(orderId: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/auth/orders/${orderId}/cancel`, {
        method: 'POST',
    });
}

// ── Push Notifications ────────────────────────────────────────────────────────

/**
 * Register (or update) the Expo push token for the currently authenticated user.
 * Called once on app launch after the user signs in.
 *
 * POST /api/account/push-token
 * Body: { token: string, platform: 'ios' | 'android' }
 */
export async function registerPushToken(
    token: string,
    platform: 'ios' | 'android',
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/account/push-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform }),
    });
}

export { phoneToAuthEmail };

// ── Reservations ─────────────────────────────────────────────────────────────

/**
 * Represents a confirmed or pending reservation returned by the API.
 */
export interface Reservation {
    id: string;
    date: string;          // YYYY-MM-DD
    time: string;          // HH:MM
    party_size: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'seated' | 'completed' | 'no_show';
    occasion?: string | null;
    special_requests?: string | null;
    byob_requested?: boolean;
    corkage_fee_amount?: number;
}

/**
 * Payload sent to POST /api/store/[slug]/reservations
 */
export interface CreateReservationInput {
    /** Full name of the customer (required) */
    customerName: string;
    /** Phone number of the customer */
    customerPhone?: string;
    /** Email address of the customer */
    customerEmail?: string;
    /** Authenticated customer UUID, if logged in */
    customerId?: string;
    /** Number of guests, 1–20 (required) */
    partySize: number;
    /** Date in YYYY-MM-DD format (required) */
    date: string;
    /** Time in HH:MM format (required) */
    time: string;
    /** Optional free-text special requests */
    specialRequests?: string;
    /** Optional occasion label (e.g. "birthday", "anniversary") */
    occasion?: string;
}

/**
 * Create a public reservation for a restaurant identified by its slug.
 * Calls: POST /api/store/[slug]/reservations
 */
export async function createReservation(
    slug: string,
    data: CreateReservationInput,
): Promise<{ reservation: Reservation }> {
    return apiFetch<{ reservation: Reservation }>(
        `/api/store/${encodeURIComponent(slug)}/reservations`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
    );
}
