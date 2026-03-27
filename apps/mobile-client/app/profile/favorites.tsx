import { StyleSheet, View, Text, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import { useLoyalty } from '@/contexts/loyalty-context';
import type { MobileRestaurant } from '@/lib/api';

export default function FavoritesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { restaurants } = useRestaurants();
    const { favoriteRestaurantIds, toggleRestaurantFavorite, favoriteProductIds } = useLoyalty();

    const favorites = restaurants.filter((r) => favoriteRestaurantIds.includes(r.id));

    const renderRestaurant = ({ item }: { item: MobileRestaurant }) => (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.background, borderColor: theme.border },
                pressed && { opacity: 0.95 },
            ]}
            onPress={() => router.push(`/restaurant/${item.slug}`)}
        >
            <Image source={{ uri: item.coverImage ?? undefined }} style={styles.coverImage} />
            <Pressable
                style={[styles.heartButton, { backgroundColor: theme.background }]}
                onPress={() => toggleRestaurantFavorite(item.id)}
            >
                <Ionicons name="heart" size={20} color="#ef4444" />
            </Pressable>
            <View style={styles.cardBody}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.cuisine, { color: theme.icon }]}>{item.cuisineType}</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="star" size={14} color={theme.primary} />
                    <Text style={[styles.rating, { color: theme.text }]}>{item.rating?.toFixed(1)}</Text>
                    <Text style={[styles.reviewCount, { color: theme.icon }]}>({item.reviewCount})</Text>
                    <View style={styles.dot} />
                    <Ionicons name="time-outline" size={14} color={theme.icon} />
                    <Text style={[styles.infoText, { color: theme.icon }]}>{item.estimatedDeliveryTime} min</Text>
                    <View style={styles.dot} />
                    <Text style={[styles.infoText, { color: theme.icon }]}>
                        {item.deliveryFee === 0 ? 'Livraison gratuite' : `${item.deliveryFee} FCFA`}
                    </Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={favorites}
                keyExtractor={item => item.id}
                renderItem={renderRestaurant}
                contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + Spacing.xl, gap: Spacing.md }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="heart-outline" size={56} color={theme.icon} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun favori</Text>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>
                            Les restaurants que vous aimez apparaîtront ici.
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>Plats favoris: {favoriteProductIds.length}</Text>
                        <Pressable
                            style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
                            onPress={() => router.push('/(tabs)/explore')}
                        >
                            <Text style={styles.exploreBtnText}>Explorer les restaurants</Text>
                        </Pressable>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: {
        borderRadius: Radii.lg,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    coverImage: { width: '100%', height: 140 },
    heartButton: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    cardBody: { padding: Spacing.md },
    name: { ...Typography.body, fontWeight: '600', marginBottom: 2 },
    cuisine: { ...Typography.caption, marginBottom: Spacing.sm },
    infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
    rating: { ...Typography.caption, fontWeight: '600' },
    reviewCount: { ...Typography.small },
    infoText: { ...Typography.caption },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#cbd5e1',
        marginHorizontal: 2,
    },
    empty: { alignItems: 'center', paddingVertical: Spacing.xxl * 2, gap: Spacing.md },
    emptyTitle: { ...Typography.title3 },
    emptyText: { ...Typography.body, textAlign: 'center', paddingHorizontal: Spacing.xl },
    exploreBtn: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radii.full,
        marginTop: Spacing.sm,
    },
    exploreBtnText: { color: '#fff', ...Typography.body, fontWeight: '600' },
});
