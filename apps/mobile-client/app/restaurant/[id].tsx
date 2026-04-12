import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
    Text,
    Pressable,
    ScrollView,
    Dimensions,
    Share,
    Alert,
    ActionSheetIOS,
    Platform,
    SectionList,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, withTiming, useSharedValue, interpolate, Extrapolate, runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';
import { MenuItemGrid } from '@/components/restaurant/MenuItemGrid';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/cart-context';
import { useRestaurantCache } from '@/contexts/restaurant-context';
import { useApiCacheContext } from '@/contexts/api-cache-context';
import { useAuth } from '@/contexts/auth-context';
import { getStore, toggleRestaurantFavorite, type MobileProduct } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_W = SCREEN_WIDTH;

function PaginationDot({ index, currentIndex, theme }: { index: number; currentIndex: number; theme: any }) {
    const isActive = index === currentIndex;
    const animatedStyle = useAnimatedStyle(() => ({
        width: withSpring(isActive ? 20 : 8, { damping: 15 }),
        backgroundColor: withTiming(isActive ? theme.primary : theme.border, { duration: 300 }),
    }));
    return <Animated.View style={[styles.dotBase, animatedStyle]} />;
}

export default function RestaurantScreen() {
    const { id: slug } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { itemCount, total, restaurantId: cartRestaurantId } = useCart();
    const { setCurrentStore, preview } = useRestaurantCache();
    const cache = useApiCacheContext();

    const [data, setData] = useState<Awaited<ReturnType<typeof getStore>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [activeDeliveryType, setActiveDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
    const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);

    // Refs for category navigation
    const sectionListRef = useRef<SectionList>(null);
    const categoryTabsRef = useRef<ScrollView>(null);
    const tabOffsetsRef = useRef<number[]>([]);
    // Keep a stable ref to sections so viewability callback doesn't need to re-register
    const sectionsRef = useRef<typeof sections>([]);

    // Favorites state — seeded from auth context loyalty data
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        cache.withCache(`store:${slug}`, () => getStore(slug), 15 * 60 * 1000)
            .then((res) => {
                setData(res);
                setCurrentStore(res);
            })
            .catch((e) => setError((e as Error).message ?? 'Erreur de chargement'))
            .finally(() => setLoading(false));
    }, [slug, setCurrentStore, cache]);

    const restaurant = data?.restaurant ?? (loading ? preview : null);

    // Seed favorite state once restaurant loads
    useEffect(() => {
        if (restaurant?.id && user) {
            setIsFavorite(false);
        }
    }, [restaurant?.id, user]);

    const handleToggleFavorite = useCallback(async () => {
        if (!restaurant?.id) return;
        if (!user) {
            router.push('/(auth)/login');
            return;
        }
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFavLoading(true);
        const next = !isFavorite;
        setIsFavorite(next);
        try {
            const res = await toggleRestaurantFavorite(restaurant.id);
            setIsFavorite(res.active);
        } catch {
            setIsFavorite(!next);
            Alert.alert('Erreur', 'Impossible de mettre à jour les favoris. Réessayez.');
        } finally {
            setFavLoading(false);
        }
    }, [restaurant?.id, isFavorite, user, router]);

    const handleShare = useCallback(async () => {
        if (!restaurant) return;
        void Haptics.selectionAsync();
        try {
            await Share.share({
                title: restaurant.name,
                message: `Découvrez ${restaurant.name} sur KBouffe ! 🍽️\nhttps://kbouffe.com/store/${slug}`,
            });
        } catch {
            // User cancelled share sheet
        }
    }, [restaurant, slug]);

    const handleMoreOptions = useCallback(() => {
        if (!restaurant) return;
        void Haptics.selectionAsync();
        const options = ['Partager', 'Signaler un problème', 'Annuler'] as const;
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: [...options], cancelButtonIndex: options.length - 1, destructiveButtonIndex: 1 },
                (idx) => {
                    if (idx === 0) void handleShare();
                    if (idx === 1) Alert.alert('Signalement', 'Votre signalement a été transmis. Merci.');
                }
            );
        } else {
            Alert.alert(restaurant.name, undefined, [
                { text: 'Partager', onPress: () => void handleShare() },
                { text: 'Signaler un problème', style: 'destructive', onPress: () => Alert.alert('Signalement', 'Votre signalement a été transmis. Merci.') },
                { text: 'Annuler', style: 'cancel' },
            ]);
        }
    }, [restaurant, handleShare]);

    const showCartFab = itemCount > 0 && restaurant && cartRestaurantId === restaurant.id;

    const categoryNames = useMemo(() => {
        if (!data?.products) return [];
        // Build set of category names that actually have products
        const withProducts = new Set<string>();
        data.products.forEach((p) => withProducts.add(p.category ?? 'Autres'));
        // Respect sort_order from the official categories list
        const sorted = (data.categories ?? [])
            .filter((c) => withProducts.has(c.name))
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((c) => c.name);
        // Append catch-all at the end
        if (withProducts.has('Autres')) sorted.push('Autres');
        return sorted;
    }, [data]);

    const sections = useMemo(() => {
        if (!data) return [];
        const grouped: Record<string, MobileProduct[]> = {};
        (data.products ?? []).forEach((p) => {
            const cat = p.category ?? 'Autres';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(p);
        });
        return categoryNames.map((cat) => {
            const items = grouped[cat] ?? [];
            const rows: [MobileProduct, MobileProduct | null][] = [];
            for (let i = 0; i < items.length; i += 2) {
                rows.push([items[i], items[i + 1] ?? null]);
            }
            return { title: cat, data: rows };
        });
    }, [data, categoryNames]);

    // Sync sections ref so the stable viewability callback always reads fresh sections
    useEffect(() => { sectionsRef.current = sections; }, [sections]);

    const handleAddProduct = (product: MobileProduct) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/product-modal',
            params: { productId: product.id, restaurantId: restaurant!.id },
        });
    };

    const handleCartPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/cart');
    }, [router]);

    const handleCategoryPress = useCallback((idx: number) => {
        Haptics.selectionAsync();
        setActiveCategoryIdx(idx);
        // Scroll SectionList to the chosen section
        if (sectionsRef.current[idx]?.data.length > 0) {
            sectionListRef.current?.scrollToLocation({
                sectionIndex: idx,
                itemIndex: 0,
                viewOffset: 4,
                animated: true,
            });
        }
        // Center the pressed tab in the horizontal tabs ScrollView
        const offset = tabOffsetsRef.current[idx];
        if (offset != null) {
            categoryTabsRef.current?.scrollTo({ x: Math.max(0, offset - 60), animated: true });
        }
    }, []);

    // Stable callback — reads sections via ref to avoid re-registering on SectionList
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (!viewableItems.length) return;
        const first = viewableItems.find((v: any) => v.section);
        if (first?.section) {
            const idx = sectionsRef.current.findIndex(s => s.title === first.section.title);
            if (idx >= 0) setActiveCategoryIdx(idx);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 30 }).current;

    const handleHeroScroll = useCallback((e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_W);
        setActiveImageIdx(Math.min(idx, 2)); // Max 3 images
    }, []);

    // Animated scroll state for sticky header
    const scrollY = useSharedValue(0);
    const FIXED_HEADER_HEIGHT = 60;

    const handleAnimatedScroll = useCallback((event: any) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    }, [scrollY]);

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, 50], [0, 1], Extrapolate.CLAMP);
        return {
            position: 'absolute' as const,
            zIndex: 100,
            opacity,
        };
    });

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>{error}</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
                    <Text style={{ color: theme.primary }}>Retour</Text>
                </Pressable>
            </View>
        );
    }

    if (loading && !restaurant) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!restaurant) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>Restaurant introuvable.</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
                    <Text style={{ color: theme.primary }}>Retour</Text>
                </Pressable>
            </View>
        );
    }

    const avgRating = restaurant.rating ?? 0;
    const reviewCount = restaurant.reviewCount ?? 0;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Hero Carousel */}
            <View style={styles.heroSection}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={handleHeroScroll}
                    contentContainerStyle={styles.heroCarousel}
                >
                    {[0, 1, 2].map((idx) => (
                        <View key={idx} style={{ width: HERO_W }}>
                            {restaurant.coverImage ? (
                                <Image
                                    source={{ uri: restaurant.coverImage }}
                                    style={styles.heroImage}
                                    cachePolicy="memory-disk"
                                />
                            ) : (
                                <View style={[styles.heroImage, { backgroundColor: theme.border }]} />
                            )}
                        </View>
                    ))}
                </ScrollView>

                {/* Back Button */}
                <Pressable
                    style={[styles.backButton, { backgroundColor: theme.surface, top: insets.top + Spacing.sm }]}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>

                {/* Favorite & Menu */}
                <View style={[styles.heroControls, { top: insets.top + Spacing.sm }]}>
                    <Pressable
                        style={[styles.heroBtn, { backgroundColor: theme.surface }]}
                        onPress={handleToggleFavorite}
                        disabled={favLoading}
                        hitSlop={8}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFavorite ? '#ef4444' : theme.text}
                        />
                    </Pressable>
                    <Pressable
                        style={[styles.heroBtn, { backgroundColor: theme.surface }]}
                        onPress={handleShare}
                        hitSlop={8}
                    >
                        <Ionicons name="share-outline" size={20} color={theme.text} />
                    </Pressable>
                    <Pressable
                        style={[styles.heroBtn, { backgroundColor: theme.surface }]}
                        onPress={handleMoreOptions}
                        hitSlop={8}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
                    </Pressable>
                </View>

                {/* Pagination dots */}
                <View style={styles.dotRow}>
                    {[0, 1, 2].map((i) => (
                        <PaginationDot key={i} index={i} currentIndex={activeImageIdx} theme={theme} />
                    ))}
                </View>
            </View>

            {/* Restaurant Header */}
            <View style={[styles.restaurantHeader, { backgroundColor: theme.surface }]}>
                <View style={[styles.restaurantLogo, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="storefront" size={24} color={theme.primary} />
                </View>
                <View style={styles.restaurantInfo}>
                    <Text style={[styles.restaurantName, { color: theme.text }]}>{restaurant.name}</Text>
                    <View style={styles.ratingMeta}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={[styles.ratingText, { color: theme.text }]}>
                            {avgRating.toFixed(1)} ({reviewCount.toLocaleString('fr-FR')})
                        </Text>
                        <View style={[styles.metaDot, { backgroundColor: theme.border }]} />
                        <Ionicons name="location-outline" size={11} color={theme.icon} />
                        <Text style={[styles.metaSmall, { color: theme.icon }]} numberOfLines={1}>
                            {restaurant.address ?? 'Douala'}
                        </Text>
                    </View>
                </View>
                <View style={styles.deliveryBadge}>
                    <Ionicons name="bicycle-outline" size={14} color={theme.primary} />
                    <Text style={[styles.deliveryTime, { color: theme.text }]}>
                        {restaurant.estimatedDeliveryTime} min
                    </Text>
                </View>
            </View>

            {/* Delivery Options Tabs */}
            <View style={[styles.deliveryTabs, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                {(
                    [
                        { key: 'delivery' as const, label: 'Livraison', icon: 'bicycle-outline' as const, time: restaurant.estimatedDeliveryTime, fee: restaurant.deliveryFee },
                        { key: 'pickup' as const, label: 'Ramasage', icon: 'bag-handle-outline' as const, time: restaurant.estimatedDeliveryTime - 10, fee: 0 },
                    ]
                ).map((tab) => (
                    <Pressable
                        key={tab.key}
                        style={[
                            styles.deliveryTab,
                            activeDeliveryType === tab.key && [styles.deliveryTabActive, { borderBottomColor: theme.primary }],
                        ]}
                        onPress={() => setActiveDeliveryType(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={16}
                            color={activeDeliveryType === tab.key ? theme.primary : theme.icon}
                        />
                        <Text
                            style={[
                                styles.deliveryTabLabel,
                                { color: activeDeliveryType === tab.key ? theme.primary : theme.icon },
                            ]}
                        >
                            {tab.label}
                        </Text>
                        <Text
                            style={[styles.deliveryTabMeta, { color: activeDeliveryType === tab.key ? theme.primary : theme.icon }]}
                        >
                            {tab.time} min • {tab.fee === 0 ? 'Gratuit' : `${tab.fee} FCFA`}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* ── Reservation CTA ─────────────────────────────────────────────── */}
            {restaurant.hasReservations && (
                <Animated.View
                    entering={FadeInDown.delay(150).duration(400).springify()}
                    style={[styles.reserveCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                    <View style={[styles.reserveIconWrap, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="calendar" size={26} color={theme.primary} />
                    </View>
                    <View style={styles.reserveInfo}>
                        <Text style={[styles.reserveTitle, { color: theme.text }]}>Réservez votre table</Text>
                        <Text style={[styles.reserveSubtitle, { color: theme.icon }]}>
                            Choisissez votre créneau et bloquez votre table en ligne
                        </Text>
                    </View>
                    <Pressable
                        style={({ pressed }) => [
                            styles.reserveBtn,
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push(`/restaurant/${slug}/reserve` as any);
                        }}
                    >
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </Pressable>
                </Animated.View>
            )}

            {/* Promo Banner */}
            <Animated.View
                entering={FadeInDown.delay(200).duration(400).springify()}
                style={[styles.promoBanner, { backgroundColor: '#d97706' + '20', borderColor: '#d97706' + '40' }]}
            >
                <View style={styles.promoContent}>
                    <Ionicons name="gift-outline" size={18} color="#d97706" />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.promoTitle, { color: '#d97706' }]}>Économisez 20%</Text>
                        <Text style={[styles.promoSubtitle, { color: '#92400e' }]}>
                            Sur l&apos;abonnement annuel
                        </Text>
                    </View>
                    <Pressable style={[styles.promoBtn, { backgroundColor: '#d97706' }]}>
                        <Text style={styles.promoBtnText}>Réclamer</Text>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Category Tabs */}
            <ScrollView
                ref={categoryTabsRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryTabs}
            >
                {categoryNames.map((cat, idx) => (
                    <Pressable
                        key={cat}
                        style={[
                            styles.categoryTab,
                            activeCategoryIdx === idx && [styles.categoryTabActive, { backgroundColor: theme.primary }],
                        ]}
                        onPress={() => handleCategoryPress(idx)}
                        onLayout={(e) => { tabOffsetsRef.current[idx] = e.nativeEvent.layout.x; }}
                    >
                        <Text
                            style={[
                                styles.categoryTabLabel,
                                { color: activeCategoryIdx === idx ? '#fff' : theme.text },
                            ]}
                        >
                            {cat}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {loading && sections.length === 0 ? (
                <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.lg, marginTop: Spacing.md }}>
                    <Skeleton height={280} borderRadius={0} />
                    <Skeleton height={120} borderRadius={Radii.xl} />
                    <Skeleton height={160} borderRadius={Radii.xl} />
                </View>
            ) : (
                <SectionList
                    ref={sectionListRef}
                    sections={sections}
                    keyExtractor={(item, idx) => idx.toString()}
                    renderItem={({ item: [product, product2], index }) => (
                        <View key={index} style={styles.productRow}>
                            <View style={{ flex: 1 }}>
                                {product && (
                                    <MenuItemGrid item={product} onAdd={() => handleAddProduct(product)} />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                {product2 && (
                                    <MenuItemGrid item={product2} onAdd={() => handleAddProduct(product2)} />
                                )}
                            </View>
                        </View>
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                            <Text style={[styles.sectionHeaderText, { color: theme.text }]}>{title}</Text>
                        </View>
                    )}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + (showCartFab ? 120 : Spacing.xl) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    maxToRenderPerBatch={6}
                    windowSize={5}
                    initialNumToRender={4}
                    onScroll={handleAnimatedScroll}
                    scrollEventThrottle={16}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    onScrollToIndexFailed={() => {
                        // Retry after a frame if section isn't rendered yet
                        setTimeout(() => {
                            sectionListRef.current?.scrollToLocation({
                                sectionIndex: activeCategoryIdx,
                                itemIndex: 0,
                                animated: true,
                            });
                        }, 100);
                    }}
                />
            )}

            {/* Sticky Header Controls - appears on scroll */}
            <Animated.View
                pointerEvents="box-none"
                style={[styles.stickyHeader, { backgroundColor: theme.background, borderBottomColor: theme.border, top: insets.top, height: FIXED_HEADER_HEIGHT }, headerAnimatedStyle]}
            >
                <Pressable
                    style={[styles.fixedBackButton, { backgroundColor: theme.surface }]}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>

                <View style={styles.fixedControls}>
                    <Pressable
                        style={[styles.fixedBtn, { backgroundColor: theme.surface }]}
                        onPress={handleToggleFavorite}
                        disabled={favLoading}
                        hitSlop={8}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFavorite ? '#ef4444' : theme.text}
                        />
                    </Pressable>
                    <Pressable
                        style={[styles.fixedBtn, { backgroundColor: theme.surface }]}
                        onPress={handleShare}
                        hitSlop={8}
                    >
                        <Ionicons name="share-outline" size={20} color={theme.text} />
                    </Pressable>
                    <Pressable
                        style={[styles.fixedBtn, { backgroundColor: theme.surface }]}
                        onPress={handleMoreOptions}
                        hitSlop={8}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
                    </Pressable>
                </View>
            </Animated.View>

            {/* Cart FAB */}
            {showCartFab && (
                <Animated.View
                    entering={FadeInDown.duration(300).springify()}
                    style={[styles.cartFab, { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.md }]}
                >
                    <Pressable
                        style={styles.cartFabContent}
                        onPress={handleCartPress}
                    >
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{itemCount}</Text>
                        </View>
                        <Text style={styles.cartFabText}>Voir le panier</Text>
                        <Text style={styles.cartFabPrice}>{total.toLocaleString('fr-FR')} FCFA</Text>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { paddingHorizontal: Spacing.md },

    /* Header */
    headerContainer: {},
    heroSection: {
        position: 'relative',
        height: 280,
        marginBottom: Spacing.md,
    },
    heroCarousel: {},
    heroImage: { width: HERO_W, height: 280 },
    backButton: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 101,
    },
    heroControls: {
        position: 'absolute',
        right: Spacing.md,
        flexDirection: 'row',
        gap: Spacing.sm,
        zIndex: 101,
    },
    heroBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotRow: {
        position: 'absolute',
        bottom: Spacing.md,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    dotBase: { height: 6, borderRadius: 3 },

    /* Restaurant Header */
    restaurantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    restaurantLogo: {
        width: 48,
        height: 48,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restaurantInfo: { flex: 1 },
    restaurantName: { ...Typography.bodySemibold, fontSize: 16, marginBottom: 4 },
    ratingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { ...Typography.small, fontWeight: '600' },
    metaDot: { width: 2, height: 2, borderRadius: 1 },
    metaSmall: { ...Typography.small, maxWidth: 100 },
    deliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
    },
    deliveryTime: { ...Typography.small, fontWeight: '600' },

    /* Delivery Tabs */
    deliveryTabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    deliveryTab: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        alignItems: 'center',
        gap: 4,
    },
    deliveryTabActive: {},
    deliveryTabLabel: { ...Typography.small, fontWeight: '600' },
    deliveryTabMeta: { ...Typography.caption, fontSize: 10 },

    /* Promo Banner */
    promoBanner: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        padding: Spacing.md,
    },
    promoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    promoTitle: { ...Typography.bodySemibold, fontSize: 13 },
    promoSubtitle: { ...Typography.small, fontSize: 11 },
    promoBtn: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: Radii.full,
    },
    promoBtnText: { color: '#fff', ...Typography.small, fontWeight: '600' },

    /* Category Tabs */
    categoryTabs: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.md },
    categoryTab: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryTabActive: {},
    categoryTabLabel: { ...Typography.small, fontWeight: '600' },

    /* Section headers in SectionList */
    sectionHeader: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs ?? 4,
    },
    sectionHeaderText: {
        ...Typography.body,
        fontWeight: '700',
    },

    /* Products */
    productRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },

    /* Reservation CTA */
    reserveCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1,
        padding: Spacing.md,
        gap: Spacing.md,
        ...Shadows.sm,
    },
    reserveIconWrap: {
        width: 52,
        height: 52,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    reserveInfo: { flex: 1 },
    reserveTitle: { ...Typography.bodySemibold, fontSize: 14, marginBottom: 2 },
    reserveSubtitle: { ...Typography.small, lineHeight: 16 },
    reserveBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    /* Cart FAB */
    cartFab: {
        position: 'absolute',
        left: Spacing.md,
        right: Spacing.md,
        height: 56,
        borderRadius: Radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.lg,
    },
    cartFabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        flex: 1,
    },
    cartBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cartFabText: { color: '#fff', ...Typography.bodySemibold },
    cartFabPrice: { color: '#fff', ...Typography.bodySemibold },

    /* Sticky Header */
    stickyHeader: {
        left: 0,
        right: 0,
        zIndex: 101,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        overflow: 'hidden',
    },
    /* Fixed Header - deprecated, kept for compatibility */
    fixedHeader: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    fixedBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    fixedControls: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    fixedBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
});
