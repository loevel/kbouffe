import { useMemo, useState } from 'react';
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
    NativeSyntheticEvent,
    NativeScrollEvent,
    ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { MOCK_PROMOS } from '@/data/mocks';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import type { MobileRestaurant } from '@/lib/api';
import { useLoyalty } from '@/contexts/loyalty-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROMO_W = SCREEN_WIDTH - Spacing.md * 2;
const PROMO_H = 180;

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { itemCount } = useCart();
    const [activePromo, setActivePromo] = useState(0);
    const [homeSearch, setHomeSearch] = useState('');
    const { isRestaurantFavorite, toggleRestaurantFavorite } = useLoyalty();

    const firstName = (user?.fullName ?? 'vous').split(' ')[0];

    const { restaurants, loading: loadingRestaurants } = useRestaurants();

    const sponsored = useMemo(
        () => restaurants
            .filter(r => r.isSponsored)
            .sort((a, b) => (a.sponsoredRank ?? 99) - (b.sponsoredRank ?? 99)),
        [restaurants],
    );
    const regular = useMemo(() => restaurants.filter(r => !r.isSponsored), [restaurants]);

    const handlePromoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / (PROMO_W + Spacing.sm));
        setActivePromo(Math.min(idx, MOCK_PROMOS.length - 1));
    };

    const handleOpenExplore = () => {
        router.push({
            pathname: '/(tabs)/explore',
            params: homeSearch.trim() ? { q: homeSearch.trim() } : undefined,
        });
    };

    const ListHeader = () => (
        <>
            {/* Header: greeting + cart */}
            <View style={styles.headerTop}>
                <View>
                    <Text style={[styles.greeting, { color: theme.icon }]}>Bonjour, {firstName} 👋</Text>
                    <Text style={[styles.headline, { color: theme.text }]}>Où mangeons-nous ?</Text>
                </View>
                <Pressable
                    style={[styles.cartBtn, { backgroundColor: theme.border }]}
                    onPress={() => router.push('/cart')}
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

            {/* Search → explore */}
            <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.background }]}> 
                <Ionicons name="search" size={20} color={theme.icon} style={{ marginRight: Spacing.sm }} />
                <TextInput
                    placeholder="Rechercher un plat, un restaurant..."
                    placeholderTextColor={theme.icon}
                    value={homeSearch}
                    onChangeText={setHomeSearch}
                    onSubmitEditing={handleOpenExplore}
                    returnKeyType="search"
                    style={[styles.searchPlaceholder, { color: theme.text }]}
                />
                {homeSearch.length > 0 ? (
                    <Pressable
                        onPress={() => setHomeSearch('')}
                        accessibilityRole="button"
                        accessibilityLabel="Effacer la recherche"
                        hitSlop={8}
                    >
                        <Ionicons name="close-circle" size={20} color={theme.icon} />
                    </Pressable>
                ) : null}
                <Pressable
                    onPress={handleOpenExplore}
                    style={{ marginLeft: Spacing.xs }}
                    accessibilityRole="button"
                    accessibilityLabel="Lancer la recherche"
                    hitSlop={8}
                >
                    <Ionicons name="arrow-forward-circle" size={22} color={theme.primary} />
                </Pressable>
            </View>

            {/* Promo carousel */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Offres du moment</Text>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handlePromoScroll}
                scrollEventThrottle={16}
                snapToInterval={PROMO_W + Spacing.sm}
                decelerationRate="fast"
                contentContainerStyle={styles.promoList}
            >
                {MOCK_PROMOS.map((promo) => (
                    <Pressable
                        key={promo.id}
                        onPress={() => promo.target && router.push(promo.target as any)}
                        style={[styles.promoCardContainer, { width: PROMO_W }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Promotion: ${promo.title}`}
                    >
                        <ImageBackground 
                            source={promo.image} 
                            style={styles.promoCard}
                            imageStyle={{ borderRadius: Radii.xl }}
                        >
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.85)']}
                                style={styles.promoOverlay}
                            >
                                <View style={styles.promoContent}>
                                    <View style={styles.promoTextContainer}>
                                        <Text style={styles.promoTitle}>{promo.title}</Text>
                                        <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                                    </View>
                                    <View style={[styles.promoCta, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.promoCtaText}>{promo.cta}</Text>
                                        <Ionicons name="arrow-forward" size={14} color="#fff" />
                                    </View>
                                </View>
                            </LinearGradient>
                        </ImageBackground>
                    </Pressable>
                ))}
            </ScrollView>
            <View style={styles.dotRow}>
                {MOCK_PROMOS.map((_, i) => (
                    <PaginationDot key={i} index={i} currentIndex={activePromo} theme={theme} />
                ))}
            </View>

            {/* Sponsored section */}
            {sponsored.length > 0 && (
                <>
                    <View style={styles.sectionRow}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Mis en avant</Text>
                        <View style={[styles.sponsoredTag, { backgroundColor: theme.primary + '18' }]}>
                            <Ionicons name="megaphone-outline" size={12} color={theme.primary} />
                            <Text style={[styles.sponsoredTagLabel, { color: theme.primary }]}>Sponsorisé</Text>
                        </View>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.sponsoredList}
                    >
                        {sponsored.map(r => (
                            <Pressable
                                key={r.id}
                                style={[styles.sponsoredCard, { backgroundColor: theme.background, borderColor: theme.border }]}
                                onPress={() => router.push(`/restaurant/${r.slug}`)}
                                accessibilityRole="button"
                                accessibilityLabel={`Restaurant sponsorisé ${r.name}`}
                            >
                                <Image source={{ uri: r.coverImage ?? undefined }} style={styles.sponsoredImg} resizeMode="cover" />
                                <View style={[styles.sponsoredPill, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.sponsoredPillText}>Sponsorisé</Text>
                                </View>
                                <View style={styles.sponsoredInfoBox}>
                                    <Text style={[styles.sponsoredName, { color: theme.text }]} numberOfLines={1}>{r.name}</Text>
                                    <View style={styles.sponsoredMeta}>
                                        <Ionicons name="star" size={12} color={theme.primary} />
                                        <Text style={[styles.sponsoredMetaTxt, { color: theme.icon }]}>{r.rating?.toFixed(1)}</Text>
                                        <View style={styles.metaDot} />
                                        <Text style={[styles.sponsoredMetaTxt, { color: theme.icon }]}>{r.estimatedDeliveryTime} min</Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </>
            )}

            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.md }]}>
                Populaire près de vous
            </Text>
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 20) + Spacing.sm }]}>
            {loadingRestaurants && restaurants.length === 0 && (
                <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.lg, marginTop: Spacing.md }}>
                    <Skeleton height={260} borderRadius={Radii.xl} />
                    <Skeleton height={260} borderRadius={Radii.xl} />
                    <Skeleton height={260} borderRadius={Radii.xl} />
                </View>
            )}
            <FlatList
                data={regular}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<ListHeader />}
                renderItem={({ item }) => (
                    <RestaurantCard
                        restaurant={item as never}
                        onPress={() => router.push(`/restaurant/${item.slug}`)}
                        isFavorite={isRestaurantFavorite(item.id)}
                        onToggleFavorite={() => toggleRestaurantFavorite(item.id)}
                    />
                )}
            />
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
        marginBottom: Spacing.lg,
    },
    searchPlaceholder: { ...Typography.body, flex: 1 },
    sectionTitle: { ...Typography.title3, marginBottom: Spacing.md, paddingHorizontal: Spacing.md },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    sponsoredTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    sponsoredTagLabel: { fontSize: 11, fontWeight: '600' },
    promoList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    promoCardContainer: {
        height: PROMO_H,
        borderRadius: Radii.xl,
        ...Shadows.md,
    },
    promoCard: {
        flex: 1,
        borderRadius: Radii.xl,
        overflow: 'hidden',
    },
    promoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: Spacing.md,
    },
    promoContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    promoTextContainer: {
        flex: 1,
        marginRight: Spacing.md,
    },
    promoTitle: { 
        color: '#fff', 
        ...Typography.title3,
        fontWeight: '800', 
        marginBottom: 2,
    },
    promoSubtitle: { 
        color: 'rgba(255,255,255,0.9)', 
        ...Typography.caption,
    },
    promoCta: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    promoCtaText: {
        color: '#fff',
        ...Typography.small,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm, marginBottom: Spacing.lg },
    dotBase: { height: 6, borderRadius: 3 },
    sponsoredList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xs },
    sponsoredCard: {
        width: 200,
        borderRadius: Radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        ...Shadows.sm,
    },
    sponsoredImg: { width: '100%', height: 110 },
    sponsoredPill: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    sponsoredPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    sponsoredInfoBox: { padding: Spacing.sm },
    sponsoredName: { ...Typography.caption, fontWeight: '600', marginBottom: 4 },
    sponsoredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sponsoredMetaTxt: { fontSize: 11 },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' },
});

function PaginationDot({ index, currentIndex, theme }: { index: number, currentIndex: number, theme: any }) {
    const isActive = index === currentIndex;
    
    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: withSpring(isActive ? 20 : 8, { damping: 15 }),
            backgroundColor: withTiming(isActive ? theme.primary : theme.border, { duration: 300 }),
        };
    });

    return <Animated.View style={[styles.dotBase, animatedStyle]} />;
}
