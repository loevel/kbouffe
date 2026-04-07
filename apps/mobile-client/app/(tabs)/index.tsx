import { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ScrollView,
    Pressable,
    Image,
    TextInput,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useHomepage } from '@/hooks/use-homepage';
import { useLoyalty } from '@/contexts/loyalty-context';
import type { SectionRestaurant, HomepageSection } from '@/lib/api';

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

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { itemCount } = useCart();
    const { isRestaurantFavorite, toggleRestaurantFavorite } = useLoyalty();

    const [homeSearch, setHomeSearch] = useState('');
    const [activeCuisine, setActiveCuisine] = useState<string | undefined>(undefined);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [activePromo, setActivePromo] = useState(0);

    const { categories, sections, loading } = useHomepage(activeCuisine);

    const firstName = (user?.fullName ?? 'vous').split(' ')[0];

    const handleOpenExplore = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/(tabs)/explore',
            params: homeSearch.trim() ? { q: homeSearch.trim() } : undefined,
        });
    };

    const handleCuisine = (value: string | undefined) => {
        Haptics.selectionAsync();
        setActiveCuisine(value === activeCuisine ? undefined : value);
    };

    const handleFilter = (key: string) => {
        Haptics.selectionAsync();
        setActiveFilter(prev => (prev === key ? null : key));
    };

    // ── Sub-components ────────────────────────────────────────────────────────

    const Header = () => (
        <View style={styles.headerTop}>
            <View>
                <Text style={[styles.greeting, { color: theme.icon }]}>Bonjour, {firstName} 👋</Text>
                <Text style={[styles.headline, { color: theme.text }]}>Où mangeons-nous ?</Text>
            </View>
            <Pressable
                style={[styles.cartBtn, { backgroundColor: theme.border }]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/cart');
                }}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir le panier"
                hitSlop={8}
            >
                <Ionicons name="cart-outline" size={22} color={theme.text} />
                {itemCount > 0 && (
                    <View style={[styles.cartBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.cartBadgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                    </View>
                )}
            </Pressable>
        </View>
    );

    const SearchBar = () => (
        <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.background }]}>
            <Ionicons name="search" size={20} color={theme.icon} style={{ marginRight: Spacing.sm }} />
            <TextInput
                placeholder="Rechercher un plat, un restaurant..."
                placeholderTextColor={theme.icon}
                value={homeSearch}
                onChangeText={setHomeSearch}
                onSubmitEditing={handleOpenExplore}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
            />
            {homeSearch.length > 0 ? (
                <Pressable onPress={() => setHomeSearch('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={theme.icon} />
                </Pressable>
            ) : null}
            <Pressable onPress={handleOpenExplore} style={{ marginLeft: Spacing.xs }} hitSlop={8}>
                <Ionicons name="arrow-forward-circle" size={22} color={theme.primary} />
            </Pressable>
        </View>
    );

    const CategoryStrip = () => {
        if (categories.length === 0) return null;
        const all = [{ id: 'all', label: 'Tout', value: '', icon: '🍽️', sort_order: -1 }, ...categories];
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
            >
                {all.map(cat => {
                    const isActive = cat.value === '' ? !activeCuisine : activeCuisine === cat.value;
                    return (
                        <Pressable
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                { backgroundColor: isActive ? theme.primary : theme.border },
                            ]}
                            onPress={() => handleCuisine(cat.value || undefined)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.categoryIcon}>{cat.icon}</Text>
                            <Text style={[styles.categoryLabel, { color: isActive ? '#fff' : theme.text }]}>
                                {cat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        );
    };

    const FilterChips = () => {
        const filters = [
            { key: 'offers', icon: '🏷️', label: 'Offres' },
            { key: 'free_delivery', icon: '🚚', label: 'Livraison gratuite' },
            { key: 'fast', icon: '⚡', label: 'Moins de 30 min' },
            { key: 'top', icon: '⭐', label: 'La crème' },
        ];
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
            >
                {filters.map(f => {
                    const isActive = activeFilter === f.key;
                    return (
                        <Pressable
                            key={f.key}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: isActive ? theme.primary + '18' : theme.background,
                                    borderColor: isActive ? theme.primary : theme.border,
                                },
                            ]}
                            onPress={() => handleFilter(f.key)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.filterIcon}>{f.icon}</Text>
                            <Text style={[styles.filterLabel, { color: isActive ? theme.primary : theme.text }]}>
                                {f.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        );
    };

    const PromoCarousel = () => (
        <>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={PROMO_W + Spacing.sm}
                decelerationRate="fast"
                onMomentumScrollEnd={e => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / (PROMO_W + Spacing.sm));
                    setActivePromo(Math.min(idx, PROMO_CARDS.length - 1));
                }}
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
        </>
    );

    const CirclesSection = ({ section }: { section: HomepageSection }) => (
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
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/restaurant/${r.slug}`);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={r.name}
                    >
                        <View style={[styles.circleAvatar, { borderColor: theme.border }]}>
                            {r.logoUrl ? (
                                <Image source={{ uri: r.logoUrl }} style={styles.circleImg} />
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

    const CardsSection = ({ section }: { section: HomepageSection }) => (
        <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            {section.subtitle ? (
                <Text style={[styles.sectionSubtitle, { color: theme.icon }]}>{section.subtitle}</Text>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsList}>
                {section.restaurants.map(r => (
                    <Pressable
                        key={r.id}
                        style={[styles.sectionCard, { backgroundColor: theme.background, borderColor: theme.border }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/restaurant/${r.slug}`);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={r.name}
                    >
                        <Image
                            source={{ uri: r.coverUrl ?? undefined }}
                            style={styles.sectionCardImg}
                            resizeMode="cover"
                        />
                        {r.isSponsored && (
                            <View style={[styles.sponsoredPill, { backgroundColor: theme.primary }]}>
                                <Text style={styles.sponsoredPillText}>Sponsorisé</Text>
                            </View>
                        )}
                        <View style={styles.sectionCardInfo}>
                            <Text style={[styles.sectionCardName, { color: theme.text }]} numberOfLines={1}>{r.name}</Text>
                            <View style={styles.sectionCardMeta}>
                                <Ionicons name="star" size={11} color={theme.primary} />
                                <Text style={[styles.sectionCardMetaTxt, { color: theme.icon }]}>
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
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

    const ListHeader = () => (
        <>
            <Header />
            <SearchBar />
            <CategoryStrip />
            <FilterChips />
            <View style={{ marginTop: Spacing.md }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Offres du moment</Text>
                <PromoCarousel />
            </View>
            {sections.map(section =>
                section.display_style === 'circles' ? (
                    <CirclesSection key={section.id} section={section} />
                ) : (
                    <CardsSection key={section.id} section={section} />
                )
            )}
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 20) + Spacing.sm }]}>
            {loading && sections.length === 0 ? (
                <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.lg, marginTop: Spacing.md }}>
                    <Skeleton height={48} borderRadius={Radii.lg} />
                    <Skeleton height={40} borderRadius={Radii.full} />
                    <Skeleton height={160} borderRadius={Radii.xl} />
                    <Skeleton height={200} borderRadius={Radii.xl} />
                    <Skeleton height={200} borderRadius={Radii.xl} />
                </View>
            ) : (
                <FlatList
                    data={[]}
                    keyExtractor={() => ''}
                    renderItem={null}
                    contentContainerStyle={{ paddingBottom: Spacing.xxl }}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={<ListHeader />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    greeting: { ...Typography.caption, marginBottom: 2 },
    headline: { ...Typography.title2 },
    cartBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingVertical: 8,
        borderRadius: Radii.full,
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
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    filterIcon: { fontSize: 14 },
    filterLabel: { ...Typography.small, fontWeight: '500' },
    // Promo carousel
    promoList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    promoCard: {
        height: 140,
        borderRadius: Radii.xl,
        padding: Spacing.md,
        justifyContent: 'space-between',
        ...Shadows.md,
    },
    promoEmoji: { fontSize: 32 },
    promoTextBox: { flex: 1, justifyContent: 'flex-end', marginBottom: Spacing.sm },
    promoTitle: { color: '#fff', ...Typography.captionSemibold, fontWeight: '800', marginBottom: 2 },
    promoSubtitle: { color: 'rgba(255,255,255,0.85)', ...Typography.caption },
    promoCta: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.25)',
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radii.full,
        gap: 5,
    },
    promoCtaText: { color: '#fff', ...Typography.small, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm, marginBottom: Spacing.md },
    dotBase: { height: 6, borderRadius: 3 },
    // Sections
    sectionBlock: { marginTop: Spacing.lg },
    sectionTitle: { ...Typography.title3, marginBottom: 4, paddingHorizontal: Spacing.md },
    sectionSubtitle: { ...Typography.caption, marginBottom: Spacing.sm, paddingHorizontal: Spacing.md },
    // Circles section
    circlesList: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.sm },
    circleItem: { alignItems: 'center', width: 72 },
    circleAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 2,
        marginBottom: 6,
    },
    circleImg: { width: '100%', height: '100%' },
    circleName: { ...Typography.small, fontSize: 11, textAlign: 'center' as const, lineHeight: 14 },
    // Cards section
    cardsList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
    sectionCard: {
        width: 180,
        borderRadius: Radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        ...Shadows.sm,
    },
    sectionCardImg: { width: '100%', height: 110 },
    sponsoredPill: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    sponsoredPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    sectionCardInfo: { padding: Spacing.sm },
    sectionCardName: { ...Typography.caption, fontWeight: '600', marginBottom: 4 },
    sectionCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sectionCardMetaTxt: { fontSize: 11 },
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

