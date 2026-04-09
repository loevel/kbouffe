import { StyleSheet, View, Text, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, LinearTransition } from 'react-native-reanimated';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import { useLoyalty } from '@/contexts/loyalty-context';
import type { MobileRestaurant } from '@/lib/api';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FavoritesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { restaurants } = useRestaurants();
    const { favoriteRestaurantIds, toggleRestaurantFavorite } = useLoyalty();

    const favorites = restaurants.filter((r) => favoriteRestaurantIds.includes(r.id));

    const handleRemoveFavorite = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toggleRestaurantFavorite(id);
    };

    const renderRestaurant = ({ item, index }: { item: MobileRestaurant; index: number }) => (
        <AnimatedPressable
            entering={FadeInDown.delay(index * 80).duration(400).springify()}
            layout={LinearTransition.springify()}
            style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.surface },
                Shadows.md,
                pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/restaurant/${item.slug}`);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${item.name}`}
        >
            {/* ── Cover image with gradient overlay ── */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.coverImage ?? undefined }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)']}
                    style={styles.imageGradient}
                />

                {/* Rating badge */}
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.ratingBadgeText}>
                        {(item.rating ?? 0).toFixed(1)}
                    </Text>
                    <Text style={styles.ratingBadgeCount}>({item.reviewCount ?? 0})</Text>
                </View>

                {/* Heart remove button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.heartButton,
                        pressed && { transform: [{ scale: 0.85 }] },
                    ]}
                    onPress={() => handleRemoveFavorite(item.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer ${item.name} des favoris`}
                >
                    <Ionicons name="heart" size={22} color="#ef4444" />
                </Pressable>

                {/* Restaurant name overlay */}
                <View style={styles.imageOverlayText}>
                    <Text style={styles.nameOverlay} numberOfLines={1}>{item.name}</Text>
                    {item.cuisineType ? (
                        <Text style={styles.cuisineOverlay}>{item.cuisineType}</Text>
                    ) : null}
                </View>
            </View>

            {/* ── Info footer ── */}
            <View style={styles.cardBody}>
                <View style={styles.tagsRow}>
                    <View style={[styles.tag, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="time-outline" size={13} color={theme.primary} />
                        <Text style={[styles.tagText, { color: theme.primary }]}>
                            {item.estimatedDeliveryTime ?? 30} min
                        </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: item.deliveryFee === 0 ? '#dcfce7' : theme.background }]}>
                        <Ionicons
                            name="bicycle-outline"
                            size={13}
                            color={item.deliveryFee === 0 ? '#16a34a' : theme.icon}
                        />
                        <Text style={[styles.tagText, { color: item.deliveryFee === 0 ? '#16a34a' : theme.icon }]}>
                            {item.deliveryFee === 0 ? 'Gratuit' : `${item.deliveryFee} FCFA`}
                        </Text>
                    </View>
                    {item.isSponsored && (
                        <View style={[styles.tag, { backgroundColor: theme.primary + '18' }]}>
                            <Ionicons name="megaphone-outline" size={12} color={theme.primary} />
                            <Text style={[styles.tagText, { color: theme.primary }]}>Sponsorisé</Text>
                        </View>
                    )}
                </View>
            </View>
        </AnimatedPressable>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* ── Header ── */}
            <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Retour"
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Mes favoris</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            {favorites.length > 0 && (
                <Animated.Text
                    entering={FadeIn.delay(100).duration(300)}
                    style={[styles.headerSubtitle, { color: theme.icon }]}
                >
                    {favorites.length} restaurant{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
                </Animated.Text>
            )}

            <FlatList
                data={favorites}
                keyExtractor={item => item.id}
                renderItem={renderRestaurant}
                contentContainerStyle={{
                    padding: Spacing.md,
                    paddingBottom: insets.bottom + Spacing.xl,
                    gap: Spacing.md,
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.empty}>
                        <View style={[styles.emptyIconWrapper, { backgroundColor: theme.primaryLight }]}>
                            <Ionicons name="heart-outline" size={48} color={theme.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            Pas encore de favoris
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>
                            Appuyez sur le cœur d'un restaurant pour le sauvegarder ici et y accéder rapidement.
                        </Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.exploreBtn,
                                { backgroundColor: theme.primary },
                                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(tabs)/explore');
                            }}
                            accessibilityRole="button"
                        >
                            <Ionicons name="compass-outline" size={18} color="#fff" />
                            <Text style={styles.exploreBtnText}>Explorer les restaurants</Text>
                        </Pressable>
                    </Animated.View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    headerTitle: { ...Typography.title3 },
    headerSubtitle: {
        ...Typography.caption,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
    },

    // ── Card ──
    card: {
        borderRadius: Radii.xl,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: 180,
    },
    imageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },

    // ── Rating badge (top-left) ──
    ratingBadge: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    ratingBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    ratingBadgeCount: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '500',
    },

    // ── Heart button (top-right) ──
    heartButton: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        ...Shadows.md,
    },

    // ── Name overlay on image ──
    imageOverlayText: {
        position: 'absolute',
        bottom: Spacing.sm,
        left: Spacing.md,
        right: Spacing.md,
    },
    nameOverlay: {
        color: '#fff',
        ...Typography.headline,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    cuisineOverlay: {
        color: 'rgba(255,255,255,0.85)',
        ...Typography.small,
        marginTop: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // ── Card body ──
    cardBody: {
        padding: Spacing.md,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 6,
        borderRadius: Radii.full,
    },
    tagText: {
        ...Typography.small,
        fontWeight: '600',
    },

    // ── Empty state ──
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    emptyIconWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    emptyTitle: { ...Typography.title3, textAlign: 'center' },
    emptyText: {
        ...Typography.body,
        textAlign: 'center',
        lineHeight: 22,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radii.full,
        marginTop: Spacing.sm,
    },
    exploreBtnText: {
        color: '#fff',
        ...Typography.body,
        fontWeight: '700',
    },
});
