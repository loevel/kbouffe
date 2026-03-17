import { useEffect, useRef } from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOrders } from '@/contexts/orders-context';
import { trackOrder } from '@/lib/api';
import {
    getOrderStatusLabel,
    mapApiOrderStatus,
    TERMINAL_ORDER_STATUSES,
} from '@/lib/order-status';

const POLL_INTERVAL_MS = 20_000;

export function useOrdersRealtime() {
    const { orders, updateOrderStatus } = useOrders();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const notifiedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const activeOrders = orders.filter((o) => !TERMINAL_ORDER_STATUSES.includes(o.status));
        if (activeOrders.length === 0) return;

        const poll = async () => {
            const results = await Promise.allSettled(
                activeOrders.map(async (order) => {
                    const tracking = await trackOrder(order.id);
                    const newStatus = mapApiOrderStatus(tracking.status);
                    if (newStatus === order.status) return;

                    updateOrderStatus(order.id, newStatus);

                    const notificationKey = `${order.id}:${newStatus}`;
                    if (notifiedRef.current.has(notificationKey)) return;
                    notifiedRef.current.add(notificationKey);

                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    Alert.alert(
                        'Mise à jour de commande',
                        `${order.restaurantName} · ${getOrderStatusLabel(newStatus)}`,
                    );
                }),
            );

            results.forEach(() => {
                // Intentionally ignore individual polling failures.
            });
        };

        const startPolling = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            void poll();
            intervalRef.current = setInterval(() => {
                void poll();
            }, POLL_INTERVAL_MS);
        };

        const stopPolling = () => {
            if (!intervalRef.current) return;
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        };

        const subscription = AppState.addEventListener('change', (nextState) => {
            const wasActive = appStateRef.current === 'active';
            const isActive = nextState === 'active';
            appStateRef.current = nextState;

            if (!wasActive && isActive) startPolling();
            if (wasActive && !isActive) stopPolling();
        });

        if (appStateRef.current === 'active') startPolling();

        return () => {
            subscription.remove();
            stopPolling();
        };
    }, [orders, updateOrderStatus]);
}
