import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { authApiFetch } from '@/lib/api';
import { formatDate, formatFCFA } from '@/lib/format';
import type { SupplierDeliveryStatus, SupplierOrder } from '@/lib/types';

const FILTERS: { key: 'all' | SupplierDeliveryStatus; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'confirmed', label: 'Confirmées' },
    { key: 'delivered', label: 'Livrées' },
    { key: 'disputed', label: 'Litiges' },
    { key: 'cancelled', label: 'Annulées' },
];

const STATUS_LABELS: Record<SupplierDeliveryStatus, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    delivered: 'Livrée',
    disputed: 'En litige',
    cancelled: 'Annulée',
};

export default function OrdersScreen() {
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [filter, setFilter] = useState<'all' | SupplierDeliveryStatus>('all');

    const loadOrders = useCallback(async () => {
        const response = await authApiFetch('/api/marketplace/suppliers/me/orders');
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error ?? 'Impossible de charger les commandes');
        }

        setOrders(payload.orders ?? []);
    }, []);

    useEffect(() => {
        loadOrders()
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, [loadOrders]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadOrders();
        } finally {
            setRefreshing(false);
        }
    };

    const changeStatus = async (order: SupplierOrder) => {
        const next = order.delivery_status === 'pending' ? 'confirmed' : order.delivery_status === 'confirmed' ? 'delivered' : null;
        if (!next) return;

        const response = await authApiFetch(`/api/marketplace/suppliers/me/orders/${order.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ delivery_status: next }),
        });
        const payload = await response.json();

        if (!response.ok) {
            Alert.alert('Erreur', payload.error ?? 'Impossible de mettre à jour la commande');
            return;
        }

        setOrders((current) => current.map((item) => (item.id === order.id ? payload.order : item)));
    };

    const filteredOrders = filter === 'all' ? orders : orders.filter((order) => order.delivery_status === filter);
    const styles = createStyles(theme);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <Text style={styles.title}>Commandes fournisseur</Text>
                <View style={styles.filters}>
                    {FILTERS.map((item) => (
                        <Pressable key={item.key} style={[styles.filterChip, filter === item.key && styles.filterChipActive]} onPress={() => setFilter(item.key)}>
                            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
                        </Pressable>
                    ))}
                </View>

                {filteredOrders.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Aucune commande</Text>
                        <Text style={styles.emptyText}>Les nouvelles commandes d’approvisionnement s’afficheront ici.</Text>
                    </View>
                ) : (
                    filteredOrders.map((order) => {
                        const nextLabel = order.delivery_status === 'pending' ? 'Confirmer' : order.delivery_status === 'confirmed' ? 'Marquer livrée' : null;
                        return (
                            <Pressable key={order.id} style={styles.card} onPress={() => router.push(`/order/${order.id}`)}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{order.supplier_products?.name ?? 'Produit'}</Text>
                                    <Text style={styles.cardStatus}>{STATUS_LABELS[order.delivery_status]}</Text>
                                </View>
                                <Text style={styles.cardMeta}>
                                    {order.quantity} {order.unit} · {formatFCFA(order.total_price)}
                                </Text>
                                <Text style={styles.cardMeta}>
                                    Livraison prévue : {formatDate(order.expected_delivery_date)} · Reçue le {formatDate(order.created_at)}
                                </Text>
                                {nextLabel ? (
                                    <Pressable style={styles.actionButton} onPress={() => changeStatus(order)}>
                                        <Text style={styles.actionButtonText}>{nextLabel}</Text>
                                    </Pressable>
                                ) : null}
                            </Pressable>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        centered: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background,
        },
        content: {
            padding: 16,
            gap: 14,
        },
        title: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.text,
        },
        filters: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        filterChip: {
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
        },
        filterChipActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        filterText: {
            color: theme.text,
            fontWeight: '700',
            fontSize: 13,
        },
        filterTextActive: {
            color: '#fff',
        },
        emptyCard: {
            marginTop: 8,
            borderRadius: 20,
            padding: 20,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 6,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
        },
        emptyText: {
            color: theme.textSecondary,
            lineHeight: 20,
        },
        card: {
            borderRadius: 20,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 8,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        cardTitle: {
            flex: 1,
            fontSize: 16,
            fontWeight: '800',
            color: theme.text,
        },
        cardStatus: {
            color: theme.primary,
            fontWeight: '700',
            textTransform: 'capitalize',
        },
        cardMeta: {
            color: theme.textSecondary,
            lineHeight: 20,
        },
        actionButton: {
            marginTop: 4,
            borderRadius: 14,
            backgroundColor: theme.primary,
            paddingVertical: 12,
            alignItems: 'center',
        },
        actionButtonText: {
            color: '#fff',
            fontWeight: '700',
        },
    });
}
