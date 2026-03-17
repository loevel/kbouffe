import { useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrders, type StoredOrder, type MobileOrderStatus } from '@/contexts/orders-context';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/cart-context';

const statusLabels: Record<MobileOrderStatus, string> = {
    pending: 'En attente',
    confirmed: 'Confirmee',
    accepted: 'Acceptee',
    preparing: 'En preparation',
    ready: 'Prete',
    delivering: 'En livraison',
    delivered: 'Livree',
    completed: 'Terminee',
    cancelled: 'Annulee',
};

const statusColors: Record<MobileOrderStatus, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    accepted: '#3b82f6',
    preparing: '#8b5cf6',
    ready: '#10b981',
    delivering: '#f97316',
    delivered: '#10b981',
    completed: '#6b7280',
    cancelled: '#ef4444',
};

export default function OrdersScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { orders } = useOrders();
    const { addItem, clearCart } = useCart();

    const activeOrders = useMemo(() => orders.filter(o => !['completed', 'cancelled', 'delivered'].includes(o.status)), [orders]);
    const pastOrders = useMemo(() => orders.filter(o => ['completed', 'cancelled', 'delivered'].includes(o.status)), [orders]);

    const handleReorder = (order: StoredOrder) => {
        clearCart();
        order.items.forEach(item => {
            addItem(
                { id: item.productId, name: item.name, price: item.price } as any,
                item.quantity,
                {},
                order.restaurantId,
                order.restaurantName,
            );
        });
        Alert.alert('Panier mis à jour', `${order.restaurantName} ajouté au panier.`, [
            { text: 'Voir le panier', onPress: () => router.push('/cart') },
            { text: 'Continuer', style: 'cancel' },
        ]);
    };

    const renderOrderCard = (order: StoredOrder) => {
        const statusColor = statusColors[order.status] ?? '#6b7280';
        const isActive = !['completed', 'cancelled', 'delivered'].includes(order.status);

        return (
            <Pressable
                key={order.id}
                style={({ pressed }) => [
                    styles.orderCard,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => router.push(`/order/${order.id}`)}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderRestaurant}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.orderRestaurantName, { color: theme.text }]}>
                                {order.restaurantName}
                            </Text>
                            <Text style={[styles.orderItemCount, { color: theme.icon }]}>
                                {order.items.length} article{order.items.length > 1 ? 's' : ''} · {order.total.toLocaleString()} FCFA
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabels[order.status]}</Text>
                    </View>
                </View>

                <View style={[styles.orderFooter, { borderTopColor: theme.border }]}>
                    <Text style={[styles.orderDate, { color: theme.icon }]}>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    {isActive && (
                        <View style={styles.trackButton}>
                            <Text style={[styles.trackText, { color: theme.primary }]}>Suivre</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                        </View>
                    )}
                    {!isActive && order.status === 'completed' && (
                        <View style={styles.completedActions}>
                            <Pressable
                                style={[styles.reorderButton, { backgroundColor: theme.primary + '15' }]}
                                onPress={() => handleReorder(order)}
                            >
                                <Ionicons name="refresh" size={14} color={theme.primary} />
                                <Text style={[styles.reorderText, { color: theme.primary }]}>Recommander</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: theme.text }]}>Mes commandes</Text>
            </View>

            <FlatList
                data={[...activeOrders, ...pastOrders]}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <View>
                        {index === 0 && activeOrders.length > 0 && (
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>En cours</Text>
                        )}
                        {index === activeOrders.length && pastOrders.length > 0 && (
                            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.lg }]}>Historique</Text>
                        )}
                        {renderOrderCard(item)}
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Ionicons name="receipt-outline" size={48} color={theme.icon} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune commande</Text>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>
                            Vos commandes apparaitront ici.
                        </Text>
                        <Pressable
                            style={[styles.exploreButton, { backgroundColor: theme.primary }]}
                            onPress={() => router.push('/(tabs)/explore')}
                        >
                            <Text style={styles.exploreButtonText}>Decouvrir les restaurants</Text>
                        </Pressable>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { padding: Spacing.md },
    title: { ...Typography.title2 },
    sectionTitle: { ...Typography.title3, marginBottom: Spacing.md },
    listContainer: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    orderCard: {
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    orderHeader: {
        padding: Spacing.md,
    },
    orderRestaurant: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    orderImage: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
    },
    orderRestaurantName: {
        ...Typography.body,
        fontWeight: '600',
    },
    orderItemCount: {
        ...Typography.caption,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.full,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        ...Typography.small,
        fontWeight: '600',
    },
    orderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
    },
    orderDate: {
        ...Typography.caption,
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trackText: {
        ...Typography.caption,
        fontWeight: '600',
    },
    reorderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    completedActions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    reorderText: {
        ...Typography.small,
        fontWeight: '600',
    },
    empty: {
        alignItems: 'center',
        paddingTop: Spacing.xxl,
    },
    emptyTitle: {
        ...Typography.title3,
        marginTop: Spacing.md,
    },
    emptyText: {
        ...Typography.body,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    exploreButton: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
    },
    exploreButtonText: {
        color: '#fff',
        ...Typography.body,
        fontWeight: '700',
    },
});
