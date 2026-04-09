import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity,
    FlatList, Image, Pressable, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { CustomHeader } from '@/components/CustomHeader';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import * as Haptics from 'expo-haptics';
import { calculateDistance, formatDistance, getUserLocation, type UserLocation } from '@/lib/location-utils';

// Types
interface RecentSearch {
    id: string;
    query: string;
    timestamp: number;
}

interface FeaturedRestaurant {
    id: string;
    name: string;
    deliveryTime: string;
    cuisine: string;
}

interface HealthyProduct {
    id: string;
    name: string;
    image: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function ExploreScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { restaurants } = useRestaurants();
    const mapViewRef = useRef<MapView | null>(null);

    const [search, setSearch] = useState('');
    const [mapMode, setMapMode] = useState(false);
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [selectedDeliveryTime, setSelectedDeliveryTime] = useState<number | null>(null);
    const [offersOnly, setOffersOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: 45.5017,
        longitude: -73.5673,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    });
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
        { id: '1', query: 'poutine', timestamp: Date.now() - 86400000 },
        { id: '2', query: 'poutine', timestamp: Date.now() - 172800000 },
        { id: '3', query: 'restaurant', timestamp: Date.now() - 259200000 },
        { id: '4', query: 'Kebab', timestamp: Date.now() - 345600000 },
        { id: '5', query: 'poulet', timestamp: Date.now() - 432000000 },
        { id: '6', query: 'costo', timestamp: Date.now() - 518400000 },
        { id: '7', query: 'kebab parus', timestamp: Date.now() - 604800000 },
        { id: '8', query: 'rice', timestamp: Date.now() - 691200000 },
    ]);

    const [favoriteRestaurants] = useState<FeaturedRestaurant[]>([
        { id: '1', name: "McDonald's", deliveryTime: '10 min', cuisine: '' },
        { id: '2', name: 'Burger King', deliveryTime: '11 min', cuisine: '' },
        { id: '3', name: 'KFC', deliveryTime: '15 min', cuisine: '' },
        { id: '4', name: 'Walmart', deliveryTime: '20 min', cuisine: '' },
        { id: '5', name: 'Metro', deliveryTime: '25 min', cuisine: '' },
    ]);

    const [healthyProducts] = useState<HealthyProduct[]>([
        { id: '1', name: 'Fraises', image: '🍓' },
        { id: '2', name: 'Yogourt', image: '🥛' },
        { id: '3', name: "Lait d'amande", image: '🥛' },
        { id: '4', name: 'Kombucha', image: '🍹' },
        { id: '5', name: "Huile d'olive", image: '🫒' },
    ]);

    const [categories] = useState<Category[]>([
        { id: '1', name: 'Restauration rapide', icon: '🍟' },
        { id: '2', name: 'Hamburgers', icon: '🍔' },
        { id: '3', name: 'Crème et yogourt glacés', icon: '🍦' },
        { id: '4', name: 'Cuisine turque', icon: '🍢' },
    ]);

    // Request user location on component mount
    useEffect(() => {
        (async () => {
            const location = await getUserLocation();
            if (location) {
                setUserLocation(location);
                setMapRegion(prev => ({
                    ...prev,
                    latitude: location.latitude,
                    longitude: location.longitude,
                }));
            }
        })();
    }, []);

    // Get unique cuisines from restaurants for filter options
    const uniqueCuisines = useMemo(() => {
        const cuisines = new Set(
            restaurants
                .map(r => r.cuisineType)
                .filter((c): c is string => c !== null && c !== undefined)
        );
        return Array.from(cuisines).sort();
    }, [restaurants]);

    // Delivery time filter options
    const deliveryTimeOptions = [
        { label: 'Moins de 15 min', value: 15 },
        { label: 'Moins de 30 min', value: 30 },
        { label: 'Moins de 45 min', value: 45 },
    ];

    // Filter restaurants based on selected filters
    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(restaurant => {
            // Cuisine filter
            if (selectedCuisine && restaurant.cuisineType !== selectedCuisine) {
                return false;
            }
            // Delivery time filter
            if (selectedDeliveryTime && restaurant.estimatedDeliveryTime > selectedDeliveryTime) {
                return false;
            }
            // Offers filter
            if (offersOnly && !restaurant.isSponsored) {
                return false;
            }
            // Verified filter
            if (verifiedOnly && !restaurant.isVerified) {
                return false;
            }
            return true;
        });
    }, [restaurants, selectedCuisine, selectedDeliveryTime, offersOnly, verifiedOnly]);

    const handleSearch = useCallback((query: string) => {
        if (!query.trim()) return;

        // Ajouter à l'historique
        const newSearch: RecentSearch = {
            id: Date.now().toString(),
            query: query.trim(),
            timestamp: Date.now(),
        };

        setRecentSearches(prev => {
            const filtered = prev.filter(s => s.query !== query.trim());
            return [newSearch, ...filtered].slice(0, 10);
        });

        setSearch('');
        router.push({
            pathname: '/(tabs)/explore',
            params: { q: query.trim() }
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [router]);

    const handleCategoryPress = useCallback((categoryName: string) => {
        handleSearch(categoryName);
    }, [handleSearch]);

    const handleRemoveRecent = useCallback((id: string) => {
        setRecentSearches(prev => prev.filter(s => s.id !== id));
    }, []);

    const handleRestaurantPress = useCallback((restaurantId: string) => {
        router.push({
            pathname: '/restaurant/[id]',
            params: { id: restaurantId }
        });
    }, [router]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <CustomHeader title="Explorer" showSearch={false} />

            {mapMode ? (
                <View style={styles.mapContainer}>
                    {filteredRestaurants.length > 0 ? (
                        <>
                            <MapView
                                ref={mapViewRef}
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={
                                    userLocation
                                        ? {
                                            latitude: userLocation.latitude,
                                            longitude: userLocation.longitude,
                                            latitudeDelta: 0.1,
                                            longitudeDelta: 0.1,
                                        }
                                        : {
                                            latitude: filteredRestaurants[0]?.lat ?? 45.5017,
                                            longitude: filteredRestaurants[0]?.lng ?? -73.5673,
                                            latitudeDelta: 0.1,
                                            longitudeDelta: 0.1,
                                        }
                                }
                            >
                                {filteredRestaurants
                                    .filter(r => r.lat && r.lng)
                                    .map((restaurant) => {
                                        const distance = userLocation
                                            ? calculateDistance(
                                                userLocation.latitude,
                                                userLocation.longitude,
                                                restaurant.lat!,
                                                restaurant.lng!
                                            )
                                            : null;

                                        const description = `${restaurant.itemCount ?? 0} plats • ${restaurant.estimatedDeliveryTime || '?'} min${
                                            distance ? ` • ${formatDistance(distance)}` : ''
                                        }`;

                                        return (
                                            <Marker
                                                key={restaurant.id}
                                                coordinate={{
                                                    latitude: restaurant.lat!,
                                                    longitude: restaurant.lng!,
                                                }}
                                                title={restaurant.name}
                                                description={description}
                                                onPress={() => handleRestaurantPress(restaurant.id)}
                                            />
                                        );
                                    })}
                            </MapView>

                            {/* Recenter Button */}
                            {userLocation && (
                                <TouchableOpacity
                                    style={[styles.recenterButton, { backgroundColor: theme.primary }]}
                                    onPress={() => {
                                        if (mapViewRef.current && userLocation) {
                                            mapViewRef.current.animateToRegion({
                                                latitude: userLocation.latitude,
                                                longitude: userLocation.longitude,
                                                latitudeDelta: 0.1,
                                                longitudeDelta: 0.1,
                                            }, 300);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                    }}
                                >
                                    <Ionicons name="locate" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}

                            {/* Map Toggle Button */}
                            <TouchableOpacity
                                style={[styles.mapToggleFloatingButton, { backgroundColor: theme.primary, paddingTop: insets.top }]}
                                onPress={() => setMapMode(false)}
                            >
                                <Ionicons name="list" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.mapPlaceholder}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={[styles.mapPlaceholderText, { color: theme.text }]}>
                                Aucun restaurant trouvé
                            </Text>
                        </View>
                    )}
                </View>
            ) : null}

            <ScrollView
                style={[styles.content, mapMode && { display: 'none' }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Search Bar with Map Toggle */}
                <View style={[styles.searchBarWrapper, { paddingHorizontal: Spacing.md }]}>
                    <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1 }]}>
                        <Ionicons name="search" size={20} color={theme.tabIconDefault} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Rechercher dans kBouffe"
                            placeholderTextColor={theme.tabIconDefault}
                            value={search}
                            onChangeText={setSearch}
                            onSubmitEditing={() => handleSearch(search)}
                            returnKeyType="search"
                            enablesReturnKeyAutomatically
                        />
                        {search.trim() && (
                            <TouchableOpacity
                                onPress={() => handleSearch(search)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="arrow-forward" size={20} color={theme.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={[styles.modeToggleGroup, { gap: Spacing.xs }]}>
                        <TouchableOpacity
                            style={[
                                styles.modeToggleButton,
                                {
                                    backgroundColor: !mapMode ? theme.primary : theme.surface,
                                    borderColor: theme.border,
                                },
                            ]}
                            onPress={() => setMapMode(false)}
                        >
                            <Ionicons name="list" size={18} color={!mapMode ? theme.background : theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modeToggleButton,
                                {
                                    backgroundColor: mapMode ? theme.primary : theme.surface,
                                    borderColor: theme.border,
                                },
                            ]}
                            onPress={() => setMapMode(true)}
                        >
                            <Ionicons name="map" size={18} color={mapMode ? theme.background : theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Chips Section */}
                <View style={styles.filtersSection}>
                    {/* Cuisine Filter */}
                    <View style={styles.filterGroup}>
                        <Text style={[styles.filterLabel, { color: theme.text }]}>Cuisine</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsScroll}>
                            {uniqueCuisines.map(cuisine => (
                                <TouchableOpacity
                                    key={cuisine}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: selectedCuisine === cuisine ? theme.primary : theme.surface,
                                            borderColor: theme.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        { color: selectedCuisine === cuisine ? '#fff' : theme.text }
                                    ]}>
                                        {cuisine}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Delivery Time Filter */}
                    <View style={styles.filterGroup}>
                        <Text style={[styles.filterLabel, { color: theme.text }]}>Livraison</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsScroll}>
                            {deliveryTimeOptions.map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: selectedDeliveryTime === option.value ? theme.primary : theme.surface,
                                            borderColor: theme.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedDeliveryTime(selectedDeliveryTime === option.value ? null : option.value);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        { color: selectedDeliveryTime === option.value ? '#fff' : theme.text }
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Offers & Verified Toggle */}
                    <View style={styles.filterTogglesRow}>
                        <TouchableOpacity
                            style={[
                                styles.filterToggle,
                                {
                                    backgroundColor: offersOnly ? theme.primary : theme.surface,
                                    borderColor: theme.border,
                                }
                            ]}
                            onPress={() => {
                                setOffersOnly(!offersOnly);
                                Haptics.selectionAsync();
                            }}
                        >
                            <Ionicons
                                name={offersOnly ? "gift" : "gift-outline"}
                                size={16}
                                color={offersOnly ? '#fff' : theme.primary}
                                style={{ marginRight: Spacing.xs }}
                            />
                            <Text style={[
                                styles.filterToggleText,
                                { color: offersOnly ? '#fff' : theme.text }
                            ]}>
                                Offres
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterToggle,
                                {
                                    backgroundColor: verifiedOnly ? theme.primary : theme.surface,
                                    borderColor: theme.border,
                                }
                            ]}
                            onPress={() => {
                                setVerifiedOnly(!verifiedOnly);
                                Haptics.selectionAsync();
                            }}
                        >
                            <Ionicons
                                name={verifiedOnly ? "checkmark-circle" : "checkmark-circle-outline"}
                                size={16}
                                color={verifiedOnly ? '#fff' : theme.primary}
                                style={{ marginRight: Spacing.xs }}
                            />
                            <Text style={[
                                styles.filterToggleText,
                                { color: verifiedOnly ? '#fff' : theme.text }
                            ]}>
                                Vérifiés
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Recherches récentes
                        </Text>
                        <View style={styles.tagsContainer}>
                            {recentSearches.slice(0, 8).map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.tag, { backgroundColor: theme.primaryLight }]}
                                    onPress={() => handleSearch(item.query)}
                                    onLongPress={() => handleRemoveRecent(item.id)}
                                >
                                    <Ionicons name="time-outline" size={14} color={theme.primary} />
                                    <Text style={[styles.tagText, { color: theme.primary }]}>
                                        {item.query}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Order Again Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Commander à nouveau
                    </Text>
                    <FlatList
                        data={favoriteRestaurants}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.restaurantCard}
                                onPress={() => handleRestaurantPress(item.id)}
                            >
                                <View style={[styles.restaurantLogo, { backgroundColor: theme.primaryLight }]}>
                                    <Text style={styles.restaurantLogoText}>
                                        {item.name.charAt(0)}
                                    </Text>
                                </View>
                                <Text style={[styles.restaurantName, { color: theme.text }]} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                <Text style={[styles.deliveryTime, { color: theme.tabIconDefault }]}>
                                    {item.deliveryTime}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                        numColumns={2}
                    />
                </View>

                {/* Eat Healthy Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Mangez sain
                    </Text>
                    <FlatList
                        horizontal
                        data={healthyProducts}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.productCard, { borderColor: theme.border }]}
                                onPress={() => handleSearch(item.name)}
                            >
                                <Text style={styles.productEmoji}>{item.image}</Text>
                                <Text style={[styles.productName, { color: theme.text }]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                        scrollEnabled
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

                {/* Best Categories Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Meilleures catégories
                    </Text>
                    {categories.map(category => (
                        <TouchableOpacity
                            key={category.id}
                            style={[styles.categoryItem, { borderBottomColor: theme.border }]}
                            onPress={() => handleCategoryPress(category.name)}
                        >
                            <Text style={styles.categoryEmoji}>{category.icon}</Text>
                            <Text style={[styles.categoryName, { color: theme.text }]}>
                                {category.name}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                    ))}
                </View>
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
    searchBarContainer: {
        paddingVertical: Spacing.md,
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        ...Typography.body,
    },
    modeToggleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modeToggleButton: {
        width: 40,
        height: 40,
        borderRadius: Radii.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapToggleButton: {
        width: 44,
        height: 44,
        borderRadius: Radii.xl,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        flex: 1,
        width: '100%',
    },
    mapToggleFloatingButton: {
        position: 'absolute',
        top: 0,
        right: Spacing.md,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        margin: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 5,
    },
    mapPlaceholder: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    mapPlaceholderText: {
        ...Typography.subtitle1,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.subtitle2,
        marginBottom: Spacing.md,
        fontWeight: '600',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.lg,
        gap: Spacing.xs,
    },
    tagText: {
        ...Typography.caption,
        fontWeight: '500',
    },
    restaurantCard: {
        flex: 1,
        marginRight: Spacing.md,
        marginBottom: Spacing.md,
        alignItems: 'center',
    },
    restaurantLogo: {
        width: 80,
        height: 80,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    restaurantLogoText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
    },
    restaurantName: {
        ...Typography.caption,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: Spacing.xs,
        maxWidth: 80,
    },
    deliveryTime: {
        ...Typography.caption,
        fontSize: 12,
    },
    productCard: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginRight: Spacing.md,
        minWidth: 90,
    },
    productEmoji: {
        fontSize: 32,
        marginBottom: Spacing.sm,
    },
    productName: {
        ...Typography.caption,
        textAlign: 'center',
        fontWeight: '500',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        gap: Spacing.md,
    },
    categoryEmoji: {
        fontSize: 20,
    },
    categoryName: {
        flex: 1,
        ...Typography.body,
        fontWeight: '500',
    },
    filtersSection: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    filterGroup: {
        gap: Spacing.sm,
    },
    filterLabel: {
        ...Typography.caption,
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    filterChipsScroll: {
        marginHorizontal: -Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginRight: Spacing.sm,
    },
    filterChipText: {
        ...Typography.caption,
        fontWeight: '600',
        fontSize: 12,
    },
    filterTogglesRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    filterToggle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    filterToggleText: {
        ...Typography.caption,
        fontWeight: '600',
        fontSize: 12,
    },
    recenterButton: {
        position: 'absolute',
        bottom: Spacing.lg + 60,
        right: Spacing.md,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 5,
    },
});
