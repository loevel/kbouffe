/**
 * contexts/orders-context.tsx
 * Stores the user's recent orders persistently in AsyncStorage.
 * Replaces MOCK_ORDERS for the orders tab and tracking screen.
 */
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    getAccountOrders,
    OrderTracking as ApiOrder
} from '@/lib/api';
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
    status: MobileOrderStatus;
    deliveryType: 'delivery' | 'pickup' | 'dine_in';
    items: Array<{ productId: string; name: string; price: number; quantity: number }>;
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
    refreshOrders: () => Promise<void>;
    getOrderById: (id: string) => StoredOrder | undefined;
}

// ── Context ───────────────────────────────────────────────────────────────────
const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<StoredOrder[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshOrders = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const data = await getAccountOrders();
            const mapped: StoredOrder[] = data.map(o => ({
                id: o.id,
                restaurantId: '', // Would need populating or separate fetch if needed
                status: o.status as MobileOrderStatus,
                deliveryType: o.delivery_type as any,
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

    useEffect(() => {
        refreshOrders();
    }, [refreshOrders]);

    const getOrderById = useCallback(
        (id: string) => orders.find((o) => o.id === id),
        [orders],
    );

    const value = useMemo(
        () => ({ orders, loading, refreshOrders, getOrderById }),
        [orders, loading, refreshOrders, getOrderById],
    );

    return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
    const ctx = useContext(OrdersContext);
    if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
    return ctx;
}
