import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { calculateDistance, formatDistance, getUserLocation, type UserLocation } from '@/lib/location-utils';

export default function MapScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { restaurants } = useRestaurants();
    const mapViewRef = useRef<MapView | null>(null);

    const [search, setSearch] = useState('');
    const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: 45.5017,
        longitude: -73.5673,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    });

    // Request user location on mount
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

    // Filter restaurants by search
    const filteredRestaurants = useMemo(() => {
        if (!search.trim()) return restaurants;
        return restaurants.filter(r =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.cuisineType?.toLowerCase().includes(search.toLowerCase())
        );
    }, [restaurants, search]);

    const handleRestaurantPress = useCallback((restaurantId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedRestaurant(restaurantId);
    }, []);

    const handleMarkerPress = useCallback((restaurantId: string) => {
        handleRestaurantPress(restaurantId);
    }, [handleRestaurantPress]);

    const handleRecenter = useCallback(() => {
        if (mapViewRef.current && userLocation) {
            mapViewRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 300);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [userLocation]);

    const selectedRestaurantData = useMemo(() => {
        return restaurants.find(r => r.id === selectedRestaurant);
    }, [restaurants, selectedRestaurant]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { paddingTop: insets.top, paddingHorizontal: Spacing.md }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.tabIconDefault} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Rechercher des restaurants"
                        placeholderTextColor={theme.tabIconDefault}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.trim() && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Map */}
            <MapView
                ref={mapViewRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={
                    userLocation
                        ? {
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
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

                        return (
                            <Marker
                                key={restaurant.id}
                                coordinate={{
                                    latitude: restaurant.lat!,
                                    longitude: restaurant.lng!,
                                }}
                                title={restaurant.name}
                                description={`${restaurant.cuisineType || 'Restaurant'} • ${restaurant.estimatedDeliveryTime || 30}min${
                                    distance ? ` • ${formatDistance(distance)}` : ''
                                }`}
                                onPress={() => handleMarkerPress(restaurant.id)}
                                pinColor={selectedRestaurant === restaurant.id ? theme.primary : '#FF6B6B'}
                            />
                        );
                    })}
            </MapView>

            {/* Recenter Button */}
            {userLocation && (
                <TouchableOpacity
                    style={[styles.recenterButton, { backgroundColor: theme.primary }]}
                    onPress={handleRecenter}
                >
                    <Ionicons name="locate" size={20} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Bottom Sheet - Selected Restaurant */}
            {selectedRestaurantData && (
                <View style={[styles.bottomSheet, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    <View style={styles.dragHandle} />
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.bottomSheetContent}>
                        <Text style={[styles.restaurantName, { color: theme.text }]}>
                            {selectedRestaurantData.name}
                        </Text>

                        <View style={styles.restaurantMeta}>
                            <Ionicons name="star" size={16} color="#fbbf24" />
                            <Text style={[styles.ratingText, { color: theme.text }]}>
                                {selectedRestaurantData.rating?.toFixed(1) ?? '—'}
                            </Text>
                            {selectedRestaurantData.cuisineType && (
                                <>
                                    <View style={[styles.metaDot, { backgroundColor: theme.border }]} />
                                    <Text style={[styles.cuisineText, { color: theme.icon }]}>
                                        {selectedRestaurantData.cuisineType}
                                    </Text>
                                </>
                            )}
                        </View>

                        <Text style={[styles.deliveryInfo, { color: theme.icon }]}>
                            <Ionicons name="time-outline" size={14} /> {selectedRestaurantData.estimatedDeliveryTime ?? 30} min • Frais: {selectedRestaurantData.deliveryFee ?? 500} FCFA
                        </Text>

                        <TouchableOpacity
                            style={[styles.viewButton, { backgroundColor: theme.primary }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/restaurant/${selectedRestaurantData.slug}`);
                            }}
                        >
                            <Text style={styles.viewButtonText}>Voir le restaurant</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        paddingBottom: Spacing.md,
        gap: Spacing.md,
        zIndex: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        ...Typography.body,
    },
    map: {
        flex: 1,
        width: '100%',
    },
    recenterButton: {
        position: 'absolute',
        bottom: 100,
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
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.lg,
        maxHeight: '40%',
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#ccc',
        alignSelf: 'center',
        marginVertical: Spacing.sm,
    },
    bottomSheetContent: {
        paddingTop: Spacing.sm,
    },
    restaurantName: {
        ...Typography.title2,
        fontWeight: '700',
        marginBottom: Spacing.sm,
    },
    restaurantMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.xs,
    },
    ratingText: {
        ...Typography.caption,
        fontWeight: '600',
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    cuisineText: {
        ...Typography.caption,
        fontSize: 11,
    },
    deliveryInfo: {
        ...Typography.small,
        marginBottom: Spacing.md,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radii.lg,
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    viewButtonText: {
        color: '#fff',
        ...Typography.body,
        fontWeight: '600',
    },
});
