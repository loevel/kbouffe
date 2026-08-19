import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOrders } from '@/contexts/orders-context';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import {
    getOrderStatusLabel,
    mapApiOrderStatus,
    TERMINAL_ORDER_STATUSES,
} from '@/lib/order-status';

export function useOrdersRealtime() {
    const { orders, updateOrderStatus, refreshOrders } = useOrders();
    const { isAuthenticated, user } = useAuth();
    const notifiedRef = useRef<Set<string>>(new Set());
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Les commandes sont lues dans le callback, jamais surveillées par l'effet :
    // les garder en dépendance faisait fermer puis rouvrir le canal à chaque mise
    // à jour reçue — y compris celle que le callback venait d'appliquer. Le suivi
    // en direct pouvait donc rater le changement de statut suivant, pendant la
    // reconnexion, alors que c'est toute la raison d'être de l'écran.
    const ordersRef = useRef(orders);
    ordersRef.current = orders;

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        // Subscribe to realtime changes on orders table for this customer
        const channel = supabase
            .channel(`orders:customer:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `customer_id=eq.${user.id}`,
                },
                async (payload) => {
                    const updated = payload.new as { id: string; status: string; restaurant_name?: string };
                    const newStatus = mapApiOrderStatus(updated.status);

                    // Find the matching order in state
                    const order = ordersRef.current.find((o) => o.id === updated.id);
                    if (order && newStatus === order.status) return;

                    updateOrderStatus(updated.id, newStatus);

                    const notificationKey = `${updated.id}:${newStatus}`;
                    if (notifiedRef.current.has(notificationKey)) return;
                    notifiedRef.current.add(notificationKey);

                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    Alert.alert(
                        'Mise à jour de commande',
                        `${order?.restaurantName ?? updated.restaurant_name ?? 'Restaurant'} · ${getOrderStatusLabel(newStatus)}`,
                    );

                    // If order moves to terminal status, do a full refresh to sync state
                    if (TERMINAL_ORDER_STATUSES.includes(newStatus)) {
                        void refreshOrders();
                    }
                },
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            void supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [isAuthenticated, user?.id, updateOrderStatus, refreshOrders]);
}
