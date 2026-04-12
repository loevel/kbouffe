import { create } from 'zustand';
import { getAccountOrders } from '@/lib/api';

export type MobileOrderStatus =
    | 'pending'
    | 'confirmed'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'delivering'
    | 'delivered'
    | 'completed'
    | 'cancelled';

export interface StoredOrder {
    id: string;
    restaurantId: string;
    restaurantName: string;
    restaurantLat?: number | null;
    restaurantLng?: number | null;
    status: MobileOrderStatus;
    deliveryType: 'delivery' | 'pickup' | 'dine_in';
    items: { productId: string; name: string; price: number; quantity: number }[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string | null;
    notes?: string | null;
    createdAt: string;
}

interface OrdersState {
    orders: StoredOrder[];
    loading: boolean;
    refreshOrders: (isAuthenticated: boolean) => Promise<void>;
    updateOrderStatus: (id: string, status: MobileOrderStatus) => void;
    getOrderById: (id: string) => StoredOrder | undefined;
    activeOrderCount: () => number;
}

function mapDeliveryType(value: string | null | undefined): StoredOrder['deliveryType'] {
    if (value === 'pickup' || value === 'dine_in') return value;
    return 'delivery';
}

function mapOrderStatus(value: string | null | undefined): MobileOrderStatus {
    switch (value) {
        case 'confirmed':
        case 'accepted':
        case 'preparing':
        case 'ready':
        case 'delivering':
        case 'delivered':
        case 'completed':
        case 'cancelled':
            return value;
        default:
            return 'pending';
    }
}

export const useOrdersStore = create<OrdersState>()((set, get) => ({
    orders: [],
    loading: false,

    refreshOrders: async (isAuthenticated: boolean) => {
        if (!isAuthenticated) {
            set({ orders: [] });
            return;
        }
        set({ loading: true });
        try {
            const data = await getAccountOrders();
            const mapped: StoredOrder[] = data.map((o) => ({
                id: o.id,
                restaurantId: o.restaurant_id ?? '',
                restaurantName: o.restaurant_name ?? 'Restaurant',
                restaurantLat: o.restaurant_lat ?? null,
                restaurantLng: o.restaurant_lng ?? null,
                status: mapOrderStatus(o.status),
                deliveryType: mapDeliveryType(o.delivery_type),
                items: o.items,
                subtotal: o.subtotal,
                deliveryFee: o.delivery_fee,
                total: o.total,
                customerName: o.customer_name,
                customerPhone: o.customer_phone,
                deliveryAddress: o.delivery_address,
                notes: o.notes,
                createdAt: o.created_at,
            }));
            set({ orders: mapped });
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            set({ loading: false });
        }
    },

    updateOrderStatus: (id, status) => {
        set((state) => ({
            orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));
    },

    getOrderById: (id) => get().orders.find((o) => o.id === id),

    activeOrderCount: () =>
        get().orders.filter((o) => !['completed', 'delivered', 'cancelled'].includes(o.status)).length,
}));
