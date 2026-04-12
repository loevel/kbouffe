import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { calculateDistance, formatDistance, getUserLocation, type UserLocation } from '@/lib/location-utils';
import { MapFilterSheet, DEFAULT_FILTERS, type MapFilters, type FilterSheetType } from '@/components/MapFilterSheet';

const DEFAULT_REGION = {
    latitude: 4.0511,
    longitude: 9.7679,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
};

const FILTERS = [
    { key: 'pickup', label: 'Ramassage', icon: 'walk-outline' as const, hasChevron: true },
    { key: 'offers', label: 'Offres', icon: 'pricetag-outline' as const, hasChevron: false },
    { key: 'cuisine', label: 'Cuisine', icon: 'restaurant-outline' as const, hasChevron: true },
    { key: 'rating', label: 'Note', icon: 'star-outline' as const, hasChevron: true },
    { key: 'price', label: 'Fourchette de prix', icon: 'cash-outline' as const, hasChevron: true },
    { key: 'sort', label: 'Trier', icon: 'swap-vertical-outline' as const, hasChevron: true },
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_MAX_HEIGHT = SCREEN_HEIGHT * 0.82;
const PANEL_PEEK_HEIGHT = 238;
const COLLAPSED_TRANSLATE_Y = PANEL_MAX_HEIGHT - PANEL_PEEK_HEIGHT;

function isInRegion(lat: number, lng: number, region: Region) {
    const latDelta = region.latitudeDelta / 2;
    const lngDelta = region.longitudeDelta / 2;
    return (
        lat >= region.latitude - latDelta &&
        lat <= region.latitude + latDelta &&
        lng >= region.longitude - lngDelta &&
        lng <= region.longitude + lngDelta
    );
}

export default function MapScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView | null>(null);
    const { restaurants, loading } = useRestaurants();
    const translateY = useRef(new Animated.Value(COLLAPSED_TRANSLATE_Y)).current;
    const currentTranslateY = useRef(COLLAPSED_TRANSLATE_Y);
    const gestureStartY = useRef(COLLAPSED_TRANSLATE_Y);

    const [search] = useState('');
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [region, setRegion] = useState<Region>(DEFAULT_REGION);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sheetExpanded, setSheetExpanded] = useState(false);

    // Filter state
    const [mapFilters, setMapFilters] = useState<MapFilters>(DEFAULT_FILTERS);
    const [filterSheetType, setFilterSheetType] = useState<FilterSheetType>(null);
    const [offersOnly, setOffersOnly] = useState(false);

    useEffect(() => {
        const listenerId = translateY.addListener(({ value }) => {
            currentTranslateY.current = value;
        });

        return () => {
            translateY.removeListener(listenerId);
        };
    }, [translateY]);

    useEffect(() => {
        (async () => {
            const location = await getUserLocation();
            if (!location) return;

            setUserLocation(location);
            const nextRegion = {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
            };
            setRegion(nextRegion);
            mapRef.current?.animateToRegion(nextRegion, 600);
        })();
    }, []);

    // Extract unique cuisine types for filter options
    const cuisineOptions = useMemo(() => {
        const cuisines = new Set(
            restaurants
                .map(r => r.cuisineType)
                .filter((c): c is string => c !== null && c !== undefined)
        );
        return Array.from(cuisines).sort();
    }, [restaurants]);

    const searchableRestaurants = useMemo(() => {
        const query = search.trim().toLowerCase();
        let base = restaurants.filter((restaurant) => restaurant.lat && restaurant.lng);

        // Apply cuisine filter
        if (mapFilters.cuisines.length > 0) {
            base = base.filter(r => r.cuisineType && mapFilters.cuisines.includes(r.cuisineType));
        }

        // Apply rating filter
        if (mapFilters.minRating > 3) {
            base = base.filter(r => (r.rating ?? 0) >= mapFilters.minRating);
        }

        // Apply offers filter
        if (offersOnly) {
            base = base.filter(r => r.isSponsored);
        }

        if (!query) return base;

        return base.filter((restaurant) =>
            restaurant.name.toLowerCase().includes(query) ||
            restaurant.cuisineType?.toLowerCase().includes(query) ||
            restaurant.city?.toLowerCase().includes(query)
        );
    }, [restaurants, search, mapFilters, offersOnly]);

    const visibleRestaurants = useMemo(() => {
        const inBounds = searchableRestaurants.filter((restaurant) =>
            isInRegion(restaurant.lat!, restaurant.lng!, region)
        );

        const base = inBounds.length > 0 ? inBounds : searchableRestaurants;

        return base
            .map((restaurant) => {
                const distance = userLocation
                    ? calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          restaurant.lat!,
                          restaurant.lng!
                      )
                    : null;

                return { ...restaurant, distance };
            })
            .sort((a, b) => {
                if (mapFilters.sortBy === 'rating') {
                    return (b.rating ?? 0) - (a.rating ?? 0);
                }
                // 'distance' and 'recommended' both sort by distance
                if (a.distance == null && b.distance == null) return 0;
                if (a.distance == null) return 1;
                if (b.distance == null) return -1;
                return a.distance - b.distance;
            });
    }, [region, searchableRestaurants, userLocation, mapFilters.sortBy]);

    const selectedRestaurant = useMemo(() => {
        return visibleRestaurants.find((restaurant) => restaurant.id === selectedId) ?? visibleRestaurants[0] ?? null;
    }, [selectedId, visibleRestaurants]);

    useEffect(() => {
        if (!selectedRestaurant && visibleRestaurants[0]) {
            setSelectedId(visibleRestaurants[0].id);
        }
    }, [selectedRestaurant, visibleRestaurants]);

    const animateSheet = useCallback((expand: boolean) => {
        setSheetExpanded(expand);
        Animated.spring(translateY, {
            toValue: expand ? 0 : COLLAPSED_TRANSLATE_Y,
            useNativeDriver: true,
            damping: 20,
            stiffness: 180,
            mass: 0.8,
        }).start();
    }, [translateY]);

    const toggleSheet = useCallback(() => {
        Haptics.selectionAsync();
        animateSheet(!sheetExpanded);
    }, [animateSheet, sheetExpanded]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (_evt, gestureState) =>
                    Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
                onPanResponderGrant: () => {
                    gestureStartY.current = currentTranslateY.current;
                },
                onPanResponderMove: (_evt, gestureState) => {
                    const nextValue = Math.min(
                        COLLAPSED_TRANSLATE_Y,
                        Math.max(0, gestureStartY.current + gestureState.dy)
                    );
                    translateY.setValue(nextValue);
                },
                onPanResponderRelease: (_evt, gestureState) => {
                    const movedUpEnough = gestureState.dy < -50;
                    const movedDownEnough = gestureState.dy > 50;
                    const fastUp = gestureState.vy < -0.6;
                    const fastDown = gestureState.vy > 0.6;

                    if (movedUpEnough || fastUp) {
                        animateSheet(true);
                        return;
                    }

                    if (movedDownEnough || fastDown) {
                        animateSheet(false);
                        return;
                    }

                    animateSheet(currentTranslateY.current < COLLAPSED_TRANSLATE_Y / 2);
                },
            }),
        [animateSheet, translateY]
    );

    const overlayOpacity = translateY.interpolate({
        inputRange: [0, COLLAPSED_TRANSLATE_Y],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const handleFilterPress = useCallback((filterKey: string) => {
        Haptics.selectionAsync();
        if (filterKey === 'offers') {
            setOffersOnly(prev => !prev);
            return;
        }
        setFilterSheetType(filterKey as FilterSheetType);
    }, []);

    const handleApplyFilters = useCallback((newFilters: MapFilters) => {
        setMapFilters(newFilters);
        setFilterSheetType(null);
    }, []);

    const handleCloseFilterSheet = useCallback(() => {
        setFilterSheetType(null);
    }, []);

    // Check if a filter chip has active selections
    const isFilterActive = useCallback((key: string) => {
        switch (key) {
            case 'pickup': return mapFilters.diningOptions.length !== 1 || !mapFilters.diningOptions.includes('pickup');
            case 'offers': return offersOnly;
            case 'cuisine': return mapFilters.cuisines.length > 0;
            case 'rating': return mapFilters.minRating > 3;
            case 'price': return mapFilters.priceRanges.length > 0;
            case 'sort': return mapFilters.sortBy !== 'recommended';
            default: return false;
        }
    }, [mapFilters, offersOnly]);

    const handleSearchArea = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (visibleRestaurants[0]) {
            setSelectedId(visibleRestaurants[0].id);
        }
    }, [visibleRestaurants]);

    const handleRecenter = useCallback(() => {
        if (!userLocation) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const nextRegion = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };
        setRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 400);
    }, [userLocation]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFillObject}
                initialRegion={DEFAULT_REGION}
                onRegionChangeComplete={setRegion}>
                {visibleRestaurants.map((restaurant) => {
                    const selected = restaurant.id === selectedRestaurant?.id;
                    return (
                        <Marker
                            key={restaurant.id}
                            coordinate={{
                                latitude: restaurant.lat!,
                                longitude: restaurant.lng!,
                            }}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedId(restaurant.id);
                            }}>
                            <View
                                style={[
                                    styles.markerBubble,
                                    {
                                        backgroundColor: selected ? theme.primary : theme.surfaceElevated,
                                        borderColor: selected ? theme.primary : theme.border,
                                    },
                                    Shadows.sm,
                                ]}>
                                <Ionicons name="restaurant" size={12} color={selected ? '#fff' : theme.text} />
                                <Text style={[styles.markerText, { color: selected ? '#fff' : theme.text }]}>
                                    {restaurant.estimatedDeliveryTime ?? 20}
                                </Text>
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            <Animated.View
                pointerEvents={sheetExpanded ? 'none' : 'auto'}
                style={[
                    styles.topOverlay,
                    {
                        paddingTop: insets.top + Spacing.sm,
                        opacity: overlayOpacity,
                    },
                ]}>
                <Pressable
                    onPress={() => router.push('/(tabs)/explore')}
                    style={[
                        styles.searchBar,
                        {
                            backgroundColor: theme.surfaceElevated,
                            borderColor: theme.border,
                        },
                        Shadows.md,
                    ]}>
                    <Ionicons name="search" size={18} color={theme.tabIconDefault} />
                    <Text style={[styles.searchPlaceholder, { color: theme.tabIconDefault }]}>
                        Recherchez des lieux de prise en charge à proximité
                    </Text>
                </Pressable>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {FILTERS.map((filter) => {
                        const active = isFilterActive(filter.key);
                        return (
                            <Pressable
                                key={filter.key}
                                onPress={() => handleFilterPress(filter.key)}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: active ? theme.primaryLight : theme.surfaceElevated,
                                        borderColor: active ? theme.primary : theme.border,
                                    },
                                    Shadows.sm,
                                ]}>
                                <Ionicons
                                    name={filter.icon}
                                    size={15}
                                    color={active ? theme.primary : theme.text}
                                />
                                <Text style={[styles.filterLabel, { color: active ? theme.primary : theme.text }]}>
                                    {filter.label}
                                </Text>
                                {filter.hasChevron && (
                                    <Ionicons
                                        name="chevron-down"
                                        size={14}
                                        color={active ? theme.primary : theme.textMuted}
                                    />
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            {!sheetExpanded ? (
                <>
                    <Pressable
                        onPress={handleSearchArea}
                        style={[
                            styles.searchAreaButton,
                            { top: insets.top + 118, backgroundColor: '#101010' },
                            Shadows.md,
                        ]}>
                        <Text style={styles.searchAreaText}>Recherchez ici</Text>
                    </Pressable>

                    <Pressable
                        onPress={handleRecenter}
                        style={[
                            styles.recenterButton,
                            {
                                top: insets.top + 176,
                                backgroundColor: theme.surfaceElevated,
                                borderColor: theme.border,
                            },
                            Shadows.md,
                        ]}>
                        <Ionicons name="locate" size={20} color={theme.text} />
                    </Pressable>
                </>
            ) : null}

            <Animated.View
                style={[
                    styles.bottomPanel,
                    {
                        top: insets.top + 6,
                        backgroundColor: theme.backgroundAlt,
                        borderColor: theme.border,
                        paddingBottom: Math.max(insets.bottom + 12, 24),
                        transform: [{ translateY }],
                    },
                ]}>
                <View style={styles.sheetHandleZone} {...panResponder.panHandlers}>
                    <Pressable onPress={toggleSheet} style={styles.sheetHandlePressable}>
                        <View style={[styles.dragHandle, { backgroundColor: theme.borderStrong }]} />

                        {sheetExpanded ? (
                            <View style={styles.expandedHeader}>
                                <Pressable
                                    onPress={() => router.push('/(tabs)/explore')}
                                    style={[
                                        styles.searchBar,
                                        {
                                            backgroundColor: theme.surfaceElevated,
                                            borderColor: theme.border,
                                        },
                                    ]}>
                                    <Ionicons name="search" size={18} color={theme.tabIconDefault} />
                                    <Text style={[styles.searchPlaceholder, { color: theme.tabIconDefault }]}>
                                        Recherchez des lieux de prise en charge à proximité
                                    </Text>
                                </Pressable>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                                    {FILTERS.map((filter) => {
                                        const active = isFilterActive(filter.key);
                                        return (
                                            <Pressable
                                                key={filter.key}
                                                onPress={() => handleFilterPress(filter.key)}
                                                style={[
                                                    styles.filterChip,
                                                    {
                                                        backgroundColor: active ? theme.primaryLight : theme.surfaceElevated,
                                                        borderColor: active ? theme.primary : theme.border,
                                                    },
                                                ]}>
                                                <Ionicons
                                                    name={filter.icon}
                                                    size={15}
                                                    color={active ? theme.primary : theme.text}
                                                />
                                                <Text style={[styles.filterLabel, { color: active ? theme.primary : theme.text }]}>
                                                    {filter.label}
                                                </Text>
                                                {filter.hasChevron && (
                                                    <Ionicons
                                                        name="chevron-down"
                                                        size={14}
                                                        color={active ? theme.primary : theme.textMuted}
                                                    />
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        ) : (
                            <View style={styles.collapsedHeader}>
                                <View style={styles.bottomHeaderCopy}>
                                    <Text style={[styles.bottomTitle, { color: theme.text }]}>
                                        Lieux de prise en charge à proximité
                                    </Text>
                                    <Text style={[styles.bottomSubtitle, { color: theme.textMuted }]}>
                                        {visibleRestaurants.length} restaurant{visibleRestaurants.length > 1 ? 's' : ''} dans cette zone
                                    </Text>
                                </View>
                                <View style={styles.bottomHeaderMeta}>
                                    {loading ? <ActivityIndicator size="small" color={theme.primary} /> : null}
                                    <Ionicons name="chevron-up" size={20} color={theme.textMuted} />
                                </View>
                            </View>
                        )}
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardsColumn}>
                    {visibleRestaurants.map((restaurant) => {
                        const selected = restaurant.id === selectedRestaurant?.id;

                        return (
                            <Pressable
                                key={restaurant.id}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedId(restaurant.id);
                                    mapRef.current?.animateToRegion(
                                        {
                                            latitude: restaurant.lat!,
                                            longitude: restaurant.lng!,
                                            latitudeDelta: 0.03,
                                            longitudeDelta: 0.03,
                                        },
                                        400
                                    );
                                }}
                                style={[
                                    styles.restaurantCard,
                                    {
                                        backgroundColor: theme.surfaceElevated,
                                        borderColor: selected ? theme.primary : theme.border,
                                    },
                                    Shadows.sm,
                                ]}>
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
                                        <Pressable hitSlop={8}>
                                            <Ionicons name="heart-outline" size={20} color={theme.textMuted} />
                                        </Pressable>
                                    </View>
                                    <Text style={[styles.restaurantMeta, { color: theme.textMuted }]} numberOfLines={1}>
                                        {restaurant.cuisineType ?? 'Commandité'} · {restaurant.rating?.toFixed(1) ?? '4.5'}★
                                        {restaurant.reviewCount ? ` (${restaurant.reviewCount}+)` : ''}
                                        {' · '}
                                        {restaurant.deliveryFee === 0 ? '0 FCFA' : `${restaurant.deliveryFee ?? 500} FCFA`}
                                        {' · '}
                                        {restaurant.distance != null ? formatDistance(restaurant.distance) : `${restaurant.estimatedDeliveryTime ?? 20} min`}
                                    </Text>
                                    <Text style={[styles.restaurantMeta, { color: theme.textMuted }]}>
                                        {restaurant.estimatedDeliveryTime ?? 20} min
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {!sheetExpanded && selectedRestaurant ? (
                    <Pressable
                        onPress={() => router.push(`/restaurant/${selectedRestaurant.slug}`)}
                        style={[
                            styles.primaryCta,
                            { backgroundColor: theme.primary },
                            Shadows.md,
                        ]}>
                        <Text style={styles.primaryCtaText}>Voir {selectedRestaurant.name}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </Pressable>
                ) : null}
            </Animated.View>

            <MapFilterSheet
                visible={filterSheetType !== null}
                type={filterSheetType}
                filters={mapFilters}
                cuisineOptions={cuisineOptions}
                onApply={handleApplyFilters}
                onClose={handleCloseFilterSheet}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    searchBar: {
        height: 52,
        borderRadius: Radii.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    searchPlaceholder: {
        flex: 1,
        ...Typography.body,
    },
    filterRow: {
        gap: Spacing.sm,
        paddingRight: Spacing.md,
    },
    filterChip: {
        height: 40,
        borderRadius: Radii.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    filterLabel: {
        ...Typography.smallSemibold,
    },
    searchAreaButton: {
        position: 'absolute',
        alignSelf: 'center',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: Radii.full,
    },
    searchAreaText: {
        color: '#fff',
        ...Typography.smallSemibold,
    },
    recenterButton: {
        position: 'absolute',
        right: Spacing.md,
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    markerBubble: {
        minWidth: 34,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    markerText: {
        fontSize: 12,
        fontWeight: '700',
    },
    bottomPanel: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: PANEL_MAX_HEIGHT,
        borderWidth: 1,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        overflow: 'hidden',
    },
    sheetHandleZone: {
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    sheetHandlePressable: {
        gap: Spacing.sm,
    },
    dragHandle: {
        width: 42,
        height: 5,
        borderRadius: 999,
        alignSelf: 'center',
    },
    expandedHeader: {
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    collapsedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    bottomHeaderCopy: {
        flex: 1,
    },
    bottomHeaderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    bottomTitle: {
        ...Typography.headline,
    },
    bottomSubtitle: {
        ...Typography.small,
        marginTop: 2,
    },
    cardsColumn: {
        gap: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    restaurantCard: {
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
        justifyContent: 'space-between',
        gap: Spacing.sm,
        marginBottom: 4,
    },
    restaurantName: {
        ...Typography.subtitle2,
        flex: 1,
    },
    restaurantMeta: {
        ...Typography.caption,
    },
    primaryCta: {
        marginHorizontal: Spacing.md,
        borderRadius: Radii.full,
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    primaryCtaText: {
        color: '#fff',
        ...Typography.bodySemibold,
        fontWeight: '700',
    },
});
