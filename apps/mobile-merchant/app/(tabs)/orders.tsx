import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

type OrderStatus = string;

interface Order {
    id: string;
    order_number: string;
    status: OrderStatus;
    total_amount: number;
    delivery_type: 'delivery' | 'pickup' | 'dine_in' | string;
    created_at: string;
    customer_name?: string;
    customer_phone?: string;
    items_count?: number;
    table_number?: string;
}

interface StatusConfig {
    label: string;
    color: string;
    bg: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    draft:            { label: 'Brouillon', color: '#475569', bg: '#e2e8f0' },
    scheduled:        { label: 'Planifiée', color: '#7c3aed', bg: '#ede9fe' },
    pending:          { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
    accepted:         { label: 'Acceptée', color: '#2563eb', bg: '#dbeafe' },
    preparing:        { label: 'Préparation', color: '#7c3aed', bg: '#ede9fe' },
    ready:            { label: 'Prête', color: '#16a34a', bg: '#dcfce7' },
    out_for_delivery: { label: 'En livraison', color: '#0891b2', bg: '#cffafe' },
    delivering:       { label: 'En livraison', color: '#0891b2', bg: '#cffafe' },
    delivered:        { label: 'Livrée', color: '#64748b', bg: '#f1f5f9' },
    completed:        { label: 'Terminée', color: '#64748b', bg: '#f1f5f9' },
    cancelled:        { label: 'Annulée', color: '#dc2626', bg: '#fee2e2' },
    refunded:         { label: 'Remboursée', color: '#b45309', bg: '#ffedd5' },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = { label: 'Statut inconnu', color: '#64748b', bg: '#f1f5f9' };

const TERMINAL_STATUSES = new Set<OrderStatus>(['delivered', 'completed', 'cancelled', 'refunded']);

const STATUS_FALLBACKS: Record<string, string[]> = {
    out_for_delivery: ['delivering'],
    delivering: ['out_for_delivery'],
    delivered: ['completed'],
    completed: ['delivered'],
};

function asOrderNumber(row: Record<string, unknown>) {
    const value = row.order_number ?? row.invoice_number;
    if (typeof value === 'string' && value.trim().length > 0) return value;
    const id = row.id;
    return typeof id === 'string' ? id.slice(-6).toUpperCase() : '—';
}

function asAmount(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function mapOrderRow(row: Record<string, unknown>): Order {
    return {
        id: typeof row.id === 'string' ? row.id : asOrderNumber(row),
        order_number: asOrderNumber(row),
        status: typeof row.status === 'string' ? row.status : 'pending',
        total_amount: asAmount(row.total_amount ?? row.total),
        delivery_type: typeof row.delivery_type === 'string' ? row.delivery_type : 'delivery',
        created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
        customer_name: typeof row.customer_name === 'string' ? row.customer_name : undefined,
        customer_phone: typeof row.customer_phone === 'string' ? row.customer_phone : undefined,
        table_number: typeof row.table_number === 'string'
            ? row.table_number
            : typeof row.table_number === 'number'
                ? String(row.table_number)
                : undefined,
    };
}

function getStatusConfig(status: OrderStatus) {
    return STATUS_CONFIG[status] ?? DEFAULT_STATUS_CONFIG;
}

function getNextStatus(order: Order): OrderStatus | null {
    switch (order.status) {
        case 'pending':
            return 'accepted';
        case 'accepted':
            return 'preparing';
        case 'preparing':
            return 'ready';
        case 'ready':
            return order.delivery_type === 'delivery' ? 'out_for_delivery' : 'delivered';
        case 'out_for_delivery':
        case 'delivering':
            return 'delivered';
        default:
            return null;
    }
}

function getNextLabel(order: Order): string | null {
    switch (order.status) {
        case 'pending':
            return 'Accepter';
        case 'accepted':
            return 'En préparation';
        case 'preparing':
            return 'Marquer prête';
        case 'ready':
            return order.delivery_type === 'delivery' ? 'En livraison' : 'Marquer livrée';
        case 'out_for_delivery':
        case 'delivering':
            return 'Marquer livrée';
        default:
            return null;
    }
}

export default function OrdersScreen() {
    const { profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'all'>('active');

    const fetchOrders = useCallback(async () => {
        if (!profile?.restaurantId) {
            setOrders([]);
            return;
        }

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', profile.restaurantId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        setOrders((data ?? []).map((row) => mapOrderRow(row as Record<string, unknown>)));
        setErrorMessage(null);
    }, [profile?.restaurantId]);

    useEffect(() => {
        let mounted = true;

        setLoading(true);
        fetchOrders()
            .catch((error) => {
                if (!mounted) return;
                setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les commandes');
                setOrders([]);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
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
                fetchOrders().catch((error) => {
                    setErrorMessage(error instanceof Error ? error.message : 'Impossible de synchroniser les commandes');
                });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile?.restaurantId, fetchOrders]);

    const advanceStatus = async (order: Order) => {
        if (!profile?.restaurantId) return;
        const nextStatus = getNextStatus(order);
        const nextLabel = getNextLabel(order);
        if (!nextStatus || !nextLabel) return;

        Alert.alert(
            `Confirmer`,
            `Passer la commande #${order.order_number} à "${nextLabel}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: nextLabel,
                    onPress: async () => {
                        const candidates = [nextStatus, ...(STATUS_FALLBACKS[nextStatus] ?? [])];
                        let appliedStatus: string | null = null;
                        let lastError: string | null = null;

                        for (const candidate of candidates) {
                            const { error } = await supabase
                                .from('orders')
                                .update({ status: candidate })
                                .eq('id', order.id)
                                .eq('restaurant_id', profile.restaurantId);

                            if (!error) {
                                appliedStatus = candidate;
                                break;
                            }

                            lastError = error.message;
                        }

                        if (!appliedStatus) {
                            Alert.alert('Erreur', lastError ?? 'Impossible de mettre à jour la commande');
                            return;
                        }

                        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: appliedStatus! } : o)));
                    },
                },
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchOrders();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Impossible de rafraîchir les commandes');
        } finally {
            setRefreshing(false);
        }
    };

    const filteredOrders = useMemo(
        () => (filter === 'active' ? orders.filter((order) => !TERMINAL_STATUSES.has(order.status)) : orders),
        [filter, orders]
    );

    const s = styles(theme);

    const renderOrder = ({ item }: { item: Order }) => {
        const cfg = getStatusConfig(item.status);
        const nextLabel = getNextLabel(item);
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
                        {deliveryIcons[item.delivery_type] ?? '📦'} {item.delivery_type === 'dine_in' ? `Table ${item.table_number ?? '?'}` : item.delivery_type === 'pickup' ? 'À emporter' : 'Livraison'}
                    </Text>
                </View>

                <View style={s.cardFooter}>
                    <Text style={s.amount}>{item.total_amount?.toLocaleString()} FCFA</Text>
                    {nextLabel && (
                        <TouchableOpacity
                            style={[s.advanceBtn, { backgroundColor: cfg.color }]}
                            onPress={() => advanceStatus(item)}
                        >
                            <Text style={s.advanceBtnText}>{nextLabel}</Text>
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
                    data={filteredOrders}
                    keyExtractor={(o) => o.id}
                    renderItem={renderOrder}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>📋</Text>
                            <Text style={[s.emptyText, { color: theme.textSecondary }]}>
                                {errorMessage ?? (filter === 'active' ? 'Aucune commande en cours' : 'Aucune commande')}
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
