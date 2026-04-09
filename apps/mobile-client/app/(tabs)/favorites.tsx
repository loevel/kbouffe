import { StyleSheet, View, Text, Pressable, SectionList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/contexts/favorites-context';
import { CustomHeader } from '@/components/CustomHeader';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EmptyState } from '@/components/ui/EmptyState';

export default function FavoritesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { favorites, removeFavorite, getFavoritesByRestaurant } = useFavorites();

    // Group favorites by restaurant
    const sections = Array.from(
        new Map(
            favorites.map(fav => [fav.restaurantId, fav])
        ).entries()
    ).map(([restaurantId, representative]) => {
        const items = getFavoritesByRestaurant(restaurantId);
        return {
            title: representative.restaurantName,
            logo: representative.restaurantLogo,
            restaurantId,
            data: items,
        };
    });

    const handleRemoveFavorite = (productId: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        removeFavorite(productId);
    };

    const handleAddToCart = (productId: string, productName: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: implement add to cart
        console.log('Add to cart:', productId);
    };

    if (favorites.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <CustomHeader
                    title="Mes Favoris"
                    showSearch={false}
                    showCart={true}
                    showBack={false}
                />
                <EmptyState
                    icon="heart-outline"
                    title="Aucun article favori"
                    subtitle="Explorez les restaurants et likez vos plats préférés pour les retrouver ici."
                    primaryAction={{
                        label: 'Découvrir les restaurants',
                        onPress: () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/(tabs)/explore');
                        },
                    }}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <CustomHeader
                title="Mes Favoris"
                showSearch={false}
                showCart={true}
                showBack={false}
            />
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    {favorites.length} article{favorites.length > 1 ? 's' : ''}
                </Text>
            </View>

            {/* Favorites list */}
            <SectionList
                sections={sections}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <Animated.View
                        entering={FadeInDown.springify()}
                        style={[
                            styles.favoriteItem,
                            { backgroundColor: theme.surface },
                        ]}
                    >
                        {/* Product Image */}
                        {item.product.image ? (
                            <Image
                                source={{ uri: item.product.image }}
                                style={styles.itemImage}
                            />
                        ) : (
                            <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.primary + '12' }]}>
                                <Ionicons name="fast-food-outline" size={24} color={theme.primary} />
                            </View>
                        )}

                        {/* Product Info */}
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
                                {item.product.name}
                            </Text>
                            {item.product.description && (
                                <Text style={[styles.itemDescription, { color: theme.icon }]} numberOfLines={1}>
                                    {item.product.description}
                                </Text>
                            )}
                            <Text style={[styles.itemPrice, { color: theme.primary }]}>
                                {(item.product.price ?? 0).toLocaleString('fr-FR')} FCFA
                            </Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.itemActions}>
                            <Pressable
                                onPress={() => handleRemoveFavorite(item.product.id)}
                                style={({ pressed }) => [
                                    styles.actionBtn,
                                    { backgroundColor: '#ef444412', borderColor: '#ef444430' },
                                    pressed && { opacity: 0.7 },
                                ]}
                                hitSlop={8}
                            >
                                <Ionicons name="heart" size={18} color="#ef4444" />
                            </Pressable>
                            <Pressable
                                onPress={() => handleAddToCart(item.product.id, item.product.name)}
                                style={({ pressed }) => [
                                    styles.actionBtn,
                                    { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' },
                                    pressed && { opacity: 0.7 },
                                ]}
                                hitSlop={8}
                            >
                                <Ionicons name="add" size={18} color={theme.primary} />
                            </Pressable>
                        </View>
                    </Animated.View>
                )}
                renderSectionHeader={({ section: { title, logo } }) => (
                    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                        {logo && (
                            <Image source={{ uri: logo }} style={styles.restaurantLogo} />
                        )}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    title: {
        ...Typography.title2,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.caption,
    },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    sectionHeader: {
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    restaurantLogo: {
        width: 32,
        height: 32,
        borderRadius: Radii.md,
    },
    sectionTitle: {
        ...Typography.captionSemibold,
        flex: 1,
    },
    favoriteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: Radii.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    itemImage: {
        width: 72,
        height: 72,
        borderRadius: Radii.md,
    },
    itemImagePlaceholder: {
        width: 72,
        height: 72,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        ...Typography.caption,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    itemDescription: {
        ...Typography.small,
        marginBottom: Spacing.xs,
    },
    itemPrice: {
        ...Typography.captionSemibold,
        fontWeight: '700',
    },
    itemActions: {
        gap: Spacing.xs,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
