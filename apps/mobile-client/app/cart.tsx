import { StyleSheet, View, Text, Pressable, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/contexts/cart-context';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';

export default function CartScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { items, restaurantName, subtotal, deliveryFee, total, updateQuantity, removeItem, clearCart } = useCart();

    const handleUpdateQuantity = (id: string, newQuantity: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateQuantity(id, newQuantity);
    };

    const handleClearCart = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        clearCart();
    };

    const handleCheckout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
        router.push('/checkout');
    };

    if (items.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
                <View style={styles.headerNav}>
                    <Pressable onPress={() => router.back()} hitSlop={8}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Panier</Text>
                    <View style={{ width: 28 }} />
                </View>
                <Animated.View 
                    style={styles.empty}
                    entering={FadeInDown.duration(400).springify()}
                >
                    <Ionicons name="cart-outline" size={64} color={theme.icon} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Votre panier est vide</Text>
                    <Text style={[styles.emptyText, { color: theme.icon }]}>Ajoutez des articles depuis un restaurant</Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.emptyButton, 
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.replace('/(tabs)/explore');
                        }}
                    >
                        <Text style={styles.emptyButtonText}>Explorer les restaurants</Text>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.headerNav}>
                <Pressable onPress={() => router.back()} hitSlop={8}>
                    <Ionicons name="close" size={28} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Panier</Text>
                <Pressable onPress={handleClearCart} hitSlop={8}>
                    <Text style={[styles.clearText, { color: '#ef4444' }]}>Vider</Text>
                </Pressable>
            </View>

            <Animated.View 
                entering={FadeInDown.duration(300)}
                style={[styles.restaurantBanner, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}
            >
                <Ionicons name="restaurant-outline" size={16} color={theme.primary} />
                <Text style={[styles.restaurantName, { color: theme.primary }]}>{restaurantName}</Text>
            </Animated.View>

            <Animated.FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                itemLayoutAnimation={Layout.springify()}
                renderItem={({ item, index }) => (
                    <Animated.View 
                        entering={FadeInDown.delay(index * 100).duration(400).springify()}
                        exiting={FadeOut.duration(200)}
                        style={[styles.cartItem, { borderColor: theme.border }]}
                    >
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
                            <Pressable 
                                onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)} 
                                style={({ pressed }) => [
                                    styles.qtyBtn, 
                                    { borderColor: theme.border },
                                    pressed && { backgroundColor: theme.border + '50' }
                                ]}
                            >
                                <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? '#ef4444' : theme.text} />
                            </Pressable>
                            <Animated.Text key={item.quantity} entering={FadeInDown.duration(200)} style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Animated.Text>
                            <Pressable 
                                onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)} 
                                style={({ pressed }) => [
                                    styles.qtyBtn, 
                                    { borderColor: theme.border },
                                    pressed && { backgroundColor: theme.border + '50' }
                                ]}
                            >
                                <Ionicons name="add" size={16} color={theme.text} />
                            </Pressable>
                        </View>
                    </Animated.View>
                )}
            />

            <Animated.View 
                entering={FadeInDown.delay(300).duration(500).springify()}
                style={[styles.summary, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            >
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
                    style={({ pressed }) => [
                        styles.checkoutButton, 
                        { backgroundColor: theme.primary },
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={handleCheckout}
                >
                    <Text style={styles.checkoutText}>Commander - {total.toLocaleString()} FCFA</Text>
                </Pressable>
            </Animated.View>
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
    summary: { padding: Spacing.md, borderTopWidth: 1, ...Shadows.lg },
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
    emptyText: { ...Typography.body, marginTop: Spacing.xs, textAlign: 'center' },
    emptyButton: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radii.full },
    emptyButtonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
});