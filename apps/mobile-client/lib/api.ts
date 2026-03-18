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
    created_at: string;
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
}

export async function placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResponse> {
    const data = await apiFetch<{ success: boolean; orderId?: string; id?: string; order?: { id: string } }>(
        '/api/store/order',
        { method: 'POST', body: JSON.stringify(params) }
    );
    const orderId = data.orderId ?? data.id ?? data.order?.id ?? '';
    return { success: data.success ?? true, orderId };
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
}

export async function validateCoupon(params: ValidateCouponParams): Promise<{ discount: number }> {
    return apiFetch<{ discount: number }>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify(params),
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

export async function postReferralReward(amount: number): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/account/referral/reward', {
        method: 'POST',
        body: JSON.stringify({ amount }),
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

// ── Account Orders ───────────────────────────────────────────────────────────

export async function getAccountOrders(): Promise<OrderTracking[]> {
    const data = await apiFetch<{ orders: OrderTracking[] }>('/api/account/orders');
    return data.orders || [];
}

export { phoneToAuthEmail };
