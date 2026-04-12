/**
 * orders-context — shim over the Zustand orders store.
 *
 * All consumers (useOrders / OrdersProvider) keep working unchanged.
 * State now lives in stores/orders-store.ts.
 */
import { useEffect, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useOrdersStore } from '@/stores/orders-store';

export type { MobileOrderStatus, StoredOrder } from '@/stores/orders-store';

/** Initialises the store on mount and reloads when auth changes. */
export function OrdersProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const refreshOrders = useOrdersStore((s) => s.refreshOrders);

    useEffect(() => {
        void refreshOrders(isAuthenticated);
    }, [isAuthenticated, refreshOrders]);

    return <>{children}</>;
}

/** Drop-in replacement — same shape as the old context value. */
export function useOrders() {
    const store = useOrdersStore();
    const { isAuthenticated } = useAuth();

    return {
        orders:           store.orders,
        loading:          store.loading,
        activeOrderCount: store.activeOrderCount(),
        refreshOrders:    () => store.refreshOrders(isAuthenticated),
        updateOrderStatus: store.updateOrderStatus,
        getOrderById:     store.getOrderById,
    };
}
