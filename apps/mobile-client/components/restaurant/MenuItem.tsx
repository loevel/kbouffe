import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Product } from '@kbouffe/shared-types';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
    item: Product;
    onAdd: () => void;
}

export function MenuItem({ item, onAdd }: Props) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: theme.background, borderColor: theme.border },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => {
                // If the user wants to navigate to product modal, they tap the card
                // The parent usually passes onAdd which is add to cart.
                // We let the parent handle the press through onAdd for now.
                onAdd();
            }}
        >
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={[styles.description, { color: theme.icon }]} numberOfLines={2}>
                    {item.description}
                </Text>
                <Text style={[styles.price, { color: theme.primary }]}>
                    {item.price} FCFA
                </Text>
            </View>

            {item.image ? (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.image}
                    />
                    <Pressable
                        style={({ pressed }) => [
                            styles.addButtonOverlay, 
                            { backgroundColor: theme.background, shadowColor: theme.text },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.9 }] }
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAdd();
                        }}
                    >
                        <Ionicons name="add" size={16} color={theme.primary} />
                    </Pressable>
                </View>
            ) : (
                <View style={styles.noImageAddContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.addButton, 
                            { backgroundColor: theme.primary + '15' },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.9 }] }
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAdd();
                        }}
                    >
                        <Ionicons name="add" size={20} color={theme.primary} />
                    </Pressable>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    content: {
        flex: 1,
        marginRight: Spacing.md,
        justifyContent: 'center',
    },
    title: {
        ...Typography.body,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        ...Typography.caption,
        marginBottom: 8,
    },
    price: {
        ...Typography.body,
        fontWeight: '700',
    },
    imageContainer: {
        position: 'relative',
        width: 80,
        height: 80,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: Radii.md,
    },
    addButtonOverlay: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    noImageAddContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
