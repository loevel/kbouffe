import { useState, useCallback, useEffect, useMemo } from 'react';
import {
    StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity,
    Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import { useApiCacheContext } from '@/contexts/api-cache-context';
import { getCuisineCategories, type CuisineCategory } from '@/lib/api';
import * as Haptics from 'expo-haptics';
import { calculateDistance, formatDistance, getUserLocation, type UserLocation } from '@/lib/location-utils';
import { RestaurantListSkeleton } from '@/components/ui/Skeleton';

// Types
interface RecentSearch {
    id: string;
    query: string;
    timestamp: number;
}

// Quick filter chips shown below search
const QUICK_FILTERS = [
    { key: 'offers', label: 'Offres', icon: 'pricetag-outline' as const },
    { key: 'verified', label: 'Vérifiés', icon: 'checkmark-circle-outline' as const },
    { key: 'fast', label: '< 30 min', icon: 'flash-outline' as const },
    { key: 'top', label: 'La crème', icon: 'star-outline' as const },
];

export default function ExploreScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { restaurants, loading } = useRestaurants();
    const cache = useApiCacheContext();

    const [categories, setCategories] = useState<CuisineCategory[]>(() =>
        cache.getStale<CuisineCategory[]>('homepage:categories') ?? [],
    );

    useEffect(() => {
        cache.withSWR(
            'homepage:categories',
            getCuisineCategories,
            60 * 60 * 1000,
            setCategories,
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
        { id: '1', query: 'poutine', timestamp: Date.now() - 86400000 },
        { id: '2', query: 'restaurant', timestamp: Date.now() - 259200000 },
        { id: '3', query: 'Kebab', timestamp: Date.now() - 345600000 },
        { id: '4', query: 'poulet', timestamp: Date.now() - 432000000 },
        { id: '5', query: 'costo', timestamp: Date.now() - 518400000 },
        { id: '6', query: 'kebab parus', timestamp: Date.now() - 604800000 },
        { id: '7', query: 'rice', timestamp: Date.now() - 691200000 },
    ]);

    useEffect(() => {
        (async () => {
            const location = await getUserLocation();
            if (location) setUserLocation(location);
        })();
    }, []);

    // Get unique cuisines from restaurants
    const uniqueCuisines = useMemo(() => {
        const cuisines = new Set(
            restaurants
                .map(r => r.cuisineType)
                .filter((c): c is string => c !== null && c !== undefined)
        );
        return Array.from(cuisines).sort();
    }, [restaurants]);

    // Filter restaurants — no location pre-filter so all restaurants appear in search
    const filteredRestaurants = useMemo(() => {
        let results = [...restaurants];

        // Text search across name, cuisineType, description, city
        const query = search.trim().toLowerCase();
        if (query) {
            results = results.filter(r =>
                r.name.toLowerCase().includes(query) ||
                r.cuisineType?.toLowerCase().includes(query) ||
                r.city?.toLowerCase().includes(query) ||
                r.description?.toLowerCase().includes(query)
            );
        }

        // Cuisine filter
        if (selectedCuisine) {
            results = results.filter(r => r.cuisineType === selectedCuisine);
        }

        // Quick filters
        if (activeFilters.has('offers')) {
            results = results.filter(r => r.isSponsored);
        }
        if (activeFilters.has('verified')) {
            results = results.filter(r => r.isVerified);
        }
        if (activeFilters.has('fast')) {
            results = results.filter(r => (r.estimatedDeliveryTime ?? 99) <= 30);
        }
        if (activeFilters.has('top')) {
            results = results.filter(r => (r.rating ?? 0) >= 4);
        }

        // Attach distance if GPS is available, sort: with-location first by distance, then rest
        return results
            .map(r => {
                const distance = (userLocation && r.lat && r.lng)
                    ? calculateDistance(userLocation.latitude, userLocation.longitude, r.lat, r.lng)
                    : null;
                return { ...r, distance };
            })
            .sort((a, b) => {
                if (a.distance != null && b.distance != null) return a.distance - b.distance;
                if (a.distance != null) return -1;
                if (b.distance != null) return 1;
                return 0;
            });
    }, [restaurants, search, selectedCuisine, activeFilters, userLocation]);

    const handleSearch = useCallback((query: string) => {
        const trimmed = query.trim();
        setSearch(trimmed);
        if (!trimmed) return;

        const newSearch: RecentSearch = {
            id: Date.now().toString(),
            query: trimmed,
            timestamp: Date.now(),
        };
        setRecentSearches(prev => {
            const filtered = prev.filter(s => s.query !== trimmed);
            return [newSearch, ...filtered].slice(0, 10);
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleRemoveRecent = useCallback((id: string) => {
        setRecentSearches(prev => prev.filter(s => s.id !== id));
    }, []);

    const handleRestaurantPress = useCallback((slug: string) => {
        router.push(`/restaurant/${slug}`);
    }, [router]);

    const toggleFilter = useCallback((key: string) => {
        Haptics.selectionAsync();
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        setSelectedCuisine(null);
        setActiveFilters(new Set());
        setSearch('');
    }, []);

    const showingResults = search.trim().length > 0 || !!selectedCuisine || activeFilters.size > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Search Bar */}
                <View style={[styles.searchBarWrapper, { paddingHorizontal: Spacing.md }]}>
                    <View
                        style={[
                            styles.searchBar,
                            {
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                            },
                            Shadows.sm,
                        ]}
                    >
                        <Ionicons name="search" size={20} color={theme.tabIconDefault} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Rechercher dans kBouffe"
                            placeholderTextColor={theme.tabIconDefault}
                            value={search}
                            onChangeText={(text) => {
                                setSearch(text);
                                // Save to recents only on submit, not on every keystroke
                            }}
                            onSubmitEditing={() => handleSearch(search)}
                            returnKeyType="search"
                            enablesReturnKeyAutomatically
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                        {search.trim() ? (
                            <Pressable
                                onPress={clearAll}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close-circle" size={20} color={theme.tabIconDefault} />
                            </Pressable>
                        ) : null}
                    </View>
                </View>

                {/* Quick Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickFiltersRow}
                >
                    {QUICK_FILTERS.map(filter => {
                        const active = activeFilters.has(filter.key);
                        return (
                            <Pressable
                                key={filter.key}
                                onPress={() => toggleFilter(filter.key)}
                                style={[
                                    styles.quickFilterChip,
                                    {
                                        backgroundColor: active ? theme.primary : theme.surfaceElevated,
                                        borderColor: active ? theme.primary : theme.border,
                                    },
                                    Shadows.sm,
                                ]}
                            >
                                <Ionicons
                                    name={active ? (filter.icon.replace('-outline', '') as any) : filter.icon}
                                    size={15}
                                    color={active ? '#fff' : theme.text}
                                />
                                <Text
                                    style={[
                                        styles.quickFilterLabel,
                                        { color: active ? '#fff' : theme.text },
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {/* Cuisine Chips */}
                {uniqueCuisines.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cuisineChipsRow}
                    >
                        {uniqueCuisines.map(cuisine => {
                            const active = selectedCuisine === cuisine;
                            const cat = categories.find(c => c.value === cuisine);
                            return (
                                <Pressable
                                    key={cuisine}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSearch('');
                                        setSelectedCuisine(active ? null : cuisine);
                                    }}
                                    style={[
                                        styles.cuisineChip,
                                        {
                                            backgroundColor: active ? theme.primaryLight : theme.surfaceElevated,
                                            borderColor: active ? theme.primary : theme.border,
                                        },
                                    ]}
                                >
                                    {cat?.icon ? (
                                        <Text style={{ marginRight: 4 }}>{cat.icon}</Text>
                                    ) : null}
                                    <Text
                                        style={[
                                            styles.cuisineChipText,
                                            { color: active ? theme.primary : theme.text },
                                        ]}
                                    >
                                        {cat?.label ?? cuisine}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                )}

                {/* ── Results or Discovery Content ── */}
                {showingResults ? (
                    <>
                        {/* Results Header */}
                        <View style={styles.resultsHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                {filteredRestaurants.length} résultat{filteredRestaurants.length !== 1 ? 's' : ''}
                            </Text>
                            <Pressable onPress={clearAll} hitSlop={8}>
                                <Text style={[styles.clearFilters, { color: theme.primary }]}>
                                    Effacer tout
                                </Text>
                            </Pressable>
                        </View>

                        {/* Restaurant Results */}
                        {loading ? (
                            <RestaurantListSkeleton />
                        ) : (
                            filteredRestaurants.map(restaurant => (
                                <Pressable
                                    key={restaurant.id}
                                    onPress={() => handleRestaurantPress(restaurant.slug)}
                                    style={[
                                        styles.restaurantCard,
                                        {
                                            backgroundColor: theme.surfaceElevated,
                                            borderColor: theme.border,
                                        },
                                        Shadows.sm,
                                    ]}
                                >
                                    <Image
                                        source={{ uri: restaurant.coverImage ?? restaurant.logoUrl ?? undefined }}
                                        style={styles.restaurantImage}
                                        contentFit="cover"
                                    />
                                    <View style={styles.restaurantBody}>
                                        <View style={styles.restaurantLine}>
                                            <Text style={[styles.restaurantName, { color: theme.text }]} numberOfLines={1}>
                                                {restaurant.name}
                                            </Text>
                                            {restaurant.isVerified && (
                                                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                                            )}
                                        </View>
                                        <Text style={[styles.restaurantMeta, { color: theme.textMuted }]} numberOfLines={1}>
                                            {restaurant.cuisineType ?? 'Restaurant'} · {restaurant.rating?.toFixed(1) ?? '4.5'}★
                                            {restaurant.reviewCount ? ` (${restaurant.reviewCount}+)` : ''}
                                        </Text>
                                        <View style={styles.restaurantFooter}>
                                            <View style={styles.metaChip}>
                                                <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                                                <Text style={[styles.metaChipText, { color: theme.textMuted }]}>
                                                    {restaurant.estimatedDeliveryTime ?? 20} min
                                                </Text>
                                            </View>
                                            {restaurant.distance != null && (
                                                <View style={styles.metaChip}>
                                                    <Ionicons name="navigate-outline" size={13} color={theme.textMuted} />
                                                    <Text style={[styles.metaChipText, { color: theme.textMuted }]}>
                                                        {formatDistance(restaurant.distance)}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.metaChip}>
                                                <Ionicons name="bicycle-outline" size={13} color={theme.textMuted} />
                                                <Text style={[styles.metaChipText, { color: theme.textMuted }]}>
                                                    {restaurant.deliveryFee === 0 ? 'Gratuit' : `${restaurant.deliveryFee ?? 500} FCFA`}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            ))
                        )}

                        {!loading && filteredRestaurants.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={48} color={theme.tabIconDefault} />
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    Aucun résultat
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                                    Essayez de modifier vos filtres ou votre recherche
                                </Text>
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                        Recherches récentes
                                    </Text>
                                    <Pressable onPress={() => setRecentSearches([])}>
                                        <Text style={[styles.clearLink, { color: theme.primary }]}>
                                            Tout effacer
                                        </Text>
                                    </Pressable>
                                </View>
                                <View style={styles.tagsContainer}>
                                    {recentSearches.slice(0, 8).map(item => (
                                        <Pressable
                                            key={item.id}
                                            onPress={() => handleSearch(item.query)}
                                            onLongPress={() => handleRemoveRecent(item.id)}
                                            style={[
                                                styles.recentTag,
                                                {
                                                    backgroundColor: theme.surfaceElevated,
                                                    borderColor: theme.border,
                                                },
                                            ]}
                                        >
                                            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                                            <Text style={[styles.recentTagText, { color: theme.text }]}>
                                                {item.query}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Popular Nearby */}
                        {restaurants.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                    Populaire près de vous
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
                                    {restaurants.slice(0, 6).map(restaurant => (
                                        <Pressable
                                            key={restaurant.id}
                                            onPress={() => handleRestaurantPress(restaurant.slug)}
                                            style={[
                                                styles.popularCard,
                                                {
                                                    backgroundColor: theme.surfaceElevated,
                                                    borderColor: theme.border,
                                                },
                                                Shadows.sm,
                                            ]}
                                        >
                                            <Image
                                                source={{ uri: restaurant.coverImage ?? restaurant.logoUrl ?? undefined }}
                                                style={styles.popularCardImage}
                                                contentFit="cover"
                                            />
                                            <View style={styles.popularCardBody}>
                                                <Text style={[styles.popularCardName, { color: theme.text }]} numberOfLines={1}>
                                                    {restaurant.name}
                                                </Text>
                                                <Text style={[styles.popularCardMeta, { color: theme.textMuted }]} numberOfLines={1}>
                                                    {restaurant.cuisineType ?? 'Restaurant'} · {restaurant.rating?.toFixed(1) ?? '4.5'}★
                                                </Text>
                                                <Text style={[styles.popularCardMeta, { color: theme.textMuted }]}>
                                                    {restaurant.estimatedDeliveryTime ?? 20} min
                                                </Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Categories */}
                        {categories.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Meilleures catégories
                            </Text>
                            <View style={styles.categoriesGrid}>
                                {categories.map(category => (
                                    <Pressable
                                        key={category.id}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSearch('');
                                            setSelectedCuisine(prev => prev === category.value ? null : category.value);
                                        }}
                                        style={[
                                            styles.categoryCard,
                                            {
                                                backgroundColor: selectedCuisine === category.value ? theme.primaryLight : theme.surfaceElevated,
                                                borderColor: selectedCuisine === category.value ? theme.primary : theme.border,
                                            },
                                            Shadows.sm,
                                        ]}
                                    >
                                        <Text style={styles.categoryEmoji}>{category.icon}</Text>
                                        <Text style={[styles.categoryName, { color: selectedCuisine === category.value ? theme.primary : theme.text }]} numberOfLines={2}>
                                            {category.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    // ── Search Bar ──────────────────────────────────────────────────
    searchBarWrapper: {
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
        height: 48,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...Typography.body,
    },
    // ── Quick Filters ──────────────────────────────────────────────
    quickFiltersRow: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    quickFilterChip: {
        height: 36,
        borderRadius: Radii.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    quickFilterLabel: {
        ...Typography.smallSemibold,
    },
    // ── Cuisine Chips ──────────────────────────────────────────────
    cuisineChipsRow: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    cuisineChip: {
        height: 32,
        borderRadius: Radii.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cuisineChipText: {
        ...Typography.smallSemibold,
        fontSize: 12,
    },
    // ── Results ────────────────────────────────────────────────────
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    clearFilters: {
        ...Typography.smallSemibold,
    },
    loadingContainer: {
        paddingVertical: Spacing.xxl,
        alignItems: 'center',
    },
    restaurantCard: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderRadius: Radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
    },
    restaurantImage: {
        width: '100%',
        height: 154,
        backgroundColor: '#E5E7EB',
    },
    restaurantBody: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    restaurantLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: 4,
    },
    restaurantName: {
        ...Typography.subtitle2,
        flex: 1,
    },
    restaurantMeta: {
        ...Typography.caption,
        marginBottom: 6,
    },
    restaurantFooter: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaChipText: {
        ...Typography.caption,
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
        gap: Spacing.sm,
    },
    emptyTitle: {
        ...Typography.subtitle2,
        fontWeight: '600',
    },
    emptySubtitle: {
        ...Typography.body,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
    // ── Sections ───────────────────────────────────────────────────
    section: {
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.subtitle2,
        fontWeight: '700',
        marginBottom: Spacing.md,
    },
    clearLink: {
        ...Typography.smallSemibold,
        marginBottom: Spacing.md,
    },
    // ── Recent Searches ────────────────────────────────────────────
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    recentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: Radii.full,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    recentTagText: {
        ...Typography.small,
        fontWeight: '500',
    },
    // ── Popular Cards ──────────────────────────────────────────────
    horizontalCards: {
        gap: Spacing.sm,
    },
    popularCard: {
        width: 180,
        borderRadius: Radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
    },
    popularCardImage: {
        width: '100%',
        height: 110,
        backgroundColor: '#E5E7EB',
    },
    popularCardBody: {
        padding: Spacing.sm,
    },
    popularCardName: {
        ...Typography.smallSemibold,
        marginBottom: 2,
    },
    popularCardMeta: {
        ...Typography.caption,
        fontSize: 12,
    },
    // ── Categories Grid ────────────────────────────────────────────
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    categoryCard: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1,
    },
    categoryEmoji: {
        fontSize: 24,
    },
    categoryName: {
        flex: 1,
        ...Typography.smallSemibold,
    },
});
