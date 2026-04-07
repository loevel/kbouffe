import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, FlatList,
    Pressable, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { CUISINE_CATEGORIES } from '@/data/mocks';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import type { MobileRestaurant } from '@/lib/api';
import { useLoyalty } from '@/contexts/loyalty-context';

type SortKey = 'recommended' | 'rating' | 'time' | 'delivery_fee';
type PriceRange = 0 | 1 | 2 | 3;

const SORT_OPTIONS: { id: SortKey; label: string; icon: string }[] = [
    { id: 'recommended', label: 'Recommandé',  icon: 'sparkles-outline' },
    { id: 'rating',       label: 'Mieux notés', icon: 'star-outline' },
    { id: 'time',         label: 'Plus rapide', icon: 'time-outline' },
    { id: 'delivery_fee', label: 'Livraison',   icon: 'bicycle-outline' },
];

const PRICE_OPTIONS: { id: PriceRange; label: string }[] = [
    { id: 1, label: '€' },
    { id: 2, label: '€€' },
    { id: 3, label: '€€€' },
];

export default function ExploreScreen() {
    const router = useRouter();
    const { q } = useLocalSearchParams<{ q?: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<SortKey>('recommended');
    const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
    const [openOnly, setOpenOnly] = useState(false);
    const [priceRange, setPriceRange] = useState<PriceRange>(0);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);
    const { isRestaurantFavorite, toggleRestaurantFavorite } = useLoyalty();

    useEffect(() => {
        if (q && typeof q === 'string') setSearch(q);
    }, [q]);

    const { restaurants, loading: loadingRestaurants } = useRestaurants();

    const handleMapView = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setViewMode('map');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setUserLat(pos.coords.latitude);
            setUserLng(pos.coords.longitude);
        }
    }, []);

    const hasActiveFilters =
        selectedCategory !== 'all' || freeDeliveryOnly || openOnly || sortBy !== 'recommended' || priceRange !== 0;

    const resetFilters = useCallback(() => {
        setSelectedCategory('all');
        setFreeDeliveryOnly(false);
        setOpenOnly(false);
        setSortBy('recommended');
        setPriceRange(0);
    }, []);

    const filtered = useMemo(() => {
        let results: MobileRestaurant[] = [...restaurants];

        // Category
        if (selectedCategory !== 'all') {
            results = results.filter(r =>
                r.cuisineType?.toLowerCase().includes(selectedCategory.toLowerCase()),
            );
        }

        // Search
        if (search.trim()) {
            const term = search.toLowerCase();
            results = results.filter(r =>
                r.name.toLowerCase().includes(term) ||
                r.description?.toLowerCase().includes(term) ||
                r.cuisineType?.toLowerCase().includes(term),
            );
        }

        // Quick filters
        if (freeDeliveryOnly) results = results.filter(r => r.deliveryFee === 0);
        if (openOnly)         results = results.filter(r => r.isActive);
        if (priceRange !== 0) {
            // Approximate price range by delivery fee tiers
            const feeThresholds: Record<PriceRange, [number, number]> = {
                0: [0, Infinity],
                1: [0, 500],
                2: [500, 1500],
                3: [1500, Infinity],
            };
            const [min, max] = feeThresholds[priceRange];
            results = results.filter(r => r.deliveryFee >= min && r.deliveryFee < max);
        }

        // Sort
        switch (sortBy) {
            case 'rating':
                results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
                break;
            case 'time':
                results.sort((a, b) => (a.estimatedDeliveryTime ?? 99) - (b.estimatedDeliveryTime ?? 99));
                break;
            case 'delivery_fee':
                results.sort((a, b) => a.deliveryFee - b.deliveryFee);
                break;
            default:
                // sponsored first
                results = [
                    ...results.filter(r => r.isSponsored).sort((a, b) => (a.sponsoredRank ?? 99) - (b.sponsoredRank ?? 99)),
                    ...results.filter(r => !r.isSponsored),
                ];
        }

        return results;
    }, [restaurants, search, selectedCategory, sortBy, freeDeliveryOnly, openOnly]);

    const renderItem = useCallback(
        ({ item }: { item: MobileRestaurant }) => (
            <RestaurantCard
                restaurant={item as never}
                onPress={() => router.push(`/restaurant/${item.slug}`)}
                isFavorite={isRestaurantFavorite(item.id)}
                onToggleFavorite={() => toggleRestaurantFavorite(item.id)}
            />
        ),
        [isRestaurantFavorite, router, toggleRestaurantFavorite],
    );

    const ListHeader = (
        <View>
            {/* ── Catégories ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.rowScroll}
                contentContainerStyle={styles.rowContainer}
            >
                {CUISINE_CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat.id;
                    return (
                        <Pressable
                            key={cat.id}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedCategory(cat.id);
                            }}
                            style={[
                                styles.chip,
                                { backgroundColor: active ? theme.primary : theme.border + '40' },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Filtre ${cat.label}`}
                            accessibilityState={{ selected: active }}
                        >
                            <Ionicons name={cat.icon as any} size={15} color={active ? '#fff' : theme.icon} />
                            <Text style={[styles.chipLabel, { color: active ? '#fff' : theme.text }]}>
                                {cat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* ── Tri ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.rowScroll}
                contentContainerStyle={styles.rowContainer}
            >
                {SORT_OPTIONS.map((opt) => {
                    const active = sortBy === opt.id;
                    return (
                        <Pressable
                            key={opt.id}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSortBy(opt.id);
                            }}
                            style={[
                                styles.sortChip,
                                {
                                    borderColor: active ? theme.primary : theme.border,
                                    backgroundColor: active ? theme.primary + '15' : 'transparent',
                                },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Trier par ${opt.label}`}
                            accessibilityState={{ selected: active }}
                        >
                            <Ionicons
                                name={opt.icon as any}
                                size={14}
                                color={active ? theme.primary : theme.icon}
                            />
                            <Text style={[styles.chipLabel, { color: active ? theme.primary : theme.icon }]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* ── Fourchette de prix ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.rowScroll}
                contentContainerStyle={styles.rowContainer}
            >
                <Text style={[styles.chipLabel, { color: theme.icon, marginRight: Spacing.xs }]}>Prix :</Text>
                {PRICE_OPTIONS.map(opt => {
                    const active = priceRange === opt.id;
                    return (
                        <Pressable
                            key={opt.id}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setPriceRange(priceRange === opt.id ? 0 : opt.id);
                            }}
                            style={[
                                styles.sortChip,
                                {
                                    borderColor: active ? theme.primary : theme.border,
                                    backgroundColor: active ? theme.primary + '15' : 'transparent',
                                },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Fourchette de prix ${opt.label}`}
                            accessibilityState={{ selected: active }}
                        >
                            <Text style={[styles.chipLabel, { color: active ? theme.primary : theme.icon, fontWeight: '700' }]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* ── Filtres rapides ── */}
            <View style={styles.quickFiltersRow}>
                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        setFreeDeliveryOnly(v => !v);
                    }}
                    style={[
                        styles.toggleChip,
                        {
                            borderColor: freeDeliveryOnly ? theme.primary : theme.border,
                            backgroundColor: freeDeliveryOnly ? theme.primary + '15' : 'transparent',
                        },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityLabel="Livraison gratuite uniquement"
                    accessibilityState={{ checked: freeDeliveryOnly }}
                >
                    <Ionicons name="bicycle-outline" size={14} color={freeDeliveryOnly ? theme.primary : theme.icon} />
                    <Text style={[styles.chipLabel, { color: freeDeliveryOnly ? theme.primary : theme.icon }]}>
                        Livraison gratuite
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        setOpenOnly(v => !v);
                    }}
                    style={[
                        styles.toggleChip,
                        {
                            borderColor: openOnly ? theme.primary : theme.border,
                            backgroundColor: openOnly ? theme.primary + '15' : 'transparent',
                        },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityLabel="Établissements ouverts uniquement"
                    accessibilityState={{ checked: openOnly }}
                >
                    <Ionicons name="checkmark-circle-outline" size={14} color={openOnly ? theme.primary : theme.icon} />
                    <Text style={[styles.chipLabel, { color: openOnly ? theme.primary : theme.icon }]}>
                        Ouvert maintenant
                    </Text>
                </Pressable>
            </View>

            {/* ── Compteur + reset ── */}
            <View style={styles.resultRow}>
                <Text style={[styles.resultCount, { color: theme.icon }]}>
                    {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
                </Text>
                {hasActiveFilters && (
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            resetFilters();
                        }}
                        style={[styles.resetBtn, { borderColor: theme.border }]}
                        accessibilityRole="button"
                        accessibilityLabel="Réinitialiser tous les filtres"
                        hitSlop={8}
                    >
                        <Ionicons name="close-outline" size={14} color={theme.icon} />
                        <Text style={[styles.resetLabel, { color: theme.icon }]}>Réinitialiser</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* ── En-tête ── */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
                <View style={styles.headerRight}>
                    <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.border + '30', flex: 1 }]}>
                        <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Restaurant, plat, cuisine…"
                            placeholderTextColor={theme.icon}
                            style={[styles.searchInput, { color: theme.text }]}
                            value={search}
                            onChangeText={setSearch}
                            returnKeyType="search"
                            clearButtonMode="never"
                            autoCorrect={false}
                        />
                        {search.length > 0 && (
                            <Pressable
                                onPress={() => setSearch('')}
                                accessibilityRole="button"
                                accessibilityLabel="Effacer la recherche"
                                hitSlop={8}
                            >
                                <Ionicons name="close-circle" size={20} color={theme.icon} />
                            </Pressable>
                        )}
                    </View>
                    {/* List / Map toggle */}
                    <View style={[styles.viewToggle, { backgroundColor: theme.border + '40' }]}>
                        <Pressable
                            onPress={() => { Haptics.selectionAsync(); setViewMode('list'); }}
                            style={[styles.viewToggleBtn, viewMode === 'list' && { backgroundColor: theme.background }]}
                            accessibilityLabel="Vue liste"
                        >
                            <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? theme.primary : theme.icon} />
                        </Pressable>
                        <Pressable
                            onPress={handleMapView}
                            style={[styles.viewToggleBtn, viewMode === 'map' && { backgroundColor: theme.background }]}
                            accessibilityLabel="Vue carte"
                        >
                            <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? theme.primary : theme.icon} />
                        </Pressable>
                    </View>
                </View>
            </View>

            {viewMode === 'map' ? (
                // ── Vue Carte ──────────────────────────────────────────────────
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={StyleSheet.absoluteFillObject}
                        provider={PROVIDER_DEFAULT}
                        mapType="none"
                        initialRegion={{
                            latitude: userLat ?? 4.0511,
                            longitude: userLng ?? 9.7679,
                            latitudeDelta: 0.08,
                            longitudeDelta: 0.08,
                        }}
                    >
                        <UrlTile
                            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maximumZ={19}
                            flipY={false}
                            tileSize={256}
                        />
                        {/* User location marker */}
                        {userLat !== null && userLng !== null && (
                            <Marker
                                coordinate={{ latitude: userLat, longitude: userLng }}
                                anchor={{ x: 0.5, y: 0.5 }}
                                zIndex={99}
                            >
                                <View style={styles.userMarker}>
                                    <View style={styles.userMarkerDot} />
                                </View>
                            </Marker>
                        )}
                        {/* Restaurant markers */}
                        {filtered.filter(r => r.lat && r.lng).map(r => (
                            <Marker
                                key={r.id}
                                coordinate={{ latitude: r.lat!, longitude: r.lng! }}
                                title={r.name}
                                pinColor="#f97316"
                                onCalloutPress={() => router.push(`/restaurant/${r.slug}`)}
                            >
                                <View style={[styles.restaurantMarker, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.restaurantMarkerText}>🍽</Text>
                                </View>
                                <Callout tooltip={false} onPress={() => router.push(`/restaurant/${r.slug}`)}>
                                    <View style={[styles.callout, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.calloutName, { color: theme.text }]} numberOfLines={1}>{r.name}</Text>
                                        <Text style={[styles.calloutMeta, { color: theme.icon }]}>
                                            {r.cuisineType} • {r.rating ? `⭐ ${r.rating}` : ''} • Voir →
                                        </Text>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}
                    </MapView>
                    {/* Results count overlay */}
                    <View style={[styles.mapOverlayCount, { backgroundColor: theme.background }]}>
                        <Text style={[styles.mapOverlayCountText, { color: theme.text }]}>
                            {filtered.filter(r => r.lat && r.lng).length} restaurants
                        </Text>
                    </View>
                </View>
            ) : (
                // ── Vue Liste ──────────────────────────────────────────────────
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    initialNumToRender={6}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="search-outline" size={52} color={theme.border} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun résultat</Text>
                            <Text style={[styles.emptyText, { color: theme.icon }]}>
                                {search.trim()
                                    ? `Aucun restaurant pour « ${search.trim()} »`
                                    : 'Essayez de modifier vos filtres.'}
                            </Text>
                            {hasActiveFilters && (
                                <TouchableOpacity
                                    onPress={resetFilters}
                                    style={[styles.emptyResetBtn, { backgroundColor: theme.primary }]}
                                    accessibilityRole="button"
                                    accessibilityLabel="Réinitialiser les filtres"
                                >
                                    <Text style={styles.emptyResetLabel}>Réinitialiser les filtres</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1 },
    header:      { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
    title:       { ...Typography.title2, marginBottom: Spacing.md },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 48,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    searchIcon:  { marginRight: Spacing.sm },
    searchInput: { flex: 1, height: '100%', ...Typography.body },
    viewToggle: {
        flexDirection: 'row',
        borderRadius: Radii.lg,
        padding: 3,
        gap: 2,
    },
    viewToggleBtn: {
        padding: 8,
        borderRadius: Radii.md,
    },
    mapContainer: { flex: 1, position: 'relative' },
    userMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#3b82f620',
        borderWidth: 2,
        borderColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userMarkerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
    },
    restaurantMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    restaurantMarkerText: { fontSize: 16 },
    callout: {
        padding: Spacing.sm,
        borderRadius: Radii.md,
        minWidth: 160,
        maxWidth: 220,
    },
    calloutName: { ...Typography.body, fontWeight: '700', marginBottom: 2 },
    calloutMeta: { ...Typography.small },
    mapOverlayCount: {
        position: 'absolute',
        top: Spacing.sm,
        alignSelf: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radii.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    mapOverlayCountText: { ...Typography.caption, fontWeight: '600' },
    // scrollable rows
    rowScroll:     { maxHeight: 44, marginBottom: 4 },
    rowContainer:  { paddingHorizontal: Spacing.md, gap: Spacing.sm, alignItems: 'center' },
    // chips
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: Radii.full,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    chipLabel: { ...Typography.caption, fontWeight: '600' },
    // quick filters
    quickFiltersRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    toggleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    // result bar
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    resultCount: { ...Typography.caption },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    resetLabel: { ...Typography.small },
    // list
    listContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
    // empty
    empty: { alignItems: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.lg },
    emptyTitle: { ...Typography.title3, marginTop: Spacing.md },
    emptyText:  { ...Typography.body, marginTop: Spacing.xs, textAlign: 'center' },
    emptyResetBtn: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
    },
    emptyResetLabel: { ...Typography.caption, fontWeight: '700', color: '#fff' },
});
