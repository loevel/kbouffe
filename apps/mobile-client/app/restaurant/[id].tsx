import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, Image, SectionList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import MapView, { Marker, Circle, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { MenuItem } from '@/components/restaurant/MenuItem';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/cart-context';
import { useRestaurantCache } from '@/contexts/restaurant-context';
import { getStore, type MobileProduct, type MobileReview } from '@/lib/api';

// ── Review Card ──────────────────────────────────────────────────────
function ReviewCard({ review, theme }: { review: MobileReview; theme: typeof Colors.light }) {
    const date = new Date(review.created_at);
    const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <View style={[reviewStyles.card, { borderColor: theme.border }]}>
            <View style={reviewStyles.cardHeader}>
                <View style={reviewStyles.avatarCircle}>
                    <Ionicons name="person" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[reviewStyles.customerName, { color: theme.text }]}>
                        {review.customerName ?? 'Client'}
                    </Text>
                    <Text style={[reviewStyles.date, { color: theme.icon }]}>{formattedDate}</Text>
                </View>
                <View style={reviewStyles.starRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                            key={s}
                            name={s <= review.rating ? 'star' : 'star-outline'}
                            size={14}
                            color={s <= review.rating ? '#f59e0b' : theme.border}
                        />
                    ))}
                </View>
            </View>
            {review.comment ? (
                <Text style={[reviewStyles.comment, { color: theme.text }]}>{review.comment}</Text>
            ) : null}
            {review.response ? (
                <View style={[reviewStyles.responseBox, { backgroundColor: theme.border + '30' }]}>
                    <Text style={[reviewStyles.responseLabel, { color: theme.icon }]}>Réponse du restaurant</Text>
                    <Text style={[reviewStyles.responseText, { color: theme.text }]}>{review.response}</Text>
                </View>
            ) : null}
        </View>
    );
}

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
    const reviews = data?.reviews ?? [];

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/product-modal',
            params: { productId: product.id, restaurantId: restaurant!.id },
        });
    };

    const handleLeaveReview = () => {
        if (!restaurant) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({
            pathname: '/review/restaurant' as any,
            params: { restaurantId: restaurant.id, restaurantName: restaurant.name },
        });
    };

    const handleReserve = () => {
        if (!restaurant) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/restaurant/${slug}/reserve` as any);
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

    // Compute review stats from available data
    const avgRating = restaurant.rating ?? 0;
    const reviewCount = restaurant.reviewCount ?? reviews.length;

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

                {/* ── Reservation CTA ─────────────────────────────────── */}
                {restaurant.hasReservations && (
                    <Pressable
                        style={[reserveStyles.reserveBtn, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '40' }]}
                        onPress={handleReserve}
                    >
                        <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                        <Text style={[reserveStyles.reserveBtnText, { color: theme.primary }]}>
                            Réserver une table
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.primary} style={{ marginLeft: 'auto' }} />
                    </Pressable>
                )}
            </View>

            {/* ── Reviews Section ─────────────────────────────────── */}
            {/* ── Delivery Zone Map ─────────────────────────────── */}
            {restaurant.lat && restaurant.lng && (
                <View style={[deliveryZoneStyles.section, { borderColor: theme.border }]}>
                    <View style={deliveryZoneStyles.header}>
                        <Ionicons name="bicycle-outline" size={18} color={theme.primary} />
                        <Text style={[deliveryZoneStyles.title, { color: theme.text }]}>Zone de livraison</Text>
                        {restaurant.maxDeliveryRadiusKm ? (
                            <Text style={[deliveryZoneStyles.radius, { color: theme.icon }]}>
                                jusqu'à {restaurant.maxDeliveryRadiusKm} km
                            </Text>
                        ) : null}
                    </View>
                    <MapView
                        style={deliveryZoneStyles.map}
                        provider={PROVIDER_DEFAULT}
                        mapType="none"
                        initialRegion={{
                            latitude: restaurant.lat,
                            longitude: restaurant.lng,
                            latitudeDelta: (restaurant.maxDeliveryRadiusKm ?? 5) * 0.025,
                            longitudeDelta: (restaurant.maxDeliveryRadiusKm ?? 5) * 0.025,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                        <UrlTile
                            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maximumZ={19}
                            flipY={false}
                            tileSize={256}
                        />
                        <Marker
                            coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
                            title={restaurant.name}
                            pinColor="#f97316"
                        />
                        {restaurant.maxDeliveryRadiusKm && (
                            <Circle
                                center={{ latitude: restaurant.lat, longitude: restaurant.lng }}
                                radius={restaurant.maxDeliveryRadiusKm * 1000}
                                strokeColor="#f9731660"
                                fillColor="#f9731610"
                                strokeWidth={2}
                            />
                        )}
                    </MapView>
                </View>
            )}

            {/* ── Reviews Section ─────────────────────────────────── */}
            <View style={[reviewStyles.section, { borderColor: theme.border }]}>
                <View style={reviewStyles.sectionHeader}>
                    <View>
                        <Text style={[reviewStyles.sectionTitle, { color: theme.text }]}>Avis clients</Text>
                        <View style={reviewStyles.summaryRow}>
                            <Ionicons name="star" size={18} color="#f59e0b" />
                            <Text style={[reviewStyles.avgRating, { color: theme.text }]}>
                                {avgRating.toFixed(1)}
                            </Text>
                            <Text style={[reviewStyles.reviewCount, { color: theme.icon }]}>
                                ({reviewCount} avis)
                            </Text>
                        </View>
                    </View>
                    <Pressable style={[reviewStyles.leaveReviewBtn, { backgroundColor: theme.primary }]} onPress={handleLeaveReview}>
                        <Ionicons name="create-outline" size={16} color="#fff" />
                        <Text style={reviewStyles.leaveReviewTxt}>Donner un avis</Text>
                    </Pressable>
                </View>

                {reviews.length > 0 ? (
                    <>
                        {reviews.slice(0, 5).map((review) => (
                            <ReviewCard key={review.id} review={review} theme={theme} />
                        ))}
                        {reviews.length > 5 && (
                            <Text style={[reviewStyles.moreText, { color: theme.primary }]}>
                                + {reviews.length - 5} autres avis
                            </Text>
                        )}
                    </>
                ) : (
                    <View style={reviewStyles.emptyContainer}>
                        <Ionicons name="chatbubble-outline" size={32} color={theme.border} />
                        <Text style={[reviewStyles.emptyText, { color: theme.icon }]}>
                            Aucun avis pour le moment
                        </Text>
                        <Text style={[reviewStyles.emptySubtext, { color: theme.icon }]}>
                            Soyez le premier à donner votre avis !
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => (item as any).id}
                ListHeaderComponent={renderHeader}
                renderSectionHeader={({ section: { title } }: any) => (
                    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                    </View>
                )}
                renderItem={({ item, index }: any) => (
                    <Animated.View entering={FadeInDown.delay(index * 50).duration(400).springify()} style={styles.menuItemContainer}>
                        <MenuItem item={item as never} onAdd={() => handleAddProduct(item)} />
                    </Animated.View>
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
                <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.fabContainer, { bottom: Math.max(insets.bottom, Spacing.md) }]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.fab, 
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push('/cart');
                        }}
                    >
                        <View style={styles.fabBadge}>
                            <Text style={styles.fabBadgeText}>{itemCount}</Text>
                        </View>
                        <Text style={styles.fabText}>Voir le panier</Text>
                        <Text style={styles.fabPrice}>{total.toLocaleString()} FCFA</Text>
                    </Pressable>
                </Animated.View>
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

const reviewStyles = StyleSheet.create({
    section: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.title3,
        marginBottom: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    avgRating: {
        ...Typography.body,
        fontWeight: '700',
        marginLeft: 2,
    },
    reviewCount: {
        ...Typography.caption,
    },
    leaveReviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
    },
    leaveReviewTxt: {
        color: '#fff',
        ...Typography.caption,
        fontWeight: '600',
    },
    card: {
        borderWidth: 1,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    avatarCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#94a3b8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerName: {
        ...Typography.caption,
        fontWeight: '600',
    },
    date: {
        ...Typography.caption,
        fontSize: 11,
    },
    starRow: {
        flexDirection: 'row',
        gap: 1,
    },
    comment: {
        ...Typography.body,
        fontSize: 13,
        marginTop: 2,
    },
    responseBox: {
        marginTop: Spacing.sm,
        padding: Spacing.sm,
        borderRadius: Radii.md,
    },
    responseLabel: {
        ...Typography.caption,
        fontWeight: '600',
        marginBottom: 2,
    },
    responseText: {
        ...Typography.body,
        fontSize: 13,
    },
    moreText: {
        ...Typography.caption,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    emptyText: {
        ...Typography.body,
        marginTop: Spacing.sm,
    },
    emptySubtext: {
        ...Typography.caption,
        marginTop: 2,
    },
});

const reserveStyles = StyleSheet.create({
    reserveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
    },
    reserveBtnText: {
        ...Typography.body,
        fontWeight: '600',
    },
});

const deliveryZoneStyles = StyleSheet.create({
    section: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    title: { ...Typography.body, fontWeight: '600', flex: 1 },
    radius: { ...Typography.caption },
    map: {
        height: 200,
        borderRadius: Radii.lg,
        overflow: 'hidden',
    },
});
