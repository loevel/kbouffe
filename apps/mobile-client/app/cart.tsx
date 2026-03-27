import { StyleSheet, View, Text, Pressable, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/contexts/cart-context';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { items, restaurantName, subtotal, deliveryFee, total, updateQuantity, removeItem, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
                <View style={styles.headerNav}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Panier</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.empty}>
                    <Ionicons name="cart-outline" size={64} color={theme.icon} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Votre panier est vide</Text>
                    <Text style={[styles.emptyText, { color: theme.icon }]}>Ajoutez des articles depuis un restaurant</Text>
                    <Pressable
                        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.replace('/(tabs)/explore')}
                    >
                        <Text style={styles.emptyButtonText}>Explorer les restaurants</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.headerNav}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Panier</Text>
                <Pressable onPress={clearCart}>
                    <Text style={[styles.clearText, { color: '#ef4444' }]}>Vider</Text>
                </Pressable>
            </View>

            <View style={[styles.restaurantBanner, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                <Ionicons name="restaurant-outline" size={16} color={theme.primary} />
                <Text style={[styles.restaurantName, { color: theme.primary }]}>{restaurantName}</Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.cartItem, { borderColor: theme.border }]}>
                        {item.product.image && (
                            <Image source={{ uri: item.product.image }} style={styles.itemImage} />
                        )}
                        <View style={styles.itemContent}>
                            <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.product.name}</Text>
                            {Object.keys(item.selectedOptions).length > 0 && (
                                <Text style={[styles.itemOptions, { color: theme.icon }]} numberOfLines={1}>
                                    {Object.values(item.selectedOptions).join(', ')}
                                </Text>
                            )}
                            <Text style={[styles.itemPrice, { color: theme.primary }]}>{item.unitPrice.toLocaleString()} FCFA</Text>
                        </View>
                        <View style={styles.itemActions}>
                            <Pressable onPress={() => updateQuantity(item.id, item.quantity - 1)} style={[styles.qtyBtn, { borderColor: theme.border }]}>
                                <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? '#ef4444' : theme.text} />
                            </Pressable>
                            <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                            <Pressable onPress={() => updateQuantity(item.id, item.quantity + 1)} style={[styles.qtyBtn, { borderColor: theme.border }]}>
                                <Ionicons name="add" size={16} color={theme.text} />
                            </Pressable>
                        </View>
                    </View>
                )}
            />

            <View style={[styles.summary, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.icon }]}>Sous-total</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{subtotal.toLocaleString()} FCFA</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.icon }]}>Livraison</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{deliveryFee > 0 ? `${deliveryFee.toLocaleString()} FCFA` : 'Gratuit'}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                    <Text style={[styles.totalValue, { color: theme.primary }]}>{total.toLocaleString()} FCFA</Text>
                </View>
                <Pressable
                    style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
                    onPress={() => { router.back(); router.push('/checkout'); }}
                >
                    <Text style={styles.checkoutText}>Commander - {total.toLocaleString()} FCFA</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    headerTitle: { ...Typography.title3 },
    clearText: { ...Typography.caption, fontWeight: '600' },
    restaurantBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.md,
        padding: Spacing.sm,
        borderRadius: Radii.md,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    restaurantName: { ...Typography.caption, fontWeight: '600' },
    listContent: { padding: Spacing.md },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        gap: Spacing.md,
    },
    itemImage: { width: 56, height: 56, borderRadius: Radii.md },
    itemContent: { flex: 1 },
    itemName: { ...Typography.body, fontWeight: '600' },
    itemOptions: { ...Typography.small, marginTop: 2 },
    itemPrice: { ...Typography.caption, fontWeight: '700', marginTop: 4 },
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: { ...Typography.body, fontWeight: '700', minWidth: 20, textAlign: 'center' },
    summary: { padding: Spacing.md, borderTopWidth: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    summaryLabel: { ...Typography.body },
    summaryValue: { ...Typography.body, fontWeight: '500' },
    totalRow: { borderTopWidth: 1, paddingTop: Spacing.sm, marginBottom: Spacing.md },
    totalLabel: { ...Typography.title3 },
    totalValue: { ...Typography.title3 },
    checkoutButton: {
        padding: Spacing.md,
        borderRadius: Radii.full,
        alignItems: 'center',
    },
    checkoutText: { color: '#fff', ...Typography.body, fontWeight: '700' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
    emptyTitle: { ...Typography.title3, marginTop: Spacing.md },
    emptyText: { ...Typography.body, marginTop: Spacing.xs },
    emptyButton: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radii.full },
    emptyButtonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
});
