import { useState, useCallback, useMemo, memo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Pressable,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useRestaurantCache } from '@/contexts/restaurant-context';
import { useHomepage } from '@/hooks/use-homepage';
import type { HomepageSection, SectionRestaurant, MobileRestaurant } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROMO_W = SCREEN_WIDTH - Spacing.md * 2;

// ── Static promo cards (matching web) ─────────────────────────────────────────
const PROMO_CARDS = [
    {
        id: 'brunch',
        bg: '#059669',
        icon: '🥗',
        title: 'Brunch & épicerie fine',
        subtitle: 'Commandez pour ce week-end',
        cta: 'Découvrir',
        target: '/(tabs)/explore',
    },
    {
        id: 'kbouffe-plus',
        bg: '#b45309',
        icon: '🎁',
        title: 'KBouffe+ — 20% offerts',
        subtitle: 'Abonnez-vous et économisez',
        cta: 'En profiter',
        target: null,
    },
    {
        id: 'referral',
        bg: '#f59e0b',
        icon: '🤝',
        title: 'Parrainez, gagnez 1 000 FCFA',
        subtitle: 'Pour chaque ami qui commande',
        cta: 'Parrainer',
        target: null,
    },
];

// ── Memoized sub-components (outside render cycle) ──────────────────────────

const FILTERS = [
    { key: 'offers', icon: '🏷️', label: 'Offres' },
    { key: 'free_delivery', icon: '🚚', label: 'Livraison gratuite' },
    { key: 'fast', icon: '⚡', label: 'Moins de 30 min' },
    { key: 'top', icon: '⭐', label: 'La crème' },
] as const;

const CirclesSection = memo(function CirclesSection({ section, theme, onPress }: { section: HomepageSection; theme: any; onPress: (slug: string) => void }) {
    return (
        <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            {section.subtitle ? (
                <Text style={[styles.sectionSubtitle, { color: theme.icon }]}>{section.subtitle}</Text>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circlesList}>
                {section.restaurants.map(r => (
                    <Pressable
                        key={r.id}
                        style={styles.circleItem}
                        onPress={() => onPress(r.slug)}
                        accessibilityRole="button"
                        accessibilityLabel={r.name}
                    >
                        <View style={[styles.circleAvatar, { borderColor: theme.border }]}>
                            {r.logoUrl ? (
                                <Image source={{ uri: r.logoUrl }} style={styles.circleImg} cachePolicy="memory-disk" recyclingKey={r.id} />
                            ) : (
                                <View style={[styles.circleImg, { backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Text style={{ fontSize: 22 }}>🍽️</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.circleName, { color: theme.text }]} numberOfLines={2}>{r.name}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
});

const CardsSection = memo(function CardsSection({ section, theme, onPress }: { section: HomepageSection; theme: any; onPress: (slug: string) => void }) {
    return (
        <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                    {section.subtitle ? (
                        <Text style={[styles.sectionSubtitle, { color: theme.icon }]}>{section.subtitle}</Text>
                    ) : null}
                </View>
                <Pressable
                    onPress={() => onPress('')}
                    hitSlop={8}
                >
                    <Ionicons name="arrow-forward" size={16} color={theme.primary} />
                </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsList}>
                {section.restaurants.map(r => (
                    <Pressable
                        key={r.id}
                        style={[
                            styles.sectionCard,
                            {
                                backgroundColor: theme.surfaceElevated,
                                borderColor: theme.border,
                            },
                        ]}
                        onPress={() => onPress(r.slug)}
                        accessibilityRole="button"
                        accessibilityLabel={r.name}
                    >
                        <View style={styles.sectionCardImageContainer}>
                            <Image
                                source={{ uri: r.coverUrl ?? undefined }}
                                style={styles.sectionCardImg}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                recyclingKey={r.id}
                                transition={200}
                            />
                            {r.isSponsored && (
                                <View style={[styles.sponsoredPill, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="star" size={10} color="#fff" style={{ marginRight: 3 }} />
                                    <Text style={styles.sponsoredPillText}>Sponsorisé</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.sectionCardInfo}>
                            <Text style={[styles.sectionCardName, { color: theme.text }]} numberOfLines={1}>{r.name}</Text>
                            <View style={styles.sectionCardMeta}>
                                <Ionicons name="star" size={12} color="#fbbf24" />
                                <Text style={[styles.sectionCardMetaTxt, { color: theme.text, fontWeight: '600' }]}>
                                    {r.rating?.toFixed(1) ?? '—'}
                                </Text>
                                {r.cuisineType ? (
                                    <>
                                        <View style={styles.metaDot} />
                                        <Text style={[styles.sectionCardMetaTxt, { color: theme.icon }]} numberOfLines={1}>
                                            {r.cuisineType}
                                        </Text>
                                    </>
                                ) : null}
                            </View>
                            <Text style={[styles.deliveryInfo, { color: theme.icon }]}>
                                <Ionicons name="time-outline" size={11} color={theme.icon} /> {r.estimatedDeliveryTime ?? 30} min • Frais: {r.deliveryFee ?? 500} FCFA
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
});

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { setPreview } = useRestaurantCache();

    const [activeCuisine, setActiveCuisine] = useState<string | undefined>(undefined);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [activePromo, setActivePromo] = useState(0);

    const { categories, sections, loading } = useHomepage(activeCuisine);

    // Flat lookup map slug → restaurant for instant preview on navigation
    const restaurantBySlug = useMemo(() => {
        const map = new Map<string, SectionRestaurant>();
        for (const s of sections) for (const r of s.restaurants) map.set(r.slug, r);
        return map;
    }, [sections]);

    const handleCuisine = useCallback((value: string | undefined) => {
        Haptics.selectionAsync();
        setActiveCuisine(prev => value === prev ? undefined : value);
    }, []);

    const handleFilter = useCallback((key: string) => {
        Haptics.selectionAsync();
        setActiveFilter(prev => (prev === key ? null : key));
    }, []);

    const handlePromoScroll = useCallback((e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / (PROMO_W + Spacing.sm));
        setActivePromo(Math.min(idx, PROMO_CARDS.length - 1));
    }, []);

    const handleRestaurantPress = useCallback((slug: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Pre-populate preview so the restaurant header renders instantly
        const found = restaurantBySlug.get(slug);
        if (found) {
            setPreview({
                id: found.id, name: found.name, slug: found.slug,
                description: null, coverImage: found.coverUrl, logoUrl: found.logoUrl,
                city: null, address: null, cuisineType: found.cuisineType,
                rating: found.rating, reviewCount: found.reviewCount,
                estimatedDeliveryTime: 0, deliveryFee: 0, hasReservations: false,
                deliveryBaseFee: 0, deliveryPerKmFee: 0, maxDeliveryRadiusKm: 0,
                isActive: true, isVerified: found.isVerified, isPremium: found.isPremium,
                isSponsored: found.isSponsored, sponsoredRank: null, lat: null, lng: null,
            } satisfies MobileRestaurant);
        }
        router.push(`/restaurant/${slug}`);
    }, [router, restaurantBySlug, setPreview]);

    const allCategories = useMemo(() => {
        if (categories.length === 0) return [];
        return [{ id: 'all', label: 'Tout', value: '', icon: '🍽️', sort_order: -1 }, ...categories];
    }, [categories]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Simple header */}
            <View style={[styles.simpleHeader, { paddingTop: insets.top }]}>
                <View>
                    <Text style={[styles.headerSmallText, { color: theme.icon }]}>KBOUFFE</Text>
                    <Text style={[styles.headerLargeText, { color: theme.text }]}>Bonjour</Text>
                </View>
                <Pressable
                    style={[styles.cartButton, { backgroundColor: theme.primaryLight }]}
                    onPress={() => router.push('/(tabs)/orders')}
                >
                    <Ionicons name="cart" size={20} color={theme.primary} />
                    <View style={[styles.cartBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.cartBadgeText}>2</Text>
                    </View>
                </Pressable>
            </View>

            {loading && sections.length === 0 ? (
                <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.lg, marginTop: Spacing.md }}>
                    <Skeleton height={48} borderRadius={Radii.lg} />
                    <Skeleton height={40} borderRadius={Radii.full} />
                    <Skeleton height={160} borderRadius={Radii.xl} />
                    <Skeleton height={200} borderRadius={Radii.xl} />
                    <Skeleton height={200} borderRadius={Radii.xl} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                >

                    {/* Categories */}
                    {allCategories.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryList}
                        >
                            {allCategories.map(cat => {
                                const isActive = cat.value === '' ? !activeCuisine : activeCuisine === cat.value;
                                return (
                                    <Pressable
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            {
                                                backgroundColor: isActive ? theme.primary : theme.surfaceElevated,
                                                borderColor: isActive ? theme.primary : theme.border,
                                            },
                                        ]}
                                        onPress={() => handleCuisine(cat.value || undefined)}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                        <Text style={[styles.categoryLabel, { color: isActive ? '#fff' : theme.text }]}>{cat.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Filters */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterList}
                    >
                        {FILTERS.map(f => {
                            const isActive = activeFilter === f.key;
                            return (
                                <Pressable
                                    key={f.key}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: isActive ? theme.primaryLight : theme.surfaceElevated,
                                            borderColor: isActive ? theme.primary : theme.border,
                                        },
                                    ]}
                                    onPress={() => handleFilter(f.key)}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.filterIcon}>{f.icon}</Text>
                                    <Text style={[styles.filterLabel, { color: isActive ? theme.primary : theme.text }]}>{f.label}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Featured Section Header */}
                    <View style={styles.sectionHeaderContainer}>
                        <View style={styles.sectionHeaderText}>
                            <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>En vedette</Text>
                            <Text style={[styles.sectionHeaderSubtitle, { color: theme.icon }]}>Restaurants populaires</Text>
                        </View>
                        <Pressable
                            onPress={() => router.push('/(tabs)/explore')}
                            hitSlop={8}
                        >
                            <Ionicons name="arrow-forward" size={18} color={theme.primary} />
                        </Pressable>
                    </View>

                    {/* Promo carousel */}
                    <View style={{ marginBottom: Spacing.lg }}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={PROMO_W + Spacing.sm}
                            decelerationRate="fast"
                            onMomentumScrollEnd={handlePromoScroll}
                            contentContainerStyle={styles.promoList}
                        >
                            {PROMO_CARDS.map(promo => (
                                <Pressable
                                    key={promo.id}
                                    style={[styles.promoCard, { width: PROMO_W, backgroundColor: promo.bg }]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        if (promo.target) router.push(promo.target as any);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Promotion: ${promo.title}`}
                                >
                                    <Text style={styles.promoEmoji}>{promo.icon}</Text>
                                    <View style={styles.promoTextBox}>
                                        <Text style={styles.promoTitle}>{promo.title}</Text>
                                        <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                                    </View>
                                    <View style={styles.promoCta}>
                                        <Text style={styles.promoCtaText}>{promo.cta}</Text>
                                        <Ionicons name="arrow-forward" size={13} color="#fff" />
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>
                        <View style={styles.dotRow}>
                            {PROMO_CARDS.map((_, i) => (
                                <PaginationDot key={i} index={i} currentIndex={activePromo} theme={theme} />
                            ))}
                        </View>
                    </View>

                    {/* Filter out empty sections and check if any restaurants exist */}
                    {(() => {
                        const nonEmptySections = sections.filter(s => s.restaurants && s.restaurants.length > 0);
                        const hasNoResults = nonEmptySections.length === 0 && activeCuisine;

                        if (hasNoResults) {
                            return (
                                <EmptyState
                                    icon="fastfood-outline"
                                    title="Aucun restaurant trouvé"
                                    subtitle={`Pas de restaurant avec cette catégorie en ce moment.\nEssayez une autre catégorie ou explorez tous les restaurants.`}
                                    primaryAction={{
                                        label: 'Voir tous les restaurants',
                                        onPress: () => {
                                            setActiveCuisine(undefined);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        },
                                    }}
                                    secondaryAction={{
                                        label: 'Autres catégories',
                                        onPress: handleOpenExplore,
                                    }}
                                />
                            );
                        }

                        return nonEmptySections.map(section =>
                            section.display_style === 'circles' ? (
                                <CirclesSection key={section.id} section={section} theme={theme} onPress={handleRestaurantPress} />
                            ) : (
                                <CardsSection key={section.id} section={section} theme={theme} onPress={handleRestaurantPress} />
                            )
                        );
                    })()}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    simpleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    headerSmallText: {
        ...Typography.caption,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    headerLargeText: {
        ...Typography.title1,
        fontWeight: '700',
        marginTop: 2,
    },
    cartButton: {
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xs,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    addressBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
        ...Shadows.sm,
    },
    addressLabel: {
        ...Typography.small,
        fontWeight: '500',
    },
    addressValue: {
        ...Typography.bodySemibold,
        marginTop: 2,
    },
    greeting: { ...Typography.caption, marginBottom: 2 },
    headline: { ...Typography.title2 },
    cartBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    cartBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.md,
        paddingHorizontal: Spacing.md,
        height: 48,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    searchInput: { ...Typography.body, flex: 1 },
    // Category strip
    categoryList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    categoryIcon: { fontSize: 16 },
    categoryLabel: { ...Typography.small, fontWeight: '600' },
    // Filter chips
    filterList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm, marginTop: 4 },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.md,
        paddingVertical: 9,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    filterIcon: { fontSize: 14 },
    filterLabel: { ...Typography.small, fontWeight: '500' },
    // Promo carousel
    promoList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    promoCard: {
        height: 164,
        borderRadius: Radii.xxl,
        padding: Spacing.lg,
        justifyContent: 'space-between',
        ...Shadows.md,
    },
    promoEmoji: { fontSize: 36 },
    promoTextBox: { flex: 1, justifyContent: 'flex-end', marginBottom: Spacing.sm },
    promoTitle: { color: '#fff', ...Typography.headline, fontWeight: '800', marginBottom: 4 },
    promoSubtitle: { color: 'rgba(255,255,255,0.85)', ...Typography.caption },
    promoCta: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.16)',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        gap: 5,
    },
    promoCtaText: { color: '#fff', ...Typography.small, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm, marginBottom: Spacing.md },
    dotBase: { height: 6, borderRadius: 3 },
    // Featured section header
    sectionHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        marginTop: Spacing.xs,
    },
    sectionHeaderText: {
        flex: 1,
    },
    sectionHeaderTitle: {
        ...Typography.title3,
        marginBottom: 2,
    },
    sectionHeaderSubtitle: {
        ...Typography.small,
    },
    // Sections
    sectionBlock: { marginTop: Spacing.xl },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    sectionTitle: { ...Typography.title3, marginBottom: 2 },
    sectionSubtitle: { ...Typography.caption },
    // Circles section
    circlesList: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.sm },
    circleItem: { alignItems: 'center', width: 84 },
    circleAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        overflow: 'hidden',
        borderWidth: 2,
        marginBottom: 8,
    },
    circleImg: { width: '100%', height: '100%' },
    circleName: { ...Typography.small, fontSize: 11, textAlign: 'center' as const, lineHeight: 15 },
    // Cards section
    cardsList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
    sectionCard: {
        width: 220,
        borderRadius: Radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        ...Shadows.md,
    },
    sectionCardImageContainer: {
        width: '100%',
        height: 132,
        position: 'relative' as const,
    },
    sectionCardImg: { width: '100%', height: '100%' },
    sponsoredPill: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
        ...Shadows.sm,
    },
    sponsoredPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    sectionCardInfo: { padding: Spacing.md, flex: 1 },
    sectionCardName: { ...Typography.captionSemibold, fontWeight: '700', marginBottom: 4 },
    sectionCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    sectionCardMetaTxt: { fontSize: 11 },
    deliveryInfo: { fontSize: 11, marginTop: 2, lineHeight: 16 },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' },
});

function PaginationDot({ index, currentIndex, theme }: { index: number; currentIndex: number; theme: any }) {
    const isActive = index === currentIndex;
    const animatedStyle = useAnimatedStyle(() => ({
        width: withSpring(isActive ? 20 : 8, { damping: 15 }),
        backgroundColor: withTiming(isActive ? theme.primary : theme.border, { duration: 300 }),
    }));
    return <Animated.View style={[styles.dotBase, animatedStyle]} />;
}
