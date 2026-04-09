import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/contexts/cart-context';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CartScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';
    const { items, restaurantName, subtotal, deliveryFee, total, updateQuantity, clearCart } = useCart();

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
                    <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.headerBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                        <Ionicons name="close" size={22} color={theme.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Panier</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Animated.View
                    style={styles.emptyContainer}
                    entering={FadeInDown.duration(400).springify()}
                >
                    <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="cart-outline" size={52} color={theme.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Votre panier est vide</Text>
                    <Text style={[styles.emptySubtext, { color: theme.icon }]}>
                        Explorez nos restaurants et ajoutez{'\n'}des plats qui vous tentent !
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.emptyButton,
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.replace('/(tabs)/explore');
                        }}
                    >
                        <Ionicons name="compass-outline" size={18} color="#fff" />
                        <Text style={styles.emptyButtonText}>Explorer les restaurants</Text>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.headerNav}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.headerBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    Panier
                    <Text style={[styles.headerCount, { color: theme.icon }]}> ({items.length})</Text>
                </Text>
                <Pressable onPress={handleClearCart} hitSlop={8} style={[styles.headerBtn, { backgroundColor: '#ef444412', borderColor: '#ef444430' }]}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
            </View>

            {/* Restaurant banner */}
            <Animated.View
                entering={FadeInDown.duration(300)}
                style={[styles.restaurantBanner, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}
            >
                <View style={[styles.restaurantIconBox, { backgroundColor: theme.primary + '18' }]}>
                    <Ionicons name="restaurant-outline" size={16} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.restaurantName, { color: theme.text }]} numberOfLines={1}>{restaurantName}</Text>
                    <Text style={[styles.restaurantMeta, { color: theme.icon }]}>{items.length} article{items.length > 1 ? 's' : ''}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.icon} />
            </Animated.View>

            {/* Items list */}
            <Animated.FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                itemLayoutAnimation={LinearTransition.springify()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <AnimatedPressable
                        entering={FadeInDown.delay(index * 80).duration(400).springify()}
                        exiting={FadeOut.duration(200)}
                        style={({ pressed }) => [
                            styles.cartItem,
                            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                            pressed && { opacity: 0.95 },
                        ]}
                    >
                        <View style={styles.itemMainRow}>
                            {item.product.image ? (
                                <Image source={{ uri: item.product.image }} style={styles.itemImage} />
                            ) : (
                                <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.primary + '12' }]}>
                                    <Ionicons name="fast-food-outline" size={22} color={theme.primary} />
                                </View>
                            )}
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>{item.product.name}</Text>
                                {Object.keys(item.selectedOptions).length > 0 && (
                                    <Text style={[styles.itemOptions, { color: theme.icon }]} numberOfLines={1}>
                                        {Object.values(item.selectedOptions).join(', ')}
                                    </Text>
                                )}
                                <View style={styles.itemFooterRow}>
                                    <Text style={[styles.itemPrice, { color: theme.primary }]}>
                                        {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} FCFA
                                    </Text>
                                    <View style={[styles.itemActions, { backgroundColor: isDark ? '#ffffff08' : theme.background, borderColor: theme.border }]}>
                                        <Pressable
                                            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                            style={({ pressed }) => [
                                                styles.qtyBtn,
                                                {
                                                    backgroundColor: item.quantity === 1 ? '#ef444412' : 'transparent',
                                                },
                                                pressed && { opacity: 0.7 },
                                            ]}
                                        >
                                            <Ionicons
                                                name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                                                size={16}
                                                color={item.quantity === 1 ? '#ef4444' : theme.text}
                                            />
                                        </Pressable>
                                        <Animated.Text
                                            key={item.quantity}
                                            entering={FadeInDown.duration(200)}
                                            style={[styles.qtyText, { color: theme.text }]}
                                        >
                                            {item.quantity}
                                        </Animated.Text>
                                        <Pressable
                                            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                            style={({ pressed }) => [
                                                styles.qtyBtn,
                                                {
                                                    backgroundColor: theme.primaryLight,
                                                },
                                                pressed && { opacity: 0.7 },
                                            ]}
                                        >
                                            <Ionicons name="add" size={16} color={theme.primary} />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </AnimatedPressable>
                )}
            />

            {/* Summary + checkout */}
            <Animated.View
                entering={FadeInDown.delay(300).duration(500).springify()}
                style={[styles.summary, { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            >
                {/* Delivery info */}
                <View style={[styles.deliveryInfo, { backgroundColor: deliveryFee === 0 ? '#10b98110' : (isDark ? '#ffffff06' : '#f8fafc'), borderColor: deliveryFee === 0 ? '#10b98130' : theme.border + '50' }]}>
                    <Ionicons
                        name={deliveryFee === 0 ? 'bicycle' : 'bicycle-outline'}
                        size={16}
                        color={deliveryFee === 0 ? '#10b981' : theme.icon}
                    />
                    <Text style={[styles.deliveryText, { color: deliveryFee === 0 ? '#10b981' : theme.icon }]}>
                        {deliveryFee > 0 ? `Livraison : ${deliveryFee.toLocaleString('fr-FR')} FCFA` : 'Livraison gratuite ✓'}
                    </Text>
                </View>

                <View style={styles.summaryRows}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.icon }]}>Sous-total</Text>
                        <Text style={[styles.summaryValue, { color: theme.text }]}>{subtotal.toLocaleString('fr-FR')} FCFA</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.icon }]}>Livraison</Text>
                        <Text style={[styles.summaryValue, { color: deliveryFee === 0 ? '#10b981' : theme.text }]}>
                            {deliveryFee > 0 ? `${deliveryFee.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
                        </Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.border + '50' }]}>
                        <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.checkoutButton,
                        { backgroundColor: theme.primary },
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={handleCheckout}
                >
                    <Ionicons name="bag-check-outline" size={20} color="#fff" />
                    <Text style={styles.checkoutText}>Commander · {total.toLocaleString('fr-FR')} FCFA</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    /* Header */
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerTitle: { ...Typography.title3 },
    headerCount: { ...Typography.caption, fontWeight: '400' },

    /* Restaurant banner */
    restaurantBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.md,
        padding: Spacing.sm + 2,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    restaurantIconBox: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restaurantName: { ...Typography.captionSemibold },
    restaurantMeta: { fontSize: 12, fontWeight: '500', marginTop: 1 },

    /* Items list */
    listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: 16 },
    cartItem: {
        padding: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    itemMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    itemImage: { width: 92, height: 92, borderRadius: Radii.md },
    itemImagePlaceholder: {
        width: 92,
        height: 92,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: { flex: 1 },
    itemName: { ...Typography.captionSemibold, fontWeight: '700', lineHeight: 18 },
    itemOptions: { ...Typography.small, marginTop: 4, fontSize: 11 },
    itemFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    itemPrice: { ...Typography.bodySemibold, fontWeight: '700' },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 4,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: { ...Typography.small, fontWeight: '700', minWidth: 20, textAlign: 'center' },

    /* Summary */
    summary: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        ...Shadows.lg,
    },
    deliveryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 8,
        borderRadius: Radii.md,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    deliveryText: { ...Typography.caption, fontWeight: '600' },
    summaryRows: { gap: Spacing.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { ...Typography.body },
    summaryValue: { ...Typography.body, fontWeight: '500' },
    totalRow: { borderTopWidth: 1, paddingTop: Spacing.sm, marginTop: Spacing.xs },
    totalLabel: { ...Typography.headline },
    totalValue: { ...Typography.headline, fontWeight: '800' },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
        marginTop: Spacing.md,
    },
    checkoutText: { color: '#fff', ...Typography.bodySemibold, fontWeight: '700' },

    /* Empty state */
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    emptyTitle: { ...Typography.title3, textAlign: 'center' },
    emptySubtext: { ...Typography.body, textAlign: 'center', lineHeight: 22 },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm + 4,
        borderRadius: Radii.full,
        marginTop: Spacing.sm,
    },
    emptyButtonText: { color: '#fff', ...Typography.bodySemibold },
});
