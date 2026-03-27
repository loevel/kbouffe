import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@kbouffe/shared-types';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
        <Animated.View entering={FadeInDown.duration(500).springify()}>
            <Pressable
                onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: theme.surface },
                Shadows.md,
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
                    <Pressable 
                        style={[styles.favoriteButton, { backgroundColor: theme.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 }]} 
                        onPress={onToggleFavorite}
                    >
                        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#ef4444' : theme.icon} />
                    </Pressable>
                )}
                {restaurant.isSponsored && (
                    <View style={[styles.sponsoredBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="megaphone" size={12} color="#fff" />
                        <Text style={styles.sponsoredText}>Sponsorisé</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                        {restaurant.name}
                    </Text>
                    <View style={[styles.ratingContainer, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="star" size={14} color={theme.primary} />
                        <Text style={[styles.ratingText, { color: theme.primary }]}>
                            {(restaurant.rating ?? 0).toFixed(1)}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
                    {restaurant.description}
                </Text>

                <View style={styles.footer}>
                    <View style={[styles.tag, { backgroundColor: theme.background }]}>
                        <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                        <Text style={[styles.infoText, { color: theme.textMuted }]}>
                            {restaurant.estimatedDeliveryTime} min
                        </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: theme.background }]}>
                        <Ionicons name="bicycle-outline" size={14} color={theme.textMuted} />
                        <Text style={[styles.infoText, { color: theme.textMuted }]}>
                            {restaurant.deliveryFee === 0 ? 'Livraison offerte' : `${restaurant.deliveryFee} FCFA`}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Radii.xl,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    image: {
        width: '100%',
        height: 180,
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
        paddingVertical: 6,
        borderRadius: Radii.md,
        gap: 4,
    },
    ratingText: {
        ...Typography.captionSemibold,
    },
    description: {
        ...Typography.caption,
        marginBottom: Spacing.md,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: Radii.sm,
        gap: 6,
    },
    infoText: {
        ...Typography.small,
        fontWeight: '500',
    },
    sponsoredBadge: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.sm,
    },
    favoriteButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sponsoredText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});