/**
 * app/map-picker.tsx
 * Écran de sélection d'adresse sur la carte.
 * - L'utilisateur déplace le pin pour choisir une position
 * - Reverse geocode via l'API Nominatim (OpenStreetMap, gratuit)
 * - Retourne { address, city, lat, lng } via router.back() + setParams
 *
 * Utilisation :
 *   router.push({ pathname: '/map-picker', params: { lat: '3.86', lng: '11.52', label: 'Maison' } })
 *   // puis dans la page précédente, récupérer via useLocalSearchParams après retour
 */
import { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import MapView, {
    Marker,
    UrlTile,
    type Region,
    PROVIDER_DEFAULT,
} from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
// Douala city center as default
const DEFAULT_LAT = 4.0511;
const DEFAULT_LNG = 9.7679;

interface PickedAddress {
    address: string;
    city: string;
    lat: number;
    lng: number;
}

async function reverseGeocode(lat: number, lng: number): Promise<PickedAddress> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'KBouffe/1.0 (contact@kbouffe.com)' },
    });
    if (!res.ok) throw new Error('Erreur de géocodage');
    const data = await res.json();
    const addr = data.address ?? {};
    const road = addr.road ?? addr.pedestrian ?? addr.residential ?? '';
    const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
    const quarter = addr.quarter ?? addr.suburb ?? addr.neighbourhood ?? '';
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? 'Douala';
    const parts = [houseNumber + road, quarter].filter(Boolean);
    return {
        address: (parts.join(', ') || data.display_name?.split(',')[0]) ?? 'Position sélectionnée',
        city,
        lat,
        lng,
    };
}

export default function MapPickerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const params = useLocalSearchParams<{ lat?: string; lng?: string; label?: string }>();

    const initialLat = params.lat ? parseFloat(params.lat) : DEFAULT_LAT;
    const initialLng = params.lng ? parseFloat(params.lng) : DEFAULT_LNG;

    const [markerCoord, setMarkerCoord] = useState({ lat: initialLat, lng: initialLng });
    const [pickedAddress, setPickedAddress] = useState<PickedAddress | null>(null);
    const [geocoding, setGeocoding] = useState(false);
    const mapRef = useRef<MapView>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const doReverseGeocode = useCallback(async (lat: number, lng: number) => {
        setGeocoding(true);
        try {
            const result = await reverseGeocode(lat, lng);
            setPickedAddress(result);
        } catch {
            setPickedAddress({ address: 'Position sélectionnée', city: 'Douala', lat, lng });
        } finally {
            setGeocoding(false);
        }
    }, []);

    const handleRegionChangeComplete = useCallback((region: Region) => {
        const { latitude, longitude } = region;
        setMarkerCoord({ lat: latitude, lng: longitude });
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            doReverseGeocode(latitude, longitude);
        }, 600);
    }, [doReverseGeocode]);

    const handleLocateMe = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Localisation bloquée',
                canAskAgain
                    ? 'Autorisez la localisation pour vous positionner sur la carte.'
                    : 'La localisation est bloquée. Activez-la dans les Paramètres de l\'application.',
                canAskAgain
                    ? [{ text: 'OK' }]
                    : [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Ouvrir les Paramètres', onPress: () => Linking.openSettings() },
                    ]
            );
            return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;
        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 600);
        setMarkerCoord({ lat: latitude, lng: longitude });
        doReverseGeocode(latitude, longitude);
    };

    const handleConfirm = () => {
        if (!pickedAddress) {
            doReverseGeocode(markerCoord.lat, markerCoord.lng);
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
        // Pass result via global callback registered by the calling screen
        mapPickerCallback?.(pickedAddress);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: theme.background }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.backBtn, { backgroundColor: theme.border }]}
                    hitSlop={8}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {params.label ? `Positionner — ${params.label}` : 'Choisir sur la carte'}
                </Text>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFillObject}
                    provider={PROVIDER_DEFAULT}
                    mapType="none"
                    initialRegion={{
                        latitude: initialLat,
                        longitude: initialLng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    onRegionChangeComplete={handleRegionChangeComplete}
                >
                    <UrlTile
                        urlTemplate={OSM_TILE_URL}
                        maximumZ={19}
                        flipY={false}
                        tileSize={256}
                    />
                </MapView>

                {/* Center pin (static visual — moves with the map) */}
                <View style={styles.pinContainer} pointerEvents="none">
                    <Ionicons name="location" size={44} color="#f97316" />
                    <View style={styles.pinShadow} />
                </View>

                {/* Locate me button */}
                <Pressable
                    style={[styles.locateBtn, { backgroundColor: theme.background }]}
                    onPress={handleLocateMe}
                    accessibilityLabel="Me localiser"
                >
                    <Ionicons name="locate" size={22} color={theme.primary} />
                </Pressable>
            </View>

            {/* Bottom card */}
            <View style={[styles.bottomCard, { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.md }]}>
                <Text style={[styles.hint, { color: theme.icon }]}>
                    Déplacez la carte pour positionner le pin
                </Text>
                <View style={[styles.addressBox, { backgroundColor: theme.border + '40', borderColor: theme.border }]}>
                    {geocoding ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <>
                            <Ionicons name="location-outline" size={18} color={theme.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={2}>
                                    {pickedAddress?.address ?? 'Déplacez la carte pour voir l\'adresse'}
                                </Text>
                                {pickedAddress?.city ? (
                                    <Text style={[styles.cityText, { color: theme.icon }]}>{pickedAddress.city}</Text>
                                ) : null}
                            </View>
                        </>
                    )}
                </View>
                <Pressable
                    style={[styles.confirmBtn, { backgroundColor: theme.primary, opacity: geocoding ? 0.6 : 1 }]}
                    onPress={handleConfirm}
                    disabled={geocoding}
                >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.confirmBtnText}>Confirmer cette adresse</Text>
                </Pressable>
            </View>
        </View>
    );
}

/** Global callback used by calling screens to receive the picked address */
let mapPickerCallback: ((addr: PickedAddress) => void) | null = null;

export function setMapPickerCallback(cb: (addr: PickedAddress) => void) {
    mapPickerCallback = cb;
}

export type { PickedAddress };

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        gap: Spacing.md,
        zIndex: 10,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...Typography.headline, flex: 1 },
    mapContainer: { flex: 1, position: 'relative' },
    pinContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -22,
        marginTop: -44,
        alignItems: 'center',
    },
    pinShadow: {
        width: 8,
        height: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.25)',
        marginTop: -2,
    },
    locateBtn: {
        position: 'absolute',
        bottom: Spacing.lg,
        right: Spacing.md,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    bottomCard: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        gap: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
    },
    hint: { ...Typography.caption, textAlign: 'center' },
    addressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
        padding: Spacing.md,
        minHeight: 60,
    },
    addressText: { ...Typography.body },
    cityText: { ...Typography.caption, marginTop: 2 },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radii.lg,
    },
    confirmBtnText: { color: '#fff', ...Typography.bodySemibold },
});
