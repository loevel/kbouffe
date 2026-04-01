/**
 * Types TypeScript générés depuis le schéma Supabase.
 * Ces types correspondent exactement aux tables définies dans la migration SQL.
 *
 * Pour régénérer automatiquement :
 *   npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type OrderStatus =
    | "draft"       // Parked order — Park & Recall feature
    | "pending"
    | "accepted"
    | "preparing"
    | "ready"
    | "delivering"
    | "delivered"
    | "completed"
    | "cancelled"
    | "refunded";

export type UserRole = "merchant" | "customer";

export type PayoutStatus = "pending" | "paid" | "failed";

export type PaymentMethod = "mobile_money_mtn" | "mobile_money_orange" | "cash";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type DeliveryType = "delivery" | "pickup" | "dine_in";

export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "no_show" | "cancelled";

export type CouponType = "percent" | "fixed";
export type CouponAppliesTo = "all" | "delivery" | "pickup" | "dine_in";
export type AdCampaignPackage = "basic" | "premium" | "elite";
export type AdCampaignStatus = "pending" | "active" | "completed" | "cancelled";

// --- Tables ---

export interface Tables {
    users: {
        Row: {
            id: string;
            email: string | null;
            phone: string | null;
            full_name: string;
            role: UserRole;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id: string;
            email?: string | null;
            phone?: string | null;
            full_name: string;
            role?: UserRole;
            avatar_url?: string | null;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            id?: string;
            email?: string | null;
            phone?: string | null;
            full_name?: string;
            role?: UserRole;
            avatar_url?: string | null;
            updated_at?: string;
        };
        Relationships: [];
    };
    restaurants: {
        Row: {
            id: string;
            owner_id: string;
            name: string;
            slug: string;
            description: string | null;
            address: string | null;
            city: string | null;
            phone: string | null;
            email: string | null;
            logo_url: string | null;
            banner_url: string | null;
            primary_color: string;
            is_published: boolean;
            opening_hours: Json | null;
            delivery_zones: Json | null;
            min_order_amount: number;
            delivery_fee: number;
            has_dine_in: boolean;
            has_reservations: boolean;
            corkage_fee_amount: number | null;
            dine_in_service_fee: number | null;
            reservation_cancel_policy: "flexible" | "moderate" | "strict";
            reservation_cancel_notice_minutes: number;
            reservation_cancellation_fee_amount: number;
            order_cancel_policy: "flexible" | "moderate" | "strict";
            order_cancel_notice_minutes: number;
            order_cancellation_fee_amount: number;
            total_tables: number;
            sms_notifications_enabled: boolean;
            notification_channels: Json;
            is_sponsored: boolean;
            sponsored_until: string | null;
            sponsored_rank: number;
            meta_pixel_id: string | null;
            google_analytics_id: string | null;
            theme_layout: string;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            owner_id: string;
            name: string;
            slug: string;
            description?: string | null;
            address?: string | null;
            city?: string | null;
            phone?: string | null;
            email?: string | null;
            logo_url?: string | null;
            banner_url?: string | null;
            primary_color?: string;
            is_published?: boolean;
            opening_hours?: Json | null;
            delivery_zones?: Json | null;
            min_order_amount?: number;
            delivery_fee?: number;
            has_dine_in?: boolean;
            has_reservations?: boolean;
            corkage_fee_amount?: number | null;
            dine_in_service_fee?: number | null;
            reservation_cancel_policy?: "flexible" | "moderate" | "strict";
            reservation_cancel_notice_minutes?: number;
            reservation_cancellation_fee_amount?: number;
            order_cancel_policy?: "flexible" | "moderate" | "strict";
            order_cancel_notice_minutes?: number;
            order_cancellation_fee_amount?: number;
            total_tables?: number;
            sms_notifications_enabled?: boolean;
            notification_channels?: Json;
            is_sponsored?: boolean;
            sponsored_until?: string | null;
            sponsored_rank?: number;
            meta_pixel_id?: string | null;
            google_analytics_id?: string | null;
            theme_layout?: string;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            name?: string;
            slug?: string;
            description?: string | null;
            address?: string | null;
            city?: string | null;
            phone?: string | null;
            email?: string | null;
            logo_url?: string | null;
            banner_url?: string | null;
            primary_color?: string;
            is_published?: boolean;
            opening_hours?: Json | null;
            delivery_zones?: Json | null;
            min_order_amount?: number;
            delivery_fee?: number;
            has_dine_in?: boolean;
            has_reservations?: boolean;
            corkage_fee_amount?: number | null;
            dine_in_service_fee?: number | null;
            reservation_cancel_policy?: "flexible" | "moderate" | "strict";
            reservation_cancel_notice_minutes?: number;
            reservation_cancellation_fee_amount?: number;
            order_cancel_policy?: "flexible" | "moderate" | "strict";
            order_cancel_notice_minutes?: number;
            order_cancellation_fee_amount?: number;
            total_tables?: number;
            sms_notifications_enabled?: boolean;
            notification_channels?: Json;
            is_sponsored?: boolean;
            sponsored_until?: string | null;
            sponsored_rank?: number;
            meta_pixel_id?: string | null;
            google_analytics_id?: string | null;
            theme_layout?: string;
            updated_at?: string;
        };
        Relationships: [
            {
                foreignKeyName: "restaurants_owner_id_fkey";
                columns: ["owner_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }
        ];
    };
    categories: {
        Row: {
            id: string;
            restaurant_id: string;
            name: string;
            description: string | null;
            sort_order: number;
            is_active: boolean;
            created_at: string;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            name: string;
            description?: string | null;
            sort_order?: number;
            is_active?: boolean;
            created_at?: string;
        };
        Update: {
            name?: string;
            description?: string | null;
            sort_order?: number;
            is_active?: boolean;
        };
        Relationships: [
            {
                foreignKeyName: "categories_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            }
        ];
    };
    products: {
        Row: {
            id: string;
            restaurant_id: string;
            category_id: string | null;
            name: string;
            description: string | null;
            price: number;
            compare_at_price: number | null;
            image_url: string | null;
            is_available: boolean;
            sort_order: number;
            options: Json | null;
            is_dine_in_only: boolean;
            is_no_delivery: boolean;
            prep_time: number | null;
            allergens: Json | null;
            calories: number | null;
            is_halal: boolean | null;
            is_vegan: boolean | null;
            is_gluten_free: boolean | null;
            tags: Json | null;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            category_id?: string | null;
            name: string;
            description?: string | null;
            price: number;
            compare_at_price?: number | null;
            image_url?: string | null;
            is_available?: boolean;
            sort_order?: number;
            options?: Json | null;
            is_dine_in_only?: boolean;
            is_no_delivery?: boolean;
            dine_in_price?: number | null;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            category_id?: string | null;
            name?: string;
            description?: string | null;
            price?: number;
            compare_at_price?: number | null;
            image_url?: string | null;
            is_available?: boolean;
            sort_order?: number;
            options?: Json | null;
            is_dine_in_only?: boolean;
            is_no_delivery?: boolean;
            dine_in_price?: number | null;
            updated_at?: string;
        };
        Relationships: [
            {
                foreignKeyName: "products_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "products_category_id_fkey";
                columns: ["category_id"];
                isOneToOne: false;
                referencedRelation: "categories";
                referencedColumns: ["id"];
            }
        ];
    };
    orders: {
        Row: {
            id: string;
            restaurant_id: string;
            customer_id: string | null;
            customer_name: string;
            customer_phone: string;
            items: Json;
            subtotal: number;
            delivery_fee: number;
            total: number;
            status: OrderStatus;
            delivery_type: DeliveryType;
            delivery_address: string | null;
            payment_method: PaymentMethod;
            payment_status: PaymentStatus;
            preparation_time_minutes: number | null;
            notes: string | null;
            service_fee: number | null;
            corkage_fee: number | null;
            tip_amount: number | null;
            table_number: string | null;
            table_id: string | null;
            covers: number | null;
            external_drinks_count: number | null;
            scheduled_for: string | null;
            delivered_at: string | null;
            delivery_note: string | null;
            delivered_by: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            customer_id?: string | null;
            customer_name: string;
            customer_phone: string;
            items: Json;
            subtotal: number;
            delivery_fee?: number;
            total: number;
            status?: OrderStatus;
            delivery_type?: DeliveryType;
            delivery_address?: string | null;
            payment_method: PaymentMethod;
            payment_status?: PaymentStatus;
            preparation_time_minutes?: number | null;
            notes?: string | null;
            service_fee?: number;
            corkage_fee?: number;
            tip_amount?: number;
            table_number?: number | null;
            table_id?: string | null;
            covers?: number | null;
            external_drinks_count?: number;
            scheduled_for?: string | null;
            delivered_at?: string | null;
            delivery_note?: string | null;
            delivered_by?: string | null;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            status?: OrderStatus;
            payment_status?: PaymentStatus;
            preparation_time_minutes?: number | null;
            notes?: string | null;
            service_fee?: number;
            corkage_fee?: number;
            tip_amount?: number;
            table_number?: number | null;
            table_id?: string | null;
            covers?: number | null;
            external_drinks_count?: number;
            scheduled_for?: string | null;
            delivered_at?: string | null;
            delivery_note?: string | null;
            delivered_by?: string | null;
            updated_at?: string;
        };
        Relationships: [
            {
                foreignKeyName: "orders_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "orders_customer_id_fkey";
                columns: ["customer_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }
        ];
    };
    table_zones: {
        Row: {
            id: string;
            restaurant_id: string;
            name: string;
            type: string;
            description: string | null;
            sort_order: number;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            name: string;
            type?: string;
            description?: string | null;
            sort_order?: number;
            is_active?: boolean;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            name?: string;
            type?: string;
            description?: string | null;
            sort_order?: number;
            is_active?: boolean;
            updated_at?: string;
        };
        Relationships: [
            {
                foreignKeyName: "table_zones_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            }
        ];
    };
    restaurant_tables: {
        Row: {
            id: string;
            restaurant_id: string;
            number: number;
            zone_id: string | null;
            capacity: number;
            status: TableStatus;
            qr_code: string | null;
            is_active: boolean;
            sort_order: number;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            number: number;
            zone_id?: string | null;
            capacity?: number;
            status?: TableStatus;
            qr_code?: string | null;
            is_active?: boolean;
            sort_order?: number;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            number?: number;
            zone_id?: string | null;
            capacity?: number;
            status?: TableStatus;
            qr_code?: string | null;
            is_active?: boolean;
            sort_order?: number;
            updated_at?: string;
        };
        Relationships: [
            {
                foreignKeyName: "restaurant_tables_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "restaurant_tables_zone_id_fkey";
                columns: ["zone_id"];
                isOneToOne: false;
                referencedRelation: "table_zones";
                referencedColumns: ["id"];
            }
        ];
    };
    reservations: {
        Row: {
            id: string;
            restaurant_id: string;
            customer_id: string | null;
            customer_name: string;
            customer_phone: string | null;
            customer_email: string | null;
            table_id: string | null;
            zone_preference: string | null;
            date: string;
            time: string;
            duration: number;
            party_size: number;
            status: ReservationStatus;
            special_requests: string | null;
            deposit_amount: number | null;
            deposit_paid: boolean;
            pre_order_id: string | null;
            confirmed_at: string | null;
            seated_at: string | null;
            cancellation_reason: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            customer_id?: string | null;
            customer_name: string;
            customer_phone?: string | null;
            customer_email?: string | null;
            table_id?: string | null;
            zone_preference?: string | null;
            date: string;
            time: string;
            duration?: number;
            party_size: number;
            status?: ReservationStatus;
            special_requests?: string | null;
            deposit_amount?: number | null;
            deposit_paid?: boolean;
            pre_order_id?: string | null;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            table_id?: string | null;
            zone_preference?: string | null;
            date?: string;
            time?: string;
            duration?: number;
            party_size?: number;
            status?: ReservationStatus;
            special_requests?: string | null;
            deposit_amount?: number | null;
            deposit_paid?: boolean;
            confirmed_at?: string | null;
            seated_at?: string | null;
            cancellation_reason?: string | null;
            updated_at?: string;
        };
        Relationships: [
            {
                foreignKeyName: "reservations_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "reservations_table_id_fkey";
                columns: ["table_id"];
                isOneToOne: false;
                referencedRelation: "restaurant_tables";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "reservations_customer_id_fkey";
                columns: ["customer_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }
        ];
    };
    reviews: {
        Row: {
            id: string;
            order_id: string;
            restaurant_id: string;
            customer_id: string;
            rating: number;
            comment: string | null;
            created_at: string;
        };
        Insert: {
            id?: string;
            order_id: string;
            restaurant_id: string;
            customer_id: string;
            rating: number;
            comment?: string | null;
            created_at?: string;
        };
        Update: {
            comment?: string | null;
        };
        Relationships: [
            {
                foreignKeyName: "reviews_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "reviews_order_id_fkey";
                columns: ["order_id"];
                isOneToOne: true;
                referencedRelation: "orders";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "reviews_customer_id_fkey";
                columns: ["customer_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }
        ];
    };
    payouts: {
        Row: {
            id: string;
            restaurant_id: string;
            amount: number;
            status: PayoutStatus;
            period_start: string;
            period_end: string;
            paid_at: string | null;
            created_at: string;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            amount: number;
            status?: PayoutStatus;
            period_start: string;
            period_end: string;
            paid_at?: string | null;
            created_at?: string;
        };
        Update: {
            status?: PayoutStatus;
            paid_at?: string | null;
        };
        Relationships: [
            {
                foreignKeyName: "payouts_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            }
        ];
    };
    coupons: {
        Row: {
            id: string;
            restaurant_id: string;
            code: string;
            name: string;
            description: string | null;
            type: CouponType;
            value: number;
            min_order: number;
            max_discount: number | null;
            max_uses: number | null;
            max_uses_per_customer: number;
            current_uses: number;
            is_active: boolean;
            starts_at: string | null;
            expires_at: string | null;
            applies_to: CouponAppliesTo;
            created_at: string;
            updated_at: string | null;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            code: string;
            name: string;
            description?: string | null;
            type?: CouponType;
            value: number;
            min_order?: number;
            max_discount?: number | null;
            max_uses?: number | null;
            max_uses_per_customer?: number;
            current_uses?: number;
            is_active?: boolean;
            starts_at?: string | null;
            expires_at?: string | null;
            applies_to?: CouponAppliesTo;
            created_at?: string;
            updated_at?: string | null;
        };
        Update: {
            name?: string;
            description?: string | null;
            type?: CouponType;
            value?: number;
            min_order?: number;
            max_discount?: number | null;
            max_uses?: number | null;
            max_uses_per_customer?: number;
            is_active?: boolean;
            starts_at?: string | null;
            expires_at?: string | null;
            applies_to?: CouponAppliesTo;
            updated_at?: string | null;
        };
        Relationships: [];
    };
    ad_campaigns: {
        Row: {
            id: string;
            restaurant_id: string;
            package: AdCampaignPackage;
            status: AdCampaignStatus;
            starts_at: string;
            ends_at: string;
            budget: number;
            include_push: boolean;
            push_sent: boolean;
            push_message: string | null;
            impressions: number;
            clicks: number;
            notes: string | null;
            created_at: string;
            updated_at: string | null;
        };
        Insert: {
            id?: string;
            restaurant_id: string;
            package?: AdCampaignPackage;
            status?: AdCampaignStatus;
            starts_at: string;
            ends_at: string;
            budget?: number;
            include_push?: boolean;
            push_sent?: boolean;
            push_message?: string | null;
            impressions?: number;
            clicks?: number;
            notes?: string | null;
            created_at?: string;
            updated_at?: string | null;
        };
        Update: {
            status?: AdCampaignStatus;
            starts_at?: string;
            ends_at?: string;
            budget?: number;
            include_push?: boolean;
            push_sent?: boolean;
            push_message?: string | null;
            impressions?: number;
            clicks?: number;
            notes?: string | null;
            updated_at?: string | null;
        };
        Relationships: [
            {
                foreignKeyName: "ad_campaigns_restaurant_id_fkey";
                columns: ["restaurant_id"];
                isOneToOne: false;
                referencedRelation: "restaurants";
                referencedColumns: ["id"];
            }
        ];
    };
}

export interface Database {
    public: {
        Tables: Tables;
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            order_status: OrderStatus;
            user_role: UserRole;
            payout_status: PayoutStatus;
            payment_method: PaymentMethod;
            payment_status: PaymentStatus;
            delivery_type: DeliveryType;
            table_status: TableStatus;
            reservation_status: ReservationStatus;
        };
    };
}

// --- Types helpers raccourcis ---

export type User = Tables["users"]["Row"];
export type Restaurant = Tables["restaurants"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Product = Tables["products"]["Row"];
export type Order = Tables["orders"]["Row"];
export type Review = Tables["reviews"]["Row"];
export type Payout = Tables["payouts"]["Row"];
export type TableZone = Tables["table_zones"]["Row"];
export type RestaurantTable = Tables["restaurant_tables"]["Row"];
export type Reservation = Tables["reservations"]["Row"];

// --- Marketing types ---

export interface Coupon {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: CouponType;
    value: number;             // % or FCFA
    min_order: number;
    max_discount: number | null;
    max_uses: number | null;
    max_uses_per_customer: number;
    current_uses: number;
    is_active: boolean;
    starts_at: string | null;
    expires_at: string | null;
    applies_to: CouponAppliesTo;
    created_at: string;
    updated_at: string | null;
}

export interface AdCampaign {
    id: string;
    restaurant_id: string;
    package: AdCampaignPackage;
    status: AdCampaignStatus;
    starts_at: string;
    ends_at: string;
    budget: number;             // FCFA
    include_push: boolean;
    push_sent: boolean;
    push_message: string | null;
    impressions: number;
    clicks: number;
    notes: string | null;
    created_at: string;
    updated_at: string | null;
}

// --- Types pour les options/variantes de produits ---

export interface ProductOption {
    name: string;
    required?: boolean;
    min_selections?: number;
    max_selections?: number;
    choices: ProductOptionChoice[];
}

export interface ProductOptionChoice {
    label: string;
    extra_price: number;
}

// --- Type pour les items dans une commande ---

export interface OrderItemData {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    selectedOptions?: Record<string, string>;
    specialInstructions?: string;
}

// --- Type pour les horaires d'ouverture ---

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
