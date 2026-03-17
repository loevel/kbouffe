import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, Image, SectionList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem } from '@/components/restaurant/MenuItem';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/cart-context';
import { useRestaurantCache } from '@/contexts/restaurant-context';
import { getStore, type MobileProduct } from '@/lib/api';

export default function RestaurantScreen() {
    // `id` param is actually the restaurant slug
    const { id: slug } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { itemCount, total, restaurantId: cartRestaurantId } = useCart();
    const { setCurrentStore } = useRestaurantCache();

    const [data, setData]     = useState<Awaited<ReturnType<typeof getStore>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        getStore(slug)
            .then((res) => {
                setData(res);
                setCurrentStore(res);
            })
            .catch((e) => setError((e as Error).message ?? 'Erreur de chargement'))
            .finally(() => setLoading(false));
    }, [slug, setCurrentStore]);

    const restaurant = data?.restaurant;

    // Show cart FAB when items are from this restaurant
    const showCartFab = itemCount > 0 && restaurant && cartRestaurantId === restaurant.id;

    const sections = useMemo(() => {
        if (!data) return [];
        const grouped: Record<string, MobileProduct[]> = {};
        (data.products ?? []).forEach((p) => {
            const cat = p.category ?? 'Autres';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(p);
        });
        return Object.entries(grouped).map(([title, items]) => ({ title, data: items }));
    }, [data]);

    const handleAddProduct = (product: MobileProduct) => {
        router.push({
            pathname: '/product-modal',
            params: { productId: product.id, restaurantId: restaurant!.id },
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !restaurant) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>{error ?? 'Restaurant introuvable.'}</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
                    <Text style={{ color: theme.primary }}>Retour</Text>
                </Pressable>
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.header}>
            {restaurant.coverImage ? (
                <Image source={{ uri: restaurant.coverImage }} style={styles.coverImage} />
            ) : (
                <View style={[styles.coverImage, { backgroundColor: theme.border }]} />
            )}

            <Pressable
                style={[styles.backButton, { backgroundColor: theme.background, top: insets.top + Spacing.sm }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>

            <View style={[styles.restaurantInfo, { backgroundColor: theme.background }]}>
                <Text style={[styles.restaurantName, { color: theme.text }]}>{restaurant.name}</Text>
                <Text style={[styles.restaurantDescription, { color: theme.icon }]} numberOfLines={2}>
                    {restaurant.description}
                </Text>

                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color={theme.primary} />
                    <Text style={[styles.ratingText, { color: theme.text }]}>
                        {(restaurant.rating ?? 0).toFixed(1)}
                    </Text>
                    <View style={styles.dot} />
                    <Ionicons name="time-outline" size={16} color={theme.icon} />
                    <Text style={[styles.infoText, { color: theme.icon }]}>
                        {restaurant.estimatedDeliveryTime} min
                    </Text>
                    <View style={styles.dot} />
                    <Text style={[styles.infoText, { color: theme.icon }]}>
                        {restaurant.deliveryFee === 0 ? 'Livraison gratuite' : `${restaurant.deliveryFee} FCFA`}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <View style={styles.menuItemContainer}>
                        <MenuItem item={item as never} onAdd={() => handleAddProduct(item)} />
                    </View>
                )}
                stickySectionHeadersEnabled={true}
                contentContainerStyle={{ paddingBottom: showCartFab ? 100 : 40 }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingTop: Spacing.xxl }}>
                        <Ionicons name="fast-food-outline" size={48} color={theme.border} />
                        <Text style={[styles.infoText, { color: theme.icon, marginTop: Spacing.md }]}>
                            Aucun article disponible
                        </Text>
                    </View>
                }
            />

            {showCartFab && (
                <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom, Spacing.md) }]}>
                    <Pressable
                        style={[styles.fab, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/cart')}
                    >
                        <View style={styles.fabBadge}>
                            <Text style={styles.fabBadgeText}>{itemCount}</Text>
                        </View>
                        <Text style={styles.fabText}>Voir le panier</Text>
                        <Text style={styles.fabPrice}>{total.toLocaleString()} FCFA</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: Spacing.sm,
    },
    coverImage: {
        width: '100%',
        height: 240,
    },
    backButton: {
        position: 'absolute',
        left: Spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    restaurantInfo: {
        padding: Spacing.md,
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        marginTop: -20,
    },
    restaurantName: {
        ...Typography.title2,
        marginBottom: Spacing.xs,
    },
    restaurantDescription: {
        ...Typography.body,
        marginBottom: Spacing.md,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        ...Typography.body,
        fontWeight: '600',
        marginLeft: 2,
    },
    infoText: {
        ...Typography.body,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#cbd5e1',
        marginHorizontal: Spacing.xs,
    },
    sectionHeader: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    sectionTitle: {
        ...Typography.title3,
    },
    menuItemContainer: {
        paddingHorizontal: Spacing.md,
    },
    fabContainer: {
        position: 'absolute',
        left: Spacing.md,
        right: Spacing.md,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Radii.full,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    fabBadge: {
        backgroundColor: '#fff',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabBadgeText: {
        color: '#ea580c',
        fontWeight: '700',
        fontSize: 12,
    },
    fabText: {
        color: '#fff',
        ...Typography.body,
        fontWeight: '600',
    },
    fabPrice: {
        color: '#fff',
        ...Typography.body,
        fontWeight: '700',
    },
});
