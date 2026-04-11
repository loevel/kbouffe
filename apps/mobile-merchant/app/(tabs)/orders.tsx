import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface Order {
    id: string;
    order_number: string;
    status: OrderStatus;
    total_amount: number;
    delivery_type: 'delivery' | 'pickup' | 'dine_in';
    created_at: string;
    customer_name?: string;
    customer_phone?: string;
    items_count?: number;
    table_number?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; next?: OrderStatus; nextLabel?: string }> = {
    pending:    { label: 'En attente',   color: '#d97706', bg: '#fef3c7', next: 'accepted',   nextLabel: 'Accepter' },
    accepted:   { label: 'Accepté',     color: '#2563eb', bg: '#dbeafe', next: 'preparing',  nextLabel: 'En préparation' },
    preparing:  { label: 'Préparation', color: '#7c3aed', bg: '#ede9fe', next: 'ready',      nextLabel: 'Prêt' },
    ready:      { label: 'Prêt',        color: '#16a34a', bg: '#dcfce7', next: 'delivering',  nextLabel: 'En livraison' },
    delivering: { label: 'Livraison',   color: '#0891b2', bg: '#cffafe' },
    delivered:  { label: 'Livré',       color: '#64748b', bg: '#f1f5f9' },
    cancelled:  { label: 'Annulé',      color: '#dc2626', bg: '#fee2e2' },
};

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'delivering'];

export default function OrdersScreen() {
    const { profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'active' | 'all'>('active');

    const fetchOrders = useCallback(async () => {
        if (!profile?.restaurantId) return;
        const query = supabase
            .from('orders')
            .select(`
                id, order_number, status, total_amount, delivery_type,
                created_at, table_number,
                users!customer_id(name, phone)
            `)
            .eq('restaurant_id', profile.restaurantId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (filter === 'active') query.in('status', ACTIVE_STATUSES);

        const { data } = await query;
        setOrders(
            (data ?? []).map((o: any) => ({
                ...o,
                customer_name: o.users?.name,
                customer_phone: o.users?.phone,
            }))
        );
    }, [profile?.restaurantId, filter]);

    useEffect(() => {
        fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders]);

    // Supabase Realtime subscription
    useEffect(() => {
        if (!profile?.restaurantId) return;
        const channel = supabase
            .channel(`merchant-orders-${profile.restaurantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `restaurant_id=eq.${profile.restaurantId}`,
            }, () => {
                fetchOrders();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile?.restaurantId, fetchOrders]);

    const advanceStatus = async (order: Order) => {
        const cfg = STATUS_CONFIG[order.status];
        if (!cfg.next) return;
        Alert.alert(
            `Confirmer`,
            `Passer la commande #${order.order_number} à "${cfg.nextLabel}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: cfg.nextLabel ?? 'Confirmer',
                    onPress: async () => {
                        await supabase.from('orders').update({ status: cfg.next }).eq('id', order.id);
                        // Optimistic update
                        setOrders((prev) =>
                            prev.map((o) => o.id === order.id ? { ...o, status: cfg.next! } : o)
                        );
                    },
                },
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const s = styles(theme);

    const renderOrder = ({ item }: { item: Order }) => {
        const cfg = STATUS_CONFIG[item.status];
        const time = new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const deliveryIcons: Record<string, string> = { delivery: '🛵', pickup: '🏃', dine_in: '🍽️' };

        return (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/order/${item.id}`)}>
                <View style={s.cardHeader}>
                    <View style={s.orderMeta}>
                        <Text style={s.orderNum}>#{item.order_number}</Text>
                        <Text style={s.orderTime}>{time}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                <View style={s.cardBody}>
                    <Text style={s.customerName}>{item.customer_name ?? 'Client'}</Text>
                    <Text style={s.deliveryType}>
                        {deliveryIcons[item.delivery_type]} {item.delivery_type === 'dine_in' ? `Table ${item.table_number ?? '?'}` : item.delivery_type === 'pickup' ? 'À emporter' : 'Livraison'}
                    </Text>
                </View>

                <View style={s.cardFooter}>
                    <Text style={s.amount}>{item.total_amount?.toLocaleString()} FCFA</Text>
                    {cfg.next && (
                        <TouchableOpacity
                            style={[s.advanceBtn, { backgroundColor: cfg.color }]}
                            onPress={() => advanceStatus(item)}
                        >
                            <Text style={s.advanceBtnText}>{cfg.nextLabel}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[s.container]} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <Text style={s.title}>Commandes</Text>
                <View style={s.filterRow}>
                    {(['active', 'all'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[s.filterBtn, filter === f && s.filterBtnActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[s.filterBtnText, filter === f && s.filterBtnTextActive]}>
                                {f === 'active' ? 'En cours' : 'Toutes'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(o) => o.id}
                    renderItem={renderOrder}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>📋</Text>
                            <Text style={[s.emptyText, { color: theme.textSecondary }]}>
                                {filter === 'active' ? 'Aucune commande en cours' : 'Aucune commande'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 10 },
    filterRow: { flexDirection: 'row', gap: 8 },
    filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    filterBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    filterBtnText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
    filterBtnTextActive: { color: '#fff' },
    list: { padding: 12, gap: 10 },
    card: { backgroundColor: theme.surface, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderNum: { fontSize: 15, fontWeight: '700', color: theme.text },
    orderTime: { fontSize: 12, color: theme.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardBody: { marginBottom: 10 },
    customerName: { fontSize: 14, fontWeight: '600', color: theme.text },
    deliveryType: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 15, fontWeight: '700', color: theme.text },
    advanceBtn: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10 },
    advanceBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15 },
});
