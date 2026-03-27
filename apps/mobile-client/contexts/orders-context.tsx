import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { getAccountOrders } from '@/lib/api';
import { useAuth } from './auth-context';

// ── Types ────────────────────────────────────────────────────────────────────
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

interface OrdersContextType {
    orders: StoredOrder[];
    loading: boolean;
    activeOrderCount: number;
    refreshOrders: () => Promise<void>;
    updateOrderStatus: (id: string, status: MobileOrderStatus) => void;
    getOrderById: (id: string) => StoredOrder | undefined;
}

// ── Context ───────────────────────────────────────────────────────────────────
const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<StoredOrder[]>([]);
    const [loading, setLoading] = useState(false);

    const mapDeliveryType = (value: string | null | undefined): StoredOrder['deliveryType'] => {
        if (value === 'pickup' || value === 'dine_in') return value;
        return 'delivery';
    };

    const mapOrderStatus = (value: string | null | undefined): MobileOrderStatus => {
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
    };

    const refreshOrders = useCallback(async () => {
        if (!isAuthenticated) {
            setOrders([]);
            return;
        }
        setLoading(true);
        try {
            const data = await getAccountOrders();
            const mapped: StoredOrder[] = data.map(o => ({
                id: o.id,
                restaurantId: o.restaurant_id ?? '',
                restaurantName: o.restaurant_name ?? 'Restaurant',
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
                createdAt: o.created_at
            }));
            setOrders(mapped);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const updateOrderStatus = useCallback((id: string, status: MobileOrderStatus) => {
        setOrders((current) => current.map((order) => (
            order.id === id ? { ...order, status } : order
        )));
    }, []);

    useEffect(() => {
        void refreshOrders();
    }, [refreshOrders]);

    const getOrderById = useCallback(
        (id: string) => orders.find((o) => o.id === id),
        [orders],
    );

    const activeOrderCount = useMemo(
        () => orders.filter((order) => !['completed', 'delivered', 'cancelled'].includes(order.status)).length,
        [orders],
    );

    const value = useMemo(
        () => ({ orders, loading, activeOrderCount, refreshOrders, updateOrderStatus, getOrderById }),
        [orders, loading, activeOrderCount, refreshOrders, updateOrderStatus, getOrderById],
    );

    return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
    const ctx = useContext(OrdersContext);
    if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
    return ctx;
}
