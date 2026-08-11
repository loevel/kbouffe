import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Button, EmptyState, ErrorBanner, LoadingState, SearchBar, StatusBadge, useToast } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    NOT_ACTIONABLE_STATUSES,
    STATUS_FALLBACKS,
    TERMINAL_STATUSES,
    getDeliveryMeta,
    getStatusMeta,
} from '@/lib/order-status';
import type { OrderRow } from '@/lib/types';

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

function mapOrderRow(row: Record<string, unknown>): OrderRow {
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

function getNextStatus(order: OrderRow): string | null {
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

function getNextLabel(order: OrderRow): string | null {
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
    const toast = useToast();
    const scheme = useColorScheme();
    const router = useRouter();
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'all'>('active');
    const [query, setQuery] = useState('');

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

    const advanceStatus = async (order: OrderRow) => {
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
                            toast.error(lastError ?? 'Impossible de mettre à jour la commande');
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

    const onRetry = async () => {
        setLoading(true);
        try {
            await fetchOrders();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les commandes');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        const byStatus = filter === 'active'
            ? orders.filter(
                  (order) => !TERMINAL_STATUSES.has(order.status) && !NOT_ACTIONABLE_STATUSES.has(order.status)
              )
            : orders;

        const needle = query.trim().toLowerCase();
        if (!needle) return byStatus;

        // Recherche sur ce qui identifie une commande au comptoir : son numéro,
        // le nom du client, son téléphone, et le numéro de table en salle.
        return byStatus.filter((order) =>
            [order.order_number, order.customer_name, order.customer_phone, order.table_number]
                .some((field) => field?.toLowerCase().includes(needle))
        );
    }, [filter, orders, query]);

    const s = styles(theme);

    const renderOrder = ({ item }: { item: OrderRow }) => {
        const statusMeta = getStatusMeta(item.status, scheme);
        const delivery = getDeliveryMeta(item.delivery_type);
        const nextLabel = getNextLabel(item);
        const time = new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        // `?? '?'` ne rattrapait pas une chaîne vide : les commandes sur place
        // sans numéro affichaient « Table » suivi d'un espace orphelin.
        const tableNumber = item.table_number?.trim();
        const deliveryLabel = item.delivery_type === 'dine_in'
            ? (tableNumber ? `Table ${tableNumber}` : delivery.label)
            : delivery.label;

        return (
            <TouchableOpacity
                style={s.card}
                onPress={() => router.push(`/order/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Commande ${item.order_number}, ${statusMeta.label}, ${item.total_amount?.toLocaleString()} FCFA`}
            >
                <View style={s.cardHeader}>
                    <View style={s.orderMeta}>
                        <Text style={s.orderNum}>#{item.order_number}</Text>
                        <Text style={s.orderTime}>{time}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                </View>

                <View style={s.cardBody}>
                    <Text style={s.customerName}>{item.customer_name ?? 'Client'}</Text>
                    <View style={s.deliveryRow}>
                        <Ionicons name={delivery.icon} size={13} color={theme.textSecondary} />
                        <Text style={s.deliveryType}>{deliveryLabel}</Text>
                    </View>
                </View>

                <View style={s.cardFooter}>
                    <Text style={s.amount}>{item.total_amount?.toLocaleString()} FCFA</Text>
                    {nextLabel && (
                        <Button
                            label={nextLabel}
                            size="small"
                            onPress={() => advanceStatus(item)}
                            style={{ backgroundColor: statusMeta.color, borderColor: statusMeta.color }}
                            accessibilityLabel={`${nextLabel} — commande ${item.order_number}`}
                        />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[s.container]} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <View style={s.titleRow}>
                    <Text style={s.title}>Commandes</Text>
                    <Button
                        label="Cuisine"
                        icon="flame-outline"
                        variant="ghost"
                        size="small"
                        onPress={() => router.push('/kitchen')}
                        accessibilityLabel="Ouvrir l'écran cuisine"
                    />
                </View>
                <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="N° de commande, client, téléphone…"
                    resultCount={filteredOrders.length}
                    style={s.search}
                />

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

            {/* Le bandeau coiffe la liste : un échec de synchronisation temps réel
                ne doit pas effacer les commandes déjà chargées. */}
            {errorMessage && <ErrorBanner message={errorMessage} onRetry={onRetry} style={s.banner} />}

            {loading ? (
                <LoadingState label="Chargement des commandes" />
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(o) => o.id}
                    renderItem={renderOrder}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    ListEmptyComponent={
                        errorMessage ? null : (
                            query.trim() ? (
                                <EmptyState
                                    icon="search-outline"
                                    title="Aucun résultat"
                                    message={`Aucune commande ne correspond à « ${query.trim()} ».`}
                                    action={{ label: 'Effacer la recherche', onPress: () => setQuery('') }}
                                />
                            ) : (
                                <EmptyState
                                    icon="receipt-outline"
                                    title={filter === 'active' ? 'Aucune commande en cours' : 'Aucune commande'}
                                    message={
                                        filter === 'active'
                                            ? 'Les nouvelles commandes arrivent ici en temps réel.'
                                            : 'Aucune commande enregistrée pour le moment.'
                                    }
                                />
                            )
                        )
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    title: { fontSize: 22, fontWeight: '700', color: theme.text },
    banner: { marginHorizontal: 12, marginTop: 12 },
    search: { marginBottom: 10 },
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
    cardBody: { marginBottom: 10 },
    customerName: { fontSize: 14, fontWeight: '600', color: theme.text },
    deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    deliveryType: { fontSize: 12, color: theme.textSecondary },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 15, fontWeight: '700', color: theme.text },
});
