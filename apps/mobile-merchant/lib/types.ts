// Supabase row types shared across mobile-merchant screens

export interface ProductRow {
    id: string;
    name: string;
    description: string | null;
    price: number;
    is_available: boolean;
    image_url: string | null;
    category_id: string | null;
}

export interface CategoryRow {
    id: string;
    name: string;
    sort_order?: number;
}

export interface OrderRow {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    delivery_type: string;
    created_at: string;
    customer_name?: string;
    customer_phone?: string;
    items_count?: number;
    table_number?: string;
}
