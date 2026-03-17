import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@kbouffe/shared-types';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
    restaurant: Restaurant;
    onPress: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

export function RestaurantCard({ restaurant, onPress, isFavorite = false, onToggleFavorite }: Props) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: theme.background, borderColor: theme.border },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
        >
            <View>
                <Image
                    source={{ uri: restaurant.coverImage }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {onToggleFavorite && (
                    <Pressable style={[styles.favoriteButton, { backgroundColor: theme.background }]} onPress={onToggleFavorite}>
                        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#ef4444' : theme.icon} />
                    </Pressable>
                )}
                {restaurant.isSponsored && (
                    <View style={styles.sponsoredBadge}>
                        <Ionicons name="megaphone-outline" size={10} color="#fff" />
                        <Text style={styles.sponsoredText}>Sponsorisé</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                        {restaurant.name}
                    </Text>
                    <View style={[styles.ratingContainer, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="star" size={12} color={theme.primary} />
                        <Text style={[styles.ratingText, { color: theme.primary }]}>
                            {(restaurant.rating ?? 0).toFixed(1)}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.description, { color: theme.icon }]} numberOfLines={2}>
                    {restaurant.description}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color={theme.icon} />
                        <Text style={[styles.infoText, { color: theme.icon }]}>
                            {restaurant.estimatedDeliveryTime} min
                        </Text>
                    </View>
                    <View style={styles.dot} />
                    <View style={styles.infoRow}>
                        <Ionicons name="bicycle-outline" size={14} color={theme.icon} />
                        <Text style={[styles.infoText, { color: theme.icon }]}>
                            {restaurant.deliveryFee === 0 ? 'Gratuit' : `${restaurant.deliveryFee} FCFA`}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    image: {
        width: '100%',
        height: 160,
    },
    content: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    title: {
        ...Typography.title3,
        flex: 1,
        marginRight: Spacing.sm,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.full,
        gap: 4,
    },
    ratingText: {
        ...Typography.small,
        fontWeight: '700',
    },
    description: {
        ...Typography.caption,
        marginBottom: Spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        ...Typography.small,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#cbd5e1',
        marginHorizontal: Spacing.sm,
    },
    sponsoredBadge: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    favoriteButton: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sponsoredText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
});
