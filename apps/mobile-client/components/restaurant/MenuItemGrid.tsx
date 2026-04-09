import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MobileProduct } from '@/lib/api';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
    item: MobileProduct;
    onAdd: () => void;
}

export function MenuItemGrid({ item, onAdd }: Props) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: theme.background, borderColor: theme.border },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={onAdd}
        >
            {/* Image */}
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.border + '50' }]}>
                    <Ionicons name="fast-food-outline" size={32} color={theme.border} />
                </View>
            )}

            {/* Info */}
            <View style={styles.info}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                    {item.name}
                </Text>
                {item.description ? (
                    <Text style={[styles.description, { color: theme.icon }]} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
                <View style={styles.footer}>
                    <Text style={[styles.price, { color: theme.primary }]}>
                        {item.price.toLocaleString()} FCFA
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.addButton,
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.9 }] },
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAdd();
                        }}
                        hitSlop={8}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: Radii.lg,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    image: {
        width: '100%',
        height: 120,
    },
    imagePlaceholder: {
        width: '100%',
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        padding: Spacing.sm,
        flex: 1,
        justifyContent: 'space-between',
    },
    title: {
        ...Typography.body,
        fontWeight: '600',
        marginBottom: 2,
        lineHeight: 18,
    },
    description: {
        ...Typography.caption,
        marginBottom: Spacing.xs,
        lineHeight: 16,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    price: {
        ...Typography.caption,
        fontWeight: '700',
        flexShrink: 1,
        marginRight: 4,
    },
    addButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});
