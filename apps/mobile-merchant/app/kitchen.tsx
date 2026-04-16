import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface Order {
    id: string;
    orderId: string;
    customerName: string;
    items: Array<{ name: string; quantity: number }>;
    totalAmount: number;
    status: string;
    createdAt: string;
}

interface Column {
    title: string;
    status: string;
    color: string;
}

const COLUMNS: Column[] = [
    { title: 'Acceptée', status: 'accepted', color: '#3b82f6' },
    { title: 'En préparation', status: 'preparing', color: '#f59e0b' },
    { title: 'Prête', status: 'ready', color: '#10b981' },
    { title: 'En livraison', status: 'delivering', color: '#8b5cf6' },
];

function formatTime(timestamp: string) {
    const deltaMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.max(0, Math.floor(deltaMs / 60_000));
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
}

export default function KitchenScreen() {
    const { session, profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadOrders = useCallback(async () => {
        if (!session || !profile?.restaurantId) {
            setLoading(false);
            return;
        }

        try {
            const { data: ordersData, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    customer_name,
                    total_amount,
                    status,
                    created_at,
                    order_items(
                        product_name,
                        quantity
                    )
                `)
                .eq('restaurant_id', profile.restaurantId)
                .in('status', ['accepted', 'preparing', 'ready', 'delivering'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            const processed: Order[] = (ordersData || []).map((o: any) => ({
                id: o.id,
                orderId: o.order_number || o.id.slice(-6).toUpperCase(),
                customerName: o.customer_name || 'Client',
                items: (o.order_items || []).map((item: any) => ({
                    name: item.product_name,
                    quantity: item.quantity,
                })),
                totalAmount: o.total_amount,
                status: o.status,
                createdAt: o.created_at,
            }));

            setOrders(processed);
        } catch (error) {
            console.error('Erreur lors du chargement des commandes KDS:', error);
        } finally {
            setLoading(false);
        }
    }, [session, profile?.restaurantId]);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 10_000);
        return () => clearInterval(interval);
    }, [loadOrders]);

    // Setup Realtime subscription
    useEffect(() => {
        if (!profile?.restaurantId) return;

        const channel = supabase
            .channel(`orders:${profile.restaurantId}:kds`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${profile.restaurantId}`,
                },
                () => {
                    loadOrders();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [profile?.restaurantId, loadOrders]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const getOrdersForStatus = (status: string) =>
        orders.filter((o) => o.status === status);

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    const renderOrderCard = (order: Order) => (
        <TouchableOpacity
            key={order.id}
            style={s.orderCard}
            onPress={() => router.push(`/order/${order.id}`)}
        >
            <View style={s.cardHeader}>
                <Text style={s.orderNumber}>#{order.orderId}</Text>
                <Text style={s.time}>{formatTime(order.createdAt)}</Text>
            </View>

            <Text style={s.customerName}>{order.customerName}</Text>

            <View style={s.itemsList}>
                {order.items.slice(0, 2).map((item, idx) => (
                    <Text key={idx} style={s.item}>
                        × {item.quantity} {item.name}
                    </Text>
                ))}
                {order.items.length > 2 && (
                    <Text style={s.moreItems}>+ {order.items.length - 2} articles</Text>
                )}
            </View>

            <Text style={s.amount}>{order.totalAmount.toLocaleString()} FCFA</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Écran cuisine</Text>
                <TouchableOpacity onPress={onRefresh} style={s.backButton}>
                    <Ionicons name="refresh" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator
                scrollEventThrottle={16}
                contentContainerStyle={s.scrollContent}
            >
                {COLUMNS.map((column) => {
                    const columnOrders = getOrdersForStatus(column.status);

                    return (
                        <View key={column.status} style={s.column}>
                            <View style={[s.columnHeader, { backgroundColor: `${column.color}20`, borderTopColor: column.color }]}>
                                <View
                                    style={[
                                        s.statusDot,
                                        { backgroundColor: column.color },
                                    ]}
                                />
                                <Text style={s.columnTitle}>{column.title}</Text>
                                <View style={s.badge}>
                                    <Text style={s.badgeText}>{columnOrders.length}</Text>
                                </View>
                            </View>

                            <FlatList
                                data={columnOrders}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => renderOrderCard(item)}
                                scrollEnabled={false}
                                contentContainerStyle={s.columnContent}
                                ListEmptyComponent={
                                    <View style={s.emptyColumn}>
                                        <Ionicons name="checkmark-circle-outline" size={32} color={`${column.color}40`} />
                                        <Text style={[s.emptyText, { color: `${column.color}80` }]}>Vide</Text>
                                    </View>
                                }
                            />
                        </View>
                    );
                })}
            </ScrollView>

            {orders.length === 0 && (
                <View style={s.emptyKds}>
                    <Ionicons name="checkmark-circle" size={48} color={theme.success} />
                    <Text style={s.emptyKdsText}>Aucune commande en cours</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        backButton: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: { fontSize: 17, fontWeight: '700', color: theme.text, flex: 1, textAlign: 'center' },
        scrollContent: {
            padding: 8,
            gap: 8,
        },
        column: {
            width: 280,
            backgroundColor: theme.surface,
            borderRadius: 12,
            overflow: 'hidden,
            borderWidth: 1,
            borderColor: theme.border,
        },
        columnHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderTopWidth: 3,
        },
        statusDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        columnTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.text,
            flex: 1,
        },
        badge: {
            backgroundColor: theme.primary,
            borderRadius: 12,
            minWidth: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        badgeText: {
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
        },
        columnContent: {
            padding: 8,
            gap: 8,
        },
        orderCard: {
            backgroundColor: theme.background,
            borderRadius: 10,
            padding: 10,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 6,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        orderNumber: {
            fontSize: 13,
            fontWeight: '700',
            color: theme.text,
        },
        time: {
            fontSize: 11,
            color: theme.textSecondary,
        },
        customerName: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.text,
        },
        itemsList: {
            gap: 3,
        },
        item: {
            fontSize: 11,
            color: theme.textSecondary,
        },
        moreItems: {
            fontSize: 10,
            color: theme.textSecondary,
            fontStyle: 'italic',
        },
        amount: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.primary,
        },
        emptyColumn: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 40,
            gap: 8,
        },
        emptyText: {
            fontSize: 12,
            fontWeight: '600',
        },
        emptyKds: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
        },
        emptyKdsText: {
            fontSize: 14,
            color: theme.textSecondary,
        },
    });
